import { getLocalStorageItem, setLocalStorageItem } from "@/lib/storage/local_storage";

const SETTINGS_KEY = "nanpure:settings:v1";

export type PlaySettingsV1 = {
  v: 1;
  autoRunTechniqueIds: string[];
  difficultyPercent?: number;
};

function isPlaySettingsV1(value: unknown): value is PlaySettingsV1 {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v.v === 1 &&
    Array.isArray(v.autoRunTechniqueIds) &&
    v.autoRunTechniqueIds.every((id) => typeof id === "string") &&
    (v.difficultyPercent === undefined || typeof v.difficultyPercent === "number")
  );
}

export function loadPlaySettings(): PlaySettingsV1 | null {
  const raw = getLocalStorageItem(SETTINGS_KEY);
  if (raw === null) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    return isPlaySettingsV1(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function savePlaySettings(settings: PlaySettingsV1): void {
  setLocalStorageItem(SETTINGS_KEY, JSON.stringify(settings));
}
