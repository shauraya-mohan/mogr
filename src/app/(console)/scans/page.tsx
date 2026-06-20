"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/Button";
import { createClient } from "@/lib/supabase/client";

interface StyleTile {
  id: string;
  name: string;
  url: string | null;
}
interface ScanCard {
  id: string;
  date: string;
  originalUrl: string | null;
  hair: StyleTile[];
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function ScansPage() {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<ScanCard[]>([]);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: scans }, { data: styles }] = await Promise.all([
        supabase
          .from("scans")
          .select("id, storage_path, created_at")
          .eq("user_id", user.id)
          .eq("kind", "selfie")
          .order("created_at", { ascending: false }),
        supabase
          .from("hair_styles")
          .select("id, name, preview_path, status, scan_id")
          .eq("user_id", user.id)
          .order("sort_order", { ascending: true }),
      ]);

      // Batch-sign every storage path we need (originals + ready previews).
      const paths = [
        ...(scans ?? []).map((s) => s.storage_path),
        ...(styles ?? []).map((s) => s.preview_path).filter(Boolean),
      ] as string[];
      const signedMap = new Map<string, string>();
      if (paths.length) {
        const { data: signed } = await supabase.storage
          .from("user-media")
          .createSignedUrls(paths, 3600);
        (signed ?? []).forEach((s) => {
          if (s.path && s.signedUrl) signedMap.set(s.path, s.signedUrl);
        });
      }

      const built: ScanCard[] = (scans ?? []).map((scan) => ({
        id: scan.id,
        date: fmtDate(scan.created_at),
        originalUrl: signedMap.get(scan.storage_path) ?? null,
        hair: (styles ?? [])
          .filter((st) => st.scan_id === scan.id)
          .map((st) => ({
            id: st.id,
            name: st.name,
            url: st.preview_path ? (signedMap.get(st.preview_path) ?? null) : null,
          })),
      }));

      setCards(built);
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <header className="mb-[clamp(24px,4vh,40px)] flex items-end justify-between gap-6">
        <div>
          <p className="eyebrow mb-3">your scans</p>
          <h1 className="font-display text-[clamp(32px,5vw,48px)] font-bold leading-[0.95] tracking-[-0.04em]">
            Scans
          </h1>
        </div>
        <Button href="/scan">New scan</Button>
      </header>

      {loading ? (
        <p className="font-mono text-[13px] text-stone">Loading…</p>
      ) : cards.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-[var(--ink-12)] p-10 text-center">
          <p className="font-display text-[22px] font-bold tracking-[-0.02em] mb-2">
            No scans yet<span className="dot">.</span>
          </p>
          <p className="text-graphite text-[15px] mb-6">
            Take your first scan and your reads will live here.
          </p>
          <Button href="/scan" size="lg">
            Start a scan
          </Button>
        </div>
      ) : (
        <div className="space-y-[clamp(16px,2.5vw,24px)]">
          {cards.map((scan) => (
            <article
              key={scan.id}
              className="overflow-hidden rounded-[20px] border border-[var(--ink-08)] bg-cloud"
            >
              <div className="grid md:grid-cols-[228px_1fr]">
                {/* Date + original photo */}
                <div className="border-b border-[var(--ink-08)] p-5 md:border-b-0 md:border-r">
                  <p className="mb-3 font-display text-[15px] font-bold tracking-[-0.01em] text-ink">
                    {scan.date}
                  </p>
                  <div className="relative aspect-[3/4] max-w-[180px] overflow-hidden rounded-[12px] bg-[#2C2B27]">
                    {scan.originalUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={scan.originalUrl}
                        alt="Original scan"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <p className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-stone">
                    original photo
                  </p>
                </div>

                {/* Results */}
                <div className="space-y-6 p-5">
                  <section>
                    <p className="mb-3 font-display text-[18px] font-bold tracking-[-0.02em] text-ink">
                      Hair
                    </p>
                    {scan.hair.length ? (
                      <div className="flex flex-wrap gap-3">
                        {scan.hair.map((h) => (
                          <Link
                            key={h.id}
                            href="/hair"
                            title={h.name}
                            className="group relative h-[104px] w-[104px] shrink-0 overflow-hidden rounded-[12px] border border-[var(--ink-08)] bg-[#2C2B27]"
                          >
                            {h.url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={h.url}
                                alt={h.name}
                                className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
                              />
                            ) : (
                              <span className="absolute inset-0 grid place-items-center p-2 text-center font-display text-[11px] font-medium leading-tight text-[#F4F2EC]/60">
                                {h.name}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="font-mono text-[12px] text-stone">
                        No styles yet —{" "}
                        <Link href="/hair" className="text-bronze hover:text-ink">
                          generate them
                        </Link>
                      </p>
                    )}
                  </section>

                  <section>
                    <p className="mb-3 font-display text-[18px] font-bold tracking-[-0.02em] text-ink">
                      Facial hair
                    </p>
                    <p className="font-mono text-[12px] tracking-[0.04em] text-stone">
                      Coming soon<span className="dot">.</span>
                    </p>
                  </section>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
