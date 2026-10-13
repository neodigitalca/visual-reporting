import type { BulkHarnessSectionUi } from "@/hooks/use-bulk-auto-generate";

export const PROMPT_CHECKLIST_PIPELINE_TITLES = [
  "Site context",
  "Blog ideas",
  "Focus keywords",
  "Meta descriptions",
  "URL slugs",
] as const;

function activePromptChecklistIndex(phase: string): number {
  const p = phase.trim().toLowerCase();
  if (!p) return 0;
  if (p.includes("url slug")) return 4;
  if (p.includes("meta description")) return 3;
  if (p.includes("focus keyword")) return 2;
  if (p.includes("refining keywords") || p.includes("uniqueness")) {
    return 1;
  }
  if (p.includes("starting ideas") || p.includes("generating blog ideas") || p.includes("writing titles")) {
    return 1;
  }
  if (p.includes("done")) return PROMPT_CHECKLIST_PIPELINE_TITLES.length;
  if (p.includes("distilling")) return 2;
  if (p.includes("writing meta")) return 3;
  if (p.includes("writing url")) return 4;
  return 1;
}

export function buildPromptChecklistHarnessSections(
  phase: string,
  isGeneratingChecklist: boolean,
): BulkHarnessSectionUi[] {
  if (!isGeneratingChecklist) return [];
  const activeIndex = activePromptChecklistIndex(phase);
  const allDone = phase.trim().toLowerCase() === "done";

  return PROMPT_CHECKLIST_PIPELINE_TITLES.map((title, sectionIndex) => ({
    sectionIndex,
    title,
    status:
      allDone || sectionIndex < activeIndex
        ? ("done" as const)
        : sectionIndex === activeIndex
          ? ("generating" as const)
          : ("waiting" as const),
  }));
}
