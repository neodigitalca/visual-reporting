export type VideoGeneratorStep = "brainstorm" | "brief" | "product" | "questions" | "plan" | "storyboard" | "render";

export const VIDEO_GENERATOR_STEPS: Array<{ id: VideoGeneratorStep; label: string }> = [
  { id: "brainstorm", label: "Brainstorming" },
  { id: "brief", label: "Brief" },
  { id: "product", label: "Product" },
  { id: "questions", label: "Questions" },
  { id: "plan", label: "Plan" },
  { id: "storyboard", label: "Storyboard" },
  { id: "render", label: "Render" },
];

export function stepIndex(step: VideoGeneratorStep): number {
  return VIDEO_GENERATOR_STEPS.findIndex((s) => s.id === step);
}
