"use client";

import { createClient } from "@/lib/supabase/client";
import type { OutfitSlot, WardrobeItemRow } from "@/lib/wardrobe/content";
import type { SavedLook, LookPiece } from "@/lib/wardrobe/looks";

const BUCKET = "user-media";
const SIGNED_TTL = 60 * 60; // 1h
const KIND = "wardrobe";

interface StoredPiece {
  slot: OutfitSlot;
  itemId: string;
}
interface StoredMeta {
  occasion: string;
  rationale?: string;
  pieces: StoredPiece[];
}
interface SavedLookRow {
  id: string;
  title: string | null;
  meta: StoredMeta | null;
}

export interface LookDraft {
  name: string;
  occasion: string;
  rationale?: string;
  /** Every piece must carry the wardrobe_items id it was picked from. */
  pieces: LookPiece[];
}

/** Resolves stored {slot,itemId} references into full LookPiece[] via one batch fetch. */
async function hydrate(rows: SavedLookRow[]): Promise<SavedLook[]> {
  const supabase = createClient();
  const itemIds = Array.from(
    new Set(rows.flatMap((r) => r.meta?.pieces.map((p) => p.itemId) ?? []))
  );

  const itemMap = new Map<string, WardrobeItemRow>();
  const signedMap = new Map<string, string>();
  if (itemIds.length > 0) {
    const { data: items, error } = await supabase
      .from("wardrobe_items")
      .select("id, category, name, color, image_url, data, created_at")
      .in("id", itemIds);
    if (error) throw error;
    (items as WardrobeItemRow[] | null)?.forEach((i) => itemMap.set(i.id, i));

    const paths = Array.from(
      new Set(
        Array.from(itemMap.values())
          .map((i) => i.image_url)
          .filter((p): p is string => Boolean(p))
      )
    );
    if (paths.length > 0) {
      const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_TTL);
      signed?.forEach((s, i) => {
        if (s.signedUrl) signedMap.set(paths[i], s.signedUrl);
      });
    }
  }

  return rows.map((r) => ({
    id: r.id,
    name: r.title ?? "Untitled look",
    occasion: r.meta?.occasion ?? "everyday",
    rationale: r.meta?.rationale,
    pieces: (r.meta?.pieces ?? [])
      .map((p): LookPiece | null => {
        const item = itemMap.get(p.itemId);
        if (!item) return null; // the source garment was deleted since
        return {
          slot: p.slot,
          name: item.name ?? item.data?.name ?? "item",
          tint: item.data?.colors?.[0]?.hex ?? "#888888",
          cutoutUrl: item.image_url ? (signedMap.get(item.image_url) ?? null) : null,
          itemId: p.itemId,
        };
      })
      .filter((p): p is LookPiece => p !== null),
  }));
}

function toMeta(draft: LookDraft): StoredMeta {
  return {
    occasion: draft.occasion,
    rationale: draft.rationale,
    pieces: draft.pieces
      .filter((p): p is LookPiece & { itemId: string } => Boolean(p.itemId))
      .map((p) => ({ slot: p.slot, itemId: p.itemId })),
  };
}

/** The user's saved wardrobe looks, newest first, with fresh signed cutout URLs. */
export async function fetchLooks(): Promise<SavedLook[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("saved_looks")
    .select("id, title, meta, created_at")
    .eq("user_id", user.id)
    .eq("kind", KIND)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return hydrate((data ?? []) as SavedLookRow[]);
}

export async function createLook(draft: LookDraft): Promise<SavedLook> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data, error } = await supabase
    .from("saved_looks")
    .insert({ user_id: user.id, kind: KIND, title: draft.name, meta: toMeta(draft) })
    .select("id")
    .single();
  if (error) throw error;

  return { id: data.id, name: draft.name, occasion: draft.occasion, rationale: draft.rationale, pieces: draft.pieces };
}

export async function updateLook(id: string, draft: LookDraft): Promise<SavedLook> {
  const supabase = createClient();
  const { error } = await supabase
    .from("saved_looks")
    .update({ title: draft.name, meta: toMeta(draft) })
    .eq("id", id);
  if (error) throw error;

  return { id, name: draft.name, occasion: draft.occasion, rationale: draft.rationale, pieces: draft.pieces };
}

export async function deleteLook(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("saved_looks").delete().eq("id", id);
  if (error) throw error;
}
