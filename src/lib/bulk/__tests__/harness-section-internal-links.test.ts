import { describe, expect, it } from "vitest";
import {
  assertHarnessBodySectionInternalLinkMinimum,
  countHarnessInternalLinkPlaceholders,
} from "@/lib/bulk/harness-section-validate";

describe("harness section internal link validation", () => {
  it("counts [[LINK:query|anchor]] placeholders", () => {
    const html = `<h2>Permits</h2><p>See [[LINK:tent rental|tent rental]] and [[LINK:contact page|contact page]] for help.</p>`;
    expect(countHarnessInternalLinkPlaceholders(html)).toBe(2);
  });

  it("throws when below minimum placeholders", () => {
    const html = `<h2>Permits</h2><p>Only [[LINK:one link|one link]] here.</p>`;
    expect(() => assertHarnessBodySectionInternalLinkMinimum(html, "Permits")).toThrow(
      /minimum is 2/,
    );
  });
});
