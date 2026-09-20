import { getLocalStorageItem, setLocalStorageItem } from "@/lib/storage/local_storage";

const PROGRESS_KEY = "nanpure:progress:v1";
const MAX_ENTRIES = 20;

export type PlayProgressEntry = {
  values81: string;
  memoMasks81: number[];
  mistakes: number;
  updatedAt: number;
};

type PlayProgressStateV1 = {
  v: 1;
  entries: Record<string, PlayProgressEntry>;
};

function isPlayProgressEntry(value: unknown): value is PlayProgressEntry {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.values81 === "string" &&
    Array.isArray(v.memoMasks81) &&
    v.memoMasks81.every((m) => typeof m === "number") &&
    typeof v.mistakes === "number" &&
    typeof v.updatedAt === "number"
  );
}

function emptyState(): PlayProgressStateV1 {
  return { v: 1, entries: {} };
}

function readState(): PlayProgressStateV1 {
  const raw = getLocalStorageItem(PROGRESS_KEY);
  if (raw === null) return emptyState();

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      (parsed as { v?: unknown }).v !== 1 ||
      typeof (parsed as { entries?: unknown }).entries !== "object" ||
      (parsed as { entries?: unknown }).entries === null
    ) {
      return emptyState();
    }

    const rawEntries = (parsed as { entries: Record<string, unknown> }).entries;
    const entries: Record<string, PlayProgressEntry> = {};
    for (const [puzzle81, entry] of Object.entries(rawEntries)) {
      if (isPlayProgressEntry(entry)) entries[puzzle81] = entry;
    }
    return { v: 1, entries };
  } catch {
    return emptyState();
  }
}

function writeState(state: PlayProgressStateV1): void {
  setLocalStorageItem(PROGRESS_KEY, JSON.stringify(state));
}

function pruneToMaxEntries(
  entries: Record<string, PlayProgressEntry>,
): Record<string, PlayProgressEntry> {
  const keys = Object.keys(entries);
  if (keys.length <= MAX_ENTRIES) return entries;

  const sortedByUpdatedAtAscending = keys.sort(
    (a, b) => entries[a]!.updatedAt - entries[b]!.updatedAt,
  );
  const keysToDrop = sortedByUpdatedAtAscending.slice(0, keys.length - MAX_ENTRIES);

  const next = { ...entries };
  for (const key of keysToDrop) delete next[key];
  return next;
}

export function loadPlayProgress(puzzle81: string): PlayProgressEntry | null {
  return readState().entries[puzzle81] ?? null;
}

export function savePlayProgress(
  puzzle81: string,
  entry: Omit<PlayProgressEntry, "updatedAt">,
): void {
  const state = readState();
  const nextEntries = pruneToMaxEntries({
    ...state.entries,
    [puzzle81]: { ...entry, updatedAt: Date.now() },
  });
  writeState({ v: 1, entries: nextEntries });
}

export function deletePlayProgress(puzzle81: string): void {
  const state = readState();
  if (!(puzzle81 in state.entries)) return;

  const nextEntries = { ...state.entries };
  delete nextEntries[puzzle81];
  writeState({ v: 1, entries: nextEntries });
}
