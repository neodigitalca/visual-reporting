import { describe, expect, it } from "vitest";
import {
  assertEntityRowsHaveKeywords,
  countDistinctEntityLabels,
  validateEntityClusterResult,
} from "@/lib/local-analysis/entity-cluster-validate";
import type { CSVRow } from "@/lib/bulk/bulk-csv-parser";

describe("validateEntityClusterResult", () => {
  it("rejects duplicate city entities under Neighbourhoods focus", () => {
    const rows: CSVRow[] = Array.from({ length: 4 }, () => ({
      entity: "Edmonton, Alberta, Canada",
      keyword: "",
      title: "",
    }));
    expect(() =>
      validateEntityClusterResult({
        rows,
        total: 4,
        parentCityLabel: "Edmonton, Alberta, Canada",
        entityTypeFocus: ["Neighbourhoods"],
      }),
    ).toThrow(/city-level entity/i);
  });

  it("accepts distinct sub-city entities", () => {
    const rows: CSVRow[] = [
      { entity: "Oliver, Edmonton, AB", keyword: "", title: "" },
      { entity: "Mill Woods, Edmonton, AB", keyword: "", title: "" },
    ];
    expect(() =>
      validateEntityClusterResult({
        rows,
        total: 2,
        parentCityLabel: "Edmonton, AB",
        entityTypeFocus: ["Neighbourhoods"],
      }),
    ).not.toThrow();
    expect(countDistinctEntityLabels(rows)).toBe(2);
  });
});

describe("assertEntityRowsHaveKeywords", () => {
  it("throws when keyword missing", () => {
    expect(() =>
      assertEntityRowsHaveKeywords([{ entity: "Oliver, Edmonton, AB", keyword: "", title: "" }]),
    ).toThrow(/without keywords/i);
  });
});
