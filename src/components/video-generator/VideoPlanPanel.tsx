import { HOST_DIVIDER, HOST_SURFACE } from "@/components/hosting/my-sites/my-sites-theme";
import type { OpenRouterAppStreamDelta } from "@/lib/openrouter-app-api";
import type { VideoPlan } from "@/lib/video-generator/video-generator-types";
import { cn } from "@/lib/utils";
import { VideoPlanLive } from "./VideoPlanLive";

/** Director's scene plan in scene order; while the Director is still writing it, the text streams in live. */
export function VideoPlanPanel({
  plan,
  live,
  referenceNames,
}: {
  plan: VideoPlan | null;
  live: OpenRouterAppStreamDelta;
  referenceNames: string[];
}) {
  if (!plan) return <VideoPlanLive live={live} />;
  const total = plan.scenes.reduce((s, sc) => s + sc.durationSeconds, 0);
  const c = plan.continuity;
  return (
    <div className={cn(HOST_SURFACE, "flex flex-col")}>
      <div className="flex h-12 shrink-0 items-center justify-between gap-3 px-5">
        <p className="truncate font-semibold text-white">{plan.title}</p>
        <p className="shrink-0 tabular-nums text-muted-foreground">
          {plan.scenes.length} scenes <span aria-hidden>·</span> {total} s
        </p>
      </div>
      <p className={cn("border-t px-5 py-3 text-muted-foreground", HOST_DIVIDER)}>{plan.logline}</p>
      <p className={cn("border-t px-5 py-3 text-muted-foreground", HOST_DIVIDER)}>
        <span className="font-medium text-foreground">Continuity:</span> {c.heroSubject} travels {c.screenDirection.replace(/_/g, " ")}; camera
        stays on {c.cameraSide}. Palette: {c.palette}. Light: {c.lightArc}.{plan.voice === "none" ? "" : ` Voice: ${plan.voice}.`}
      </p>
      {plan.scenes.map((scene) => (
        <div key={scene.id} className={cn("grid gap-x-6 gap-y-2 border-t px-5 py-4 md:grid-cols-[8rem_1fr]", HOST_DIVIDER)}>
          <div className="flex flex-col">
            <span className="font-semibold text-white">Scene {scene.order}</span>
            <span className="tabular-nums text-muted-foreground">{scene.durationSeconds} s</span>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-white">{scene.title}</p>
            <p>{scene.sceneInstructions}</p>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Storyboard frame:</span> {scene.storyboardPrompt}
            </p>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Motion:</span> {scene.motionPrompt}
            </p>
            {scene.narration ? (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Narration:</span> {scene.narration}
              </p>
            ) : null}
            {scene.continuityNotes ? (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Continuity:</span> {scene.continuityNotes}
              </p>
            ) : null}
            {scene.referenceIndexes.length ? (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">From upload:</span>{" "}
                {scene.referenceIndexes.map((n) => referenceNames[n - 1] ?? `Image ${n} (removed)`).join(", ")}
              </p>
            ) : null}
            {scene.transitionIn ? (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Join:</span>{" "}
                {scene.transitionIn.type === "dissolve"
                  ? `dissolve ${scene.transitionIn.seconds} s`
                  : "continues from the last frame of the previous scene"}
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
