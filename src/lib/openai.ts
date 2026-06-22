/**
 * Server-only OpenAI helpers. Never import from client components — the key
 * lives in process.env.OPENAI_API_KEY and must not reach the browser.
 */
import "server-only";

const KEY = process.env.OPENAI_API_KEY;
const VISION_MODEL = process.env.OPENAI_VISION_MODEL || "gpt-5.1-chat-latest";
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";

function requireKey(): string {
  if (!KEY) throw new Error("OPENAI_API_KEY is not set");
  return KEY;
}

/**
 * Vision read → strict JSON. Sends a system prompt + a user prompt + one image
 * (as a data URL) and returns the parsed JSON object.
 */
export async function visionJSON<T>(opts: {
  system: string;
  user: string;
  imageDataUrl: string;
  /** Override the model (e.g. a temperature-0-capable one). */
  model?: string;
  /** Pin determinism where the model allows it. */
  temperature?: number;
}): Promise<T> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requireKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model || VISION_MODEL,
      ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: opts.system },
        {
          role: "user",
          content: [
            { type: "text", text: opts.user },
            { type: "image_url", image_url: { url: opts.imageDataUrl } },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI vision ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(content) as T;
}

/**
 * Text-only completion → strict JSON. For outputs that don't need the photo
 * (e.g. a haircare routine derived from a questionnaire + the prior read).
 */
export async function chatJSON<T>(opts: {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
}): Promise<T> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requireKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model || VISION_MODEL,
      ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI chat ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return JSON.parse(data.choices?.[0]?.message?.content ?? "{}") as T;
}

/**
 * Face-preserving image edit. Sends the source photo + a prompt to the image
 * edit endpoint and returns the result as a base64 PNG string.
 * v1 is mask-less (prompt-driven identity preservation).
 */
export async function editImage(opts: {
  image: Blob;
  prompt: string;
  size?: "1024x1024" | "1024x1536" | "1536x1024" | "auto";
  /** low|medium|high|auto — lower is much faster. Default medium for previews. */
  quality?: "low" | "medium" | "high" | "auto";
}): Promise<string> {
  const form = new FormData();
  form.append("model", IMAGE_MODEL);
  form.append("image", opts.image, "selfie.jpg");
  form.append("prompt", opts.prompt);
  form.append("size", opts.size ?? "1024x1536");
  form.append("quality", opts.quality ?? "medium");
  form.append("n", "1");

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${requireKey()}` },
    body: form,
  });

  if (!res.ok) {
    throw new Error(`OpenAI image edit ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  const b64: string | undefined = data.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI image edit returned no image");
  return b64;
}
