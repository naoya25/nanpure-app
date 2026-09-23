import { loadPlaySettings, savePlaySettings } from "@/lib/storage/play_settings";
import { DEFAULT_DIFFICULTY_PERCENT, isDifficultyPercent } from "@/lib/types/puzzle";
import type { DifficultyPercent } from "@/lib/types/puzzle";

export function loadDifficultyPercent(): DifficultyPercent {
  const value = loadPlaySettings()?.difficultyPercent;
  return isDifficultyPercent(value) ? value : DEFAULT_DIFFICULTY_PERCENT;
}

export function saveDifficultyPercent(difficultyPercent: DifficultyPercent): void {
  const settings = loadPlaySettings();
  savePlaySettings({
    v: 1,
    autoRunTechniqueIds: settings?.autoRunTechniqueIds ?? [],
    difficultyPercent,
  });
}
