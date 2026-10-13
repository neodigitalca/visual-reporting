import type { CSSProperties } from "react";
import { BLOG_GENERATOR_SECTION_DEFS } from "@/components/blog-generator/blog-generator-sections";
import { OVERVIEW_SITEMAP_SOURCE_LABELS } from "@/lib/overview/overview-sitemap-source";
import {
  workspacePrimarySelectSlotProps,
  workspacePrimarySelectWidthStyle,
} from "@/components/shared/workspace-primary-select-styles";

/** Labels that appear on generator title-row green selects (trigger text only). */
const GENERATOR_TITLE_ROW_SELECT_LABELS: readonly string[] = [
  ...BLOG_GENERATOR_SECTION_DEFS.map((def) => def.label),
  ...Object.values(OVERVIEW_SITEMAP_SOURCE_LABELS),
  "Entities",
];

/** Same minimum trigger width for Pages and generator mode on every generator page. */
export function generatorTitleRowPrimarySelectSlotProps(): {
  className: string;
  style: CSSProperties;
} {
  return workspacePrimarySelectSlotProps(GENERATOR_TITLE_ROW_SELECT_LABELS);
}

export function generatorTitleRowPrimarySelectMenuWidthStyle(): CSSProperties {
  return workspacePrimarySelectWidthStyle(GENERATOR_TITLE_ROW_SELECT_LABELS);
}
