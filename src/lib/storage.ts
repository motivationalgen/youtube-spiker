// localStorage-backed storage with 2-hour TTL for non-signed-in users

export interface SavedItem {
  id: string;
  type: "keyword" | "tag" | "title";
  content: string;
  meta?: Record<string, unknown>;
  savedAt: number; // timestamp
}

const STORAGE_KEY = "ygs_saved_items";
const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

function now() {
  return Date.now();
}

function pruneExpired(items: SavedItem[]): SavedItem[] {
  const cutoff = now() - TTL_MS;
  return items.filter((item) => item.savedAt > cutoff);
}

export function getSavedItems(): SavedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const items: SavedItem[] = JSON.parse(raw);
    const valid = pruneExpired(items);
    // Write back pruned list
    if (valid.length !== items.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
    }
    return valid;
  } catch {
    return [];
  }
}

export function saveItem(item: Omit<SavedItem, "id" | "savedAt">): SavedItem {
  const items = getSavedItems();
  // Avoid duplicates by content+type
  const exists = items.find((i) => i.type === item.type && i.content === item.content);
  if (exists) return exists;

  const newItem: SavedItem = {
    ...item,
    id: crypto.randomUUID(),
    savedAt: now(),
  };
  items.push(newItem);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  return newItem;
}

export function removeItem(id: string) {
  const items = getSavedItems().filter((i) => i.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getItemsByType(type: SavedItem["type"]): SavedItem[] {
  return getSavedItems().filter((i) => i.type === type);
}

export function isItemSaved(type: SavedItem["type"], content: string): boolean {
  return getSavedItems().some((i) => i.type === type && i.content === content);
}
