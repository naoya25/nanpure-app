import { loadPlaySettings, savePlaySettings } from "@/lib/storage/play_settings";
import { TechniqueId } from "@/lib/types/sudoku_technique_types";

const TECHNIQUE_ID_VALUES = new Set<string>(Object.values(TechniqueId));

export function loadAutoRunTechniqueIds(): ReadonlySet<TechniqueId> | null {
  const settings = loadPlaySettings();
  if (settings === null) return null;

  const ids = settings.autoRunTechniqueIds.filter((id): id is TechniqueId =>
    TECHNIQUE_ID_VALUES.has(id),
  );
  return new Set(ids);
}

export function saveAutoRunTechniqueIds(ids: ReadonlySet<TechniqueId>): void {
  savePlaySettings({ v: 1, autoRunTechniqueIds: Array.from(ids) });
}
