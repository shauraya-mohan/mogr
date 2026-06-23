"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Button from "@/components/Button";
import { createClient } from "@/lib/supabase/client";
import { SKIN_QUESTIONS } from "@/lib/skin/content";

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
interface SkinDetail {
  label: string;
  value: string;
}
interface SkinScan {
  id: string;
  date: string;
  photoUrl: string | null;
  details: SkinDetail[] | null; // present only for the latest analysed scan
}

/** Map stored skin questionnaire answers → human label/value pairs. */
function mapSkinAnswers(q: Record<string, string>): SkinDetail[] {
  return SKIN_QUESTIONS.map((question) => {
    const val = q[question.id];
    if (!val) return null;
    const opt = question.options.find((o) => o.value === val);
    return { label: question.label, value: opt?.label ?? val };
  }).filter(Boolean) as SkinDetail[];
}

const SCAN_TABS = [
  { key: "selfie", label: "Hair & facial hair" },
  { key: "skin", label: "Skin" },
] as const;
type ScanTab = (typeof SCAN_TABS)[number]["key"];

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

/* ------------------------------------------------------------------ */
/*  Two-step delete confirmation modal                                 */
/* ------------------------------------------------------------------ */
type ConfirmStep = "ask" | "verify";

function DeleteModal({
  scanDate,
  onCancel,
  onConfirm,
  deleting,
}: {
  scanDate: string;
  onCancel: () => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  const [step, setStep] = useState<ConfirmStep>("ask");

  return (
    /* backdrop */
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-[rgba(0,0,0,0.45)] backdrop-blur-[6px]"
      onClick={onCancel}
    >
      {/* panel */}
      <div
        className="relative mx-4 w-full max-w-[380px] overflow-hidden rounded-[20px] border border-[var(--ink-12)] bg-cloud p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "modalIn 0.28s cubic-bezier(0.16,1,0.3,1)" }}
      >
        {/* close X */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-stone transition-colors hover:bg-[var(--ink-08)] hover:text-ink"
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>

        {step === "ask" ? (
          <>
            {/* Step 1 — initial prompt */}
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(176,122,60,0.12)]">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--bronze)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </div>
            <h2 className="mt-3 font-display text-[20px] font-bold tracking-[-0.02em] text-ink">
              Delete scan<span className="dot">?</span>
            </h2>
            <p className="mt-2 text-[14px] leading-[1.5] text-graphite">
              This will permanently remove the scan from <span className="font-medium text-ink">{scanDate}</span> along with its associated hairstyle previews.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 rounded-[10px] border border-[var(--ink-12)] bg-transparent px-4 py-2.5 font-display text-[14px] font-medium text-ink transition-colors hover:bg-[var(--ink-08)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep("verify")}
                className="flex-1 rounded-[10px] bg-[var(--bronze)] px-4 py-2.5 font-display text-[14px] font-medium text-white transition-colors hover:brightness-110"
              >
                Delete
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Step 2 — double verification */}
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(176,122,60,0.12)]">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--bronze)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v4M12 17h.01" />
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              </svg>
            </div>
            <h2 className="mt-3 font-display text-[20px] font-bold tracking-[-0.02em] text-ink">
              Are you sure<span className="dot">?</span>
            </h2>
            <p className="mt-2 text-[14px] leading-[1.5] text-graphite">
              This action <span className="font-medium text-ink">cannot be undone</span>. The scan photo and all generated previews will be permanently deleted.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={deleting}
                className="flex-1 rounded-[10px] border border-[var(--ink-12)] bg-transparent px-4 py-2.5 font-display text-[14px] font-medium text-ink transition-colors hover:bg-[var(--ink-08)] disabled:opacity-40"
              >
                Go back
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={deleting}
                className="flex-1 rounded-[10px] bg-[var(--bronze)] px-4 py-2.5 font-display text-[14px] font-medium text-white transition-colors hover:brightness-110 disabled:opacity-60"
              >
                {deleting ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                    Deleting…
                  </span>
                ) : (
                  "Yes, delete forever"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Trash icon button per card                                         */
/* ------------------------------------------------------------------ */
function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Delete scan"
      className="group grid h-8 w-8 place-items-center rounded-full border border-transparent text-stone transition-all hover:border-[rgba(176,122,60,0.35)] hover:bg-[rgba(176,122,60,0.10)] hover:text-bronze"
    >
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */
export default function ScansPage() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ScanTab>("selfie");
  const [cards, setCards] = useState<ScanCard[]>([]);
  const [skinCards, setSkinCards] = useState<SkinScan[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; date: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: selfies }, { data: styles }, { data: skins }, { data: skinProfile }] =
        await Promise.all([
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
          supabase
            .from("scans")
            .select("id, storage_path, created_at")
            .eq("user_id", user.id)
            .eq("kind", "skin")
            .order("created_at", { ascending: false }),
          supabase
            .from("skin_profiles")
            .select("scan_id, questionnaire")
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);

      // Batch-sign every storage path (selfies + hair previews + skin photos).
      const paths = [
        ...(selfies ?? []).map((s) => s.storage_path),
        ...(styles ?? []).map((s) => s.preview_path).filter(Boolean),
        ...(skins ?? []).map((s) => s.storage_path),
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

      setCards(
        (selfies ?? []).map((scan) => ({
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
        })),
      );

      // Manual details only exist for the latest analysed skin scan (per design).
      const analysedScanId = skinProfile?.scan_id as string | undefined;
      const q = (skinProfile?.questionnaire ?? null) as Record<string, string> | null;
      setSkinCards(
        (skins ?? []).map((scan) => ({
          id: scan.id,
          date: fmtDate(scan.created_at),
          photoUrl: signedMap.get(scan.storage_path) ?? null,
          details: analysedScanId && scan.id === analysedScanId && q ? mapSkinAnswers(q) : null,
        })),
      );

      setLoading(false);
    })();
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/scans/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setCards((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        setSkinCards((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      }
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget]);

  const newScanHref = tab === "skin" ? "/skin?new=1" : "/scan";

  return (
    <>
      {/* Modal keyframe (scoped to this page) */}
      <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.96) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>

      <header className="mb-[clamp(20px,3vh,32px)] flex items-end justify-between gap-6">
        <div>
          <p className="eyebrow mb-3">your scans</p>
          <h1 className="font-display text-[clamp(32px,5vw,48px)] font-bold leading-[0.95] tracking-[-0.04em]">
            Scans
          </h1>
        </div>
        <Button href={newScanHref} dot={false}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {tab === "skin" ? "New skin scan" : "New scan"}
        </Button>
      </header>

      {/* Tabs */}
      <div className="mb-7 flex gap-7 border-b border-[var(--ink-08)]">
        {SCAN_TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              aria-current={active ? "page" : undefined}
              className={`relative -mb-px pb-3 font-mono text-[12px] uppercase tracking-[0.12em] transition-colors ${
                active ? "text-bronze" : "text-stone hover:text-ink"
              }`}
            >
              {t.label}
              {active && <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-bronze" />}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="font-mono text-[13px] text-stone">Loading…</p>
      ) : tab === "selfie" ? (
        cards.length === 0 ? (
          <EmptyState href="/scan" label="hair scans" />
        ) : (
          <div className="space-y-[clamp(16px,2.5vw,24px)]">
            {cards.map((scan) => (
              <article
                key={scan.id}
                className="overflow-hidden rounded-[20px] border border-[var(--ink-08)] bg-cloud"
              >
                <div className="grid md:grid-cols-[228px_1fr]">
                  <div className="border-b border-[var(--ink-08)] p-5 md:border-b-0 md:border-r">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="font-display text-[15px] font-bold tracking-[-0.01em] text-ink">
                        {scan.date}
                      </p>
                      <DeleteButton onClick={() => setDeleteTarget({ id: scan.id, date: scan.date })} />
                    </div>
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
        )
      ) : skinCards.length === 0 ? (
        <EmptyState href="/skin" label="skin scans" />
      ) : (
        <div className="space-y-[clamp(16px,2.5vw,24px)]">
          {skinCards.map((scan) => (
            <article
              key={scan.id}
              className="overflow-hidden rounded-[20px] border border-[var(--ink-08)] bg-cloud"
            >
              <div className="grid md:grid-cols-[228px_1fr]">
                <div className="border-b border-[var(--ink-08)] p-5 md:border-b-0 md:border-r">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-display text-[15px] font-bold tracking-[-0.01em] text-ink">
                      {scan.date}
                    </p>
                    <DeleteButton onClick={() => setDeleteTarget({ id: scan.id, date: scan.date })} />
                  </div>
                  <div className="relative aspect-[3/4] max-w-[180px] overflow-hidden rounded-[12px] bg-[#2C2B27]">
                    {scan.photoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={scan.photoUrl}
                        alt="Skin scan"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <p className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-stone">
                    scan photo
                  </p>
                </div>

                <div className="p-5">
                  <p className="mb-4 font-display text-[18px] font-bold tracking-[-0.02em] text-ink">
                    Your answers
                  </p>
                  {scan.details ? (
                    <>
                      <dl className="grid gap-4 sm:grid-cols-2">
                        {scan.details.map((d) => (
                          <div key={d.label}>
                            <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-stone">
                              {d.label}
                            </dt>
                            <dd className="mt-0.5 text-[15px] text-ink">{d.value}</dd>
                          </div>
                        ))}
                      </dl>
                      <Link
                        href="/skin"
                        className="mt-5 inline-block font-mono text-[12px] uppercase tracking-[0.1em] text-bronze transition-colors hover:text-ink"
                      >
                        view read →
                      </Link>
                    </>
                  ) : (
                    <p className="font-mono text-[12px] text-stone">
                      No saved details for this scan.
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Delete confirmation modal (two-step) */}
      {deleteTarget && (
        <DeleteModal
          scanDate={deleteTarget.date}
          onCancel={() => {
            setDeleteTarget(null);
            setDeleting(false);
          }}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}
    </>
  );
}

function EmptyState({ href, label }: { href: string; label: string }) {
  return (
    <div className="rounded-[20px] border border-dashed border-[var(--ink-12)] p-10 text-center">
      <p className="mb-2 font-display text-[22px] font-bold tracking-[-0.02em]">
        No {label} yet<span className="dot">.</span>
      </p>
      <p className="mb-6 text-[15px] text-graphite">
        Take a scan and your reads will live here.
      </p>
      <Button href={href} size="lg">
        Start a scan
      </Button>
    </div>
  );
}
