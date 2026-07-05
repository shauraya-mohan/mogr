import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { derivePalette, type Undertone, type SkinShade } from "@/lib/wardrobe/palette";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("undertone, skin_shade, hair_tone, palette")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.undertone) {
    return NextResponse.json({ error: "no-undertone" }, { status: 404 });
  }

  const undertone = profile.undertone as Undertone;
  const skinShade = (profile.skin_shade ?? "Medium") as SkinShade;
  const hairTone  = (profile.hair_tone as string | null) ?? "unclear";
  const cacheKey  = `${undertone}:${skinShade}:${hairTone}`;

  // Return cached palette when inputs haven't changed
  const stored = profile.palette as (Record<string, unknown> & { _cacheKey?: string }) | null;
  if (stored?._cacheKey === cacheKey) {
    return NextResponse.json(stored);
  }

  const palette = {
    ...derivePalette(undertone, skinShade, hairTone, new Date().toISOString()),
    _cacheKey: cacheKey,
  };

  await supabase
    .from("profiles")
    .update({ palette, palette_generated_at: palette.generatedAt })
    .eq("id", user.id);

  return NextResponse.json(palette);
}
