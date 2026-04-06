import { describe, expect, it } from "vitest";

import { TechniqueId } from "@/lib/types/sudoku_technique_types";
import { techniqueIdWebSearchUrl } from "@/lib/utils/technique_web_search";

describe("techniqueIdWebSearchUrl", () => {
  it("Google 検索 URL になり、クエリがエンコードされる", () => {
    const url = techniqueIdWebSearchUrl(TechniqueId.SINGLE);
    expect(url.startsWith("https://www.google.com/search?q=")).toBe(true);
    expect(url).toContain(encodeURIComponent("ナンプレ"));
    expect(url).toContain(encodeURIComponent("シングル"));
  });
});
