import { Loader2 } from "lucide-react";
import { HOST_DIVIDER, HOST_SURFACE } from "@/components/hosting/my-sites/my-sites-theme";
import type { StoryboardFrame, VideoPlan, VideoRenderSnapshot } from "@/lib/video-generator/video-generator-types";
import { VIDEO_ASPECT_BOX_CLASS, type VideoAspect } from "@/lib/video-generator/video-model-defaults";
import { cn } from "@/lib/utils";

type VideoStagePanelProps = {
  plan: VideoPlan;
  aspect: VideoAspect;
  frames: StoryboardFrame[];
  selectedSceneId: string | null;
  render: VideoRenderSnapshot | null;
};

const RENDER_STATUS_LABEL: Record<VideoRenderSnapshot["status"], string> = {
  created: "Preparing render",
  rendering: "Generating scene clips",
  stitching: "Assembling the final cut",
  done: "Video ready",
  failed: "Render failed",
};

/** Main stage: one reserved aspect box showing the final video, else the selected scene's clip, else its storyboard frame; scene notes below. */
export function VideoStagePanel({ plan, aspect, frames, selectedSceneId, render }: VideoStagePanelProps) {
  const scene = plan.scenes.find((s) => s.id === selectedSceneId) ?? plan.scenes[0];
  const frame = frames.find((f) => f.sceneId === scene.id);
  const clip = render?.scenes.find((s) => s.sceneId === scene.id);
  const videoUrl = render?.finalUrl ?? clip?.clipUrl;
  const headline = render?.finalUrl ? plan.title : `Scene ${scene.order}: ${scene.title}`;
  const spinning = frame?.status === "generating" || frame?.status === "waiting";
  return (
    <div className={cn(HOST_SURFACE, "flex flex-col")}>
      <div className="flex h-12 shrink-0 items-center justify-between gap-3 px-5">
        <p className="truncate font-semibold text-white">{headline}</p>
        <p className={cn("flex shrink-0 items-center gap-2", render?.status === "failed" ? "text-red-300" : "text-muted-foreground")}>
          {render && (render.status === "rendering" || render.status === "stitching" || render.status === "created") ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : null}
          {render ? RENDER_STATUS_LABEL[render.status] : `${scene.durationSeconds} s`}
        </p>
      </div>
      <div className={cn("relative w-full bg-black", VIDEO_ASPECT_BOX_CLASS[aspect])}>
        {videoUrl ? (
          <video key={videoUrl} src={videoUrl} controls playsInline className="absolute inset-0 h-full w-full" />
        ) : frame?.imageDataUrl ? (
          <img src={frame.imageDataUrl} alt={`Scene ${scene.order}: ${scene.title}`} className="absolute inset-0 h-full w-full object-contain" />
        ) : null}
        {!videoUrl && spinning ? (
          <span className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Drawing frame" />
          </span>
        ) : null}
      </div>
      {render?.error ? <p className={cn("border-t px-5 py-3 text-red-300", HOST_DIVIDER)}>{render.error}</p> : null}
      {render?.finalUrl ? (
        <div className={cn("flex flex-col gap-2 border-t px-5 py-4", HOST_DIVIDER)}>
          <p>{plan.logline}</p>
          {plan.voice === "none" ? null : (
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Narration ({plan.voice}):</span> {plan.scenes.map((s) => s.narration).join(" ")}
            </p>
          )}
        </div>
      ) : (
      <div className={cn("flex flex-col gap-2 border-t px-5 py-4", HOST_DIVIDER)}>
        <p>{scene.sceneInstructions}</p>
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">Motion:</span> {scene.motionPrompt}
        </p>
        {plan.voice === "none" ? null : (
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Narration ({plan.voice}):</span> {scene.narration}
          </p>
        )}
        {scene.transitionIn ? (
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Join:</span>{" "}
            {scene.transitionIn.type === "dissolve"
              ? `dissolve ${scene.transitionIn.seconds} s from scene ${scene.order - 1}`
              : `continues from the last frame of scene ${scene.order - 1}`}
          </p>
        ) : null}
        {frame?.error ? <p className="text-red-300">{frame.error}</p> : null}
        {frame?.videoPrompt ? (
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Clip prompt:</span> {frame.videoPrompt}
          </p>
        ) : null}
      </div>
      )}
    </div>
  );
}
