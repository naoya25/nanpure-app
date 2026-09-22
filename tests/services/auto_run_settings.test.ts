import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  loadAutoRunTechniqueIds,
  saveAutoRunTechniqueIds,
} from "@/lib/services/auto_run_settings";
import { TechniqueId } from "@/lib/types/sudoku_technique_types";

const SETTINGS_KEY = "nanpure:settings:v1";

function stubLocalStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    },
  });
}

describe("auto_run_settings", () => {
  beforeEach(() => {
    stubLocalStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("保存した ID を読込め、未知の ID は落ちる", () => {
    saveAutoRunTechniqueIds(new Set([TechniqueId.SINGLE, TechniqueId.PAIR]));

    const raw = window.localStorage.getItem(SETTINGS_KEY);
    const parsed = JSON.parse(raw!) as { v: 1; autoRunTechniqueIds: string[] };
    parsed.autoRunTechniqueIds.push("NOT_A_TECHNIQUE");
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(parsed));

    const loaded = loadAutoRunTechniqueIds();
    expect(loaded).not.toBeNull();
    expect(new Set(loaded)).toEqual(new Set([TechniqueId.SINGLE, TechniqueId.PAIR]));
  });
});
