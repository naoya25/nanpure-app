import { describe, expect, it } from "vitest";

import { parseCandidateMasks81String } from "@/lib/validates/grid";

const eightyOnes = () => Array.from({ length: 81 }, () => 0);

describe("parseCandidateMasks81String", () => {
  it("parses JSON array of 81 integers", () => {
    const nums = eightyOnes();
    nums[0] = 511;
    nums[80] = 3;
    const s = JSON.stringify(nums);
    expect(parseCandidateMasks81String(s)).toEqual(nums);
  });

  it("masks to 9 bits", () => {
    const nums = eightyOnes();
    nums[0] = 0xfff; // clamps with & 0x1ff
    expect(parseCandidateMasks81String(JSON.stringify(nums))[0]).toBe(511);
  });

  it("parses comma and newline separated integers", () => {
    const line =
      "0, 324\n" + Array.from({ length: 79 }, () => "0").join(",");
    const out = parseCandidateMasks81String(line);
    expect(out.length).toBe(81);
    expect(out[0]).toBe(0);
    expect(out[1]).toBe(324);
  });

  it("throws on wrong length", () => {
    expect(() => parseCandidateMasks81String("[1,2,3]")).toThrow(/81/);
  });

  it("throws on empty", () => {
    expect(() => parseCandidateMasks81String("   ")).toThrow(/空/);
  });
});
