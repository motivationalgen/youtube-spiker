// Dual storage: localStorage with 2-hour TTL for guests, Supabase for authenticated users

import { supabase } from "@/integrations/supabase/client";

export interface SavedItem {
  id: string;
  type: "keyword" | "tag" | "title";
  content: string;
  meta?: Record<string, unknown>;
  savedAt: number; // timestamp
}

const STORAGE_KEY = "ygs_saved_items";
const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

function pruneExpired(items: SavedItem[]): SavedItem[] {
  const cutoff = Date.now() - TTL_MS;
  return items.filter((item) => item.savedAt > cutoff);
}

// ─── Guest (localStorage) helpers ───

export function getLocalItems(): SavedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const items: SavedItem[] = JSON.parse(raw);
    const valid = pruneExpired(items);
    if (valid.length !== items.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
    }
    return valid;
  } catch {
    return [];
  }
}

export function saveLocalItem(item: Omit<SavedItem, "id" | "savedAt">): SavedItem {
  const items = getLocalItems();
  const exists = items.find((i) => i.type === item.type && i.content === item.content);
  if (exists) return exists;
  const newItem: SavedItem = {
    ...item,
    id: crypto.randomUUID(),
    savedAt: Date.now(),
  };
  items.push(newItem);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  return newItem;
}

export function removeLocalItem(id: string) {
  const items = getLocalItems().filter((i) => i.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function isLocalItemSaved(type: SavedItem["type"], content: string): boolean {
  return getLocalItems().some((i) => i.type === type && i.content === content);
}

export function getTimeRemaining(savedAt: number): { text: string; expired: boolean } {
  const remaining = TTL_MS - (Date.now() - savedAt);
  if (remaining <= 0) return { text: "Expired", expired: true };
  const totalSecs = Math.floor(remaining / 1000);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  if (hrs > 0) return { text: `${hrs}h ${mins}m ${secs}s`, expired: false };
  if (mins > 0) return { text: `${mins}m ${secs}s`, expired: false };
  return { text: `${secs}s`, expired: false };
}

// ─── Authenticated (Supabase) helpers ───

export async function getDbItems(): Promise<SavedItem[]> {
  const { data, error } = await supabase
    .from("saved_items")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row: any) => ({
    id: row.id,
    type: row.type as SavedItem["type"],
    content: row.content,
    meta: row.meta ?? {},
    savedAt: new Date(row.created_at).getTime(),
  }));
}

export async function saveDbItem(item: Omit<SavedItem, "id" | "savedAt">): Promise<SavedItem | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const row = { user_id: user.id, type: item.type, content: item.content, meta: (item.meta ?? {}) as any };
  const { data, error } = await supabase
    .from("saved_items")
    .upsert(row, { onConflict: "user_id,type,content" })
    .select()
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    type: data.type as SavedItem["type"],
    content: data.content,
    meta: (data.meta as Record<string, unknown>) ?? {},
    savedAt: new Date(data.created_at).getTime(),
  };
}

export async function removeDbItem(id: string) {
  await supabase.from("saved_items").delete().eq("id", id);
}

export async function isDbItemSaved(type: SavedItem["type"], content: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { count } = await supabase
    .from("saved_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("type", type)
    .eq("content", content);
  return (count ?? 0) > 0;
}

// ─── Backward-compatible helpers (for pages that haven't migrated yet) ───

export function getSavedItems(): SavedItem[] {
  return getLocalItems();
}

export function saveItem(item: Omit<SavedItem, "id" | "savedAt">): SavedItem {
  return saveLocalItem(item);
}

export function removeItem(id: string) {
  removeLocalItem(id);
}

export function getItemsByType(type: SavedItem["type"]): SavedItem[] {
  return getLocalItems().filter((i) => i.type === type);
}

export function isItemSaved(type: SavedItem["type"], content: string): boolean {
  return isLocalItemSaved(type, content);
}

// Migrate local items to DB after login
export async function migrateLocalToDb() {
  const localItems = getLocalItems();
  if (localItems.length === 0) return;
  for (const item of localItems) {
    await saveDbItem({ type: item.type, content: item.content, meta: item.meta });
  }
  localStorage.removeItem(STORAGE_KEY);
}
