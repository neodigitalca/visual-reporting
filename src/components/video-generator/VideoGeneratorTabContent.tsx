import { Download, Loader2, RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MY_SITES_HEADER_BAND,
  MY_SITES_PRIMARY_BTN,
  MY_SITES_STATUS_LINE,
  MY_SITES_TAB_BTN,
  MY_SITES_TABS_BAND,
  MY_SITES_TOOL_BTN,
  MY_SITES_TOOLBAR_BAND,
} from "@/components/hosting/my-sites/my-sites-theme";
import { SEO_WORKSPACE_BODY_SCROLL_CLASS, SEO_WORKSPACE_SHELL_CLASS } from "@/components/seo/seo-workspace-layout";
import { formatEstimateUsd } from "@/lib/agent-pipeline-cost-estimates";
import { notifyHeaderError } from "@/lib/app-notifications";
import { useEffect } from "react";
import { VIDEO_MODEL_PRESETS } from "@/lib/video-generator/video-model-defaults";
import { cn } from "@/lib/utils";
import { useVideoBrainstorm } from "./useVideoBrainstorm";
import { useVideoGenerator } from "./useVideoGenerator";
import { VideoBrainstormPanel } from "./VideoBrainstormPanel";
import { VideoBriefPanel } from "./VideoBriefPanel";
import { VideoInstructionBar } from "./VideoInstructionBar";
import { VideoPlanPanel } from "./VideoPlanPanel";
import { VideoProductPanel } from "./VideoProductPanel";
import { VideoQuestionsPanel } from "./VideoQuestionsPanel";
import { VideoSceneSidebar } from "./VideoSceneSidebar";
import { VideoStagePanel } from "./VideoStagePanel";
import { VideoUploadWell } from "./VideoUploadWell";
import type { ProductViewId } from "@/lib/video-generator/video-generator-types";
import { VIDEO_GENERATOR_STEPS, stepIndex } from "./video-generator-steps";

/** Video Generator studio: scene sidebar on the left, stage plus Director instruction bar on the right. Pulse Host layout (no unified header). */
export function VideoGeneratorTabContent({ apiKey }: { apiKey: string }) {
  const g = useVideoGenerator(apiKey);
  const b = useVideoBrainstorm(apiKey, g.setBriefFromBrainstorm, g.brief.subject?.dataUrl);
  const working = g.busy !== null || b.busy !== null;
  const modelLabel = VIDEO_MODEL_PRESETS.find((p) => p.value === g.videoModel)?.label ?? g.videoModel;
  const costLabel =
    g.estimatedCostUsd == null
      ? "Pricing unavailable"
      : `~${formatEstimateUsd(g.estimatedCostUsd)} for ${g.brief.lengthSeconds} s at ${g.brief.resolution}`;
  const showStage = (g.step === "storyboard" || g.step === "render") && g.plan !== null;
  const status = g.busy || b.busy || "";

  useEffect(() => {
    if (g.error) notifyHeaderError("Video Generator", g.error, { duration: 12000 });
  }, [g.error]);
  useEffect(() => {
    if (b.error) notifyHeaderError("Video Generator", b.error, { duration: 12000 });
  }, [b.error]);
  const uploads = (
    <>
      <VideoUploadWell
        label="Subject photos"
        accept="image/*"
        isPreparing={g.isPreparingSubject}
        disabled={working}
        uploads={[
          ...(g.brief.subject
            ? [{ id: g.brief.subject.id, fileName: g.brief.subject.fileName, caption: "Subject harness, sent with every frame", src: g.brief.subject.dataUrl, kind: "image" as const, onRemove: g.clearSubject }]
            : []),
          ...g.subjectPhotos.map((p) => ({ id: p.id, fileName: p.fileName, caption: "Subject photo", src: p.dataUrl, kind: "image" as const, onRemove: () => g.removeSubjectPhoto(p.id) })),
        ]}
        onAddFiles={(files) => void g.addSubjectFiles(files)}
      />
      {g.step === "brainstorm" ? (
        <VideoUploadWell
          label="Images and video"
          accept="image/*,video/*"
          isPreparing={b.isPreparing}
          disabled={working}
          uploads={[
            ...(b.video
              ? [{ id: "video", fileName: b.video.file.name, caption: "Client video, cut into beats", src: b.video.previewUrl, kind: "video" as const, onRemove: b.removeVideo }]
              : []),
            ...b.images.map((r) => ({ id: r.id, fileName: r.fileName, caption: "Product image", src: r.dataUrl, kind: "image" as const, onRemove: () => b.removeImage(r.id) })),
          ]}
          onAddFiles={(files) => void b.addFiles(files)}
        />
      ) : (
        <VideoUploadWell
          label="Reference images"
          accept="image/*"
          isPreparing={g.isPreparingReferences}
          disabled={working}
          uploads={g.brief.references.map((r, i) => ({
            id: r.id,
            fileName: r.fileName,
            caption: `Image ${i + 1}`,
            src: r.dataUrl,
            kind: "image" as const,
            onRemove: () => g.removeReference(r.id),
          }))}
          onAddFiles={(files) => void g.addReferenceFiles(files)}
        />
      )}
    </>
  );

  const primaryAction = (() => {
    switch (g.step) {
      case "brainstorm":
        return { label: "Brainstorm", onClick: () => void b.brainstorm(), disabled: working || !b.canBrainstorm };
      case "brief":
        return g.needsProductStep
          ? { label: "Continue to product", onClick: g.continueToProduct, disabled: working || !g.brief.prompt.trim() }
          : { label: "Ask the Director", onClick: () => void g.askQuestions(), disabled: working || !g.brief.prompt.trim() };
      case "product":
        return g.productReadyToLock
          ? { label: "Lock product and ask the Director", onClick: () => void g.lockProduct(), disabled: working }
          : { label: "Generate product views", onClick: () => void g.generateProductViews(), disabled: working || !g.needsProductStep };
      case "questions":
        return g.questions === null
          ? { label: "Ask the Director", onClick: () => void g.askQuestions(), disabled: working }
          : { label: "Draft scene plan", onClick: () => void g.submitAnswers(), disabled: working || !g.allAnswered };
      case "plan":
        return g.plan === null
          ? { label: "Draft scene plan", onClick: () => void g.submitAnswers(), disabled: working || !g.allAnswered }
          : { label: "Render video", onClick: () => void g.renderVideo(), disabled: working || !g.readyToRender };
      case "storyboard":
        return { label: "Render video", onClick: () => void g.renderVideo(), disabled: working || !g.readyToRender };
      case "render":
        return null;
    }
  })();

  return (
    <div className={cn(SEO_WORKSPACE_SHELL_CLASS, "font-sans text-base")}>
      <div className={MY_SITES_HEADER_BAND}>
        <h1 className="text-2xl font-semibold text-white">Video Generator</h1>
        <Button type="button" variant="ghost" className={MY_SITES_TOOL_BTN} disabled={working} onClick={g.reset}>
          <RotateCcw className="h-4 w-4" aria-hidden />
          New video
        </Button>
      </div>

      <div role="tablist" className={MY_SITES_TABS_BAND}>
        {VIDEO_GENERATOR_STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={g.step === s.id}
            data-active={g.step === s.id}
            className={cn(MY_SITES_TAB_BTN, "disabled:cursor-default disabled:opacity-40")}
            disabled={i > stepIndex(g.maxStep)}
            onClick={() => g.setStep(s.id)}
          >
            <span className="tabular-nums">{i + 1}.</span>
            {s.label}
          </button>
        ))}
      </div>

      <div className={MY_SITES_TOOLBAR_BAND}>
        <span className="truncate text-muted-foreground">
          {modelLabel} <span aria-hidden>·</span> <span className="tabular-nums">{costLabel}</span>
        </span>
        <div className="ml-auto flex items-center gap-2">
          {g.step === "plan" && g.plan ? (
            <Button type="button" variant="ghost" className={MY_SITES_TOOL_BTN} disabled={working} onClick={() => void g.regeneratePlan()}>
              <RefreshCw className="h-4 w-4" aria-hidden />
              Regenerate plan
            </Button>
          ) : null}
          {g.step === "render" && g.render?.finalUrl ? (
            <Button asChild type="button" className={MY_SITES_PRIMARY_BTN}>
              <a href={g.render.finalUrl} download>
                <Download className="h-4 w-4" aria-hidden />
                Download MP4
              </a>
            </Button>
          ) : null}
          {primaryAction ? (
            <Button type="button" className={cn(MY_SITES_PRIMARY_BTN, "min-w-[14rem]")} disabled={primaryAction.disabled} onClick={primaryAction.onClick}>
              {working ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {primaryAction.label}
            </Button>
          ) : null}
        </div>
      </div>

      <p className={MY_SITES_STATUS_LINE}>
        <span className="truncate">{status}</span>
      </p>

      <div className="grid h-0 min-h-0 min-w-0 flex-1 grid-cols-[18rem_minmax(0,1fr)] gap-4">
        <VideoSceneSidebar
          plan={g.plan}
          uploads={uploads}
          aspect={g.brief.aspect}
          frames={g.frames}
          renderScenes={g.step === "render" ? (g.render?.scenes ?? []) : null}
          selectedSceneId={g.selectedSceneId}
          disabled={working}
          onSelect={g.selectScene}
          onRegenerate={(sceneId) => void g.regenerateFrame(sceneId)}
        />
        <div className="flex min-h-0 min-w-0 flex-col gap-3">
          <div className={cn(SEO_WORKSPACE_BODY_SCROLL_CLASS, "flex flex-col gap-4 pb-4")}>
            {g.step === "brainstorm" ? <VideoBrainstormPanel notes={b.notes} disabled={working} onNotesChange={b.setNotes} /> : null}
            {g.step === "brief" ? (
              <VideoBriefPanel
                brief={g.brief}
                videoModel={g.videoModel}
                disabled={working}
                onPromptChange={g.setPrompt}
                onLengthChange={g.setLengthSeconds}
                onAspectChange={g.setAspect}
                onResolutionChange={g.setResolution}
              />
            ) : null}
            {g.step === "questions" ? (
              <VideoQuestionsPanel questions={g.questions} answers={g.answers} disabled={working} onAnswer={g.answerQuestion} />
            ) : null}
            {g.step === "plan" ? (
              <VideoPlanPanel plan={g.plan} live={g.planLive} referenceNames={g.brief.references.map((r) => r.fileName)} />
            ) : null}
            {g.step === "product" ? (
              <VideoProductPanel
                aspect={g.brief.aspect}
                product={g.productLock}
                disabled={working}
                onRegenerateView={(viewId) => g.regenerateProductView(viewId as ProductViewId)}
              />
            ) : null}
            {showStage && g.plan ? (
              <VideoStagePanel plan={g.plan} aspect={g.brief.aspect} frames={g.frames} selectedSceneId={g.selectedSceneId} render={g.render} />
            ) : null}
          </div>
          <VideoInstructionBar
            disabled={working || g.plan === null || g.renderActive}
            hasSelectedScene={g.selectedSceneId !== null}
            onSend={(scope, text) => void g.sendInstruction(scope, text)}
          />
        </div>
      </div>
    </div>
  );
}
