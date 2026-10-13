import { describe, expect, it } from "vitest";
import { formatCanadianCompactNumber } from "@/lib/gsc-reporting/gsc-number-format";

describe("formatCanadianCompactNumber", () => {
  it("keeps values under 1K as plain integers", () => {
    expect(formatCanadianCompactNumber(881)).toBe("881");
    expect(formatCanadianCompactNumber(999)).toBe("999");
  });

  it("formats thousands and millions", () => {
    expect(formatCanadianCompactNumber(1_000)).toBe("1K");
    expect(formatCanadianCompactNumber(10_000)).toBe("10K");
    expect(formatCanadianCompactNumber(73_432)).toBe("73.4K");
    expect(formatCanadianCompactNumber(88_428)).toBe("88.4K");
    expect(formatCanadianCompactNumber(1_200_000)).toBe("1.2M");
  });
});
