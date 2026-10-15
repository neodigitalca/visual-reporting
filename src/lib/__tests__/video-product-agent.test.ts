import { describe, expect, it } from "vitest";
import {
  PRODUCT_VIEW_DEFINITIONS,
  initialProductViews,
  parseProductSpec,
} from "@/lib/video-generator/video-product-agent";

describe("parseProductSpec", () => {
  it("accepts a complete spec", () => {
    const spec = parseProductSpec({
      name: "Spa Mod",
      summary: "A prefabricated modular cabin.",
      proportions: "Long single-storey rectangle.",
      roof: "Flat with slim fascia.",
      cladding: "Charcoal and cedar vertical slats.",
      glazing: "Two floor-to-ceiling bays.",
      baseOrChassis: "Low steel piers.",
      palette: "Warm wood, dark charcoal, amber interior glow.",
      mustNotChange: ["Two glazing bays", "Flat roof line"],
    });
    expect(spec.name).toBe("Spa Mod");
    expect(spec.mustNotChange).toHaveLength(2);
  });

  it("rejects missing required fields", () => {
    expect(() => parseProductSpec({ name: "X" })).toThrow(/missing/i);
  });
});

describe("product views contract", () => {
  it("defines four views in fixed order", () => {
    expect(PRODUCT_VIEW_DEFINITIONS.map((d) => d.id)).toEqual([
      "front_elevation",
      "side_elevation",
      "three_quarter",
      "glazing_detail",
    ]);
    expect(initialProductViews()).toHaveLength(4);
    expect(initialProductViews().every((v) => v.status === "waiting")).toBe(true);
  });
});
