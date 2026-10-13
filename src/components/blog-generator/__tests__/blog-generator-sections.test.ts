import { describe, expect, it } from "vitest";
import {
  BLOG_GENERATOR_SECTION_DEFS,
  getBlogGeneratorSectionMeta,
} from "@/components/blog-generator/blog-generator-sections";

describe("blog-generator-sections", () => {
  it("registers Entities without a separate Competitor pill", () => {
    const ids = BLOG_GENERATOR_SECTION_DEFS.map((def) => def.id);
    expect(ids).not.toContain("pages");
    expect(ids).not.toContain("competitor");
    expect(getBlogGeneratorSectionMeta("entity").label).toBe("Entities");
  });
});
