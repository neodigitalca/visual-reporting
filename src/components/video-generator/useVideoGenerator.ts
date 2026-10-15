import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ManualImageReference } from "@/lib/image-generator/manual-reference-upload";
import { manualReferenceFromDataUrl, prepareManualReference } from "@/lib/image-generator/manual-reference-upload";
import { getImageModel, getVideoModel } from "@/lib/optimization-settings-storage";
import type { OpenRouterAppStreamDelta } from "@/lib/openrouter-app-api";
import { writeSceneVideoPrompt } from "@/lib/video-generator/video-cinematographer-agent";
import { runVideoDirectorClarify, runVideoDirectorPlan } from "@/lib/video-generator/video-director-agent";
import { runVideoDirectorRevisePlan, runVideoDirectorReviseScene } from "@/lib/video-generator/video-director-revise";
import type {
  ProductLockState,
  ProductViewId,
  StoryboardFrame,
  VideoBrief,
  VideoClarifyQuestion,
  VideoPlan,
  VideoRenderSnapshot,
} from "@/lib/video-generator/video-generator-types";
import {
  collectProductReferenceDataUrls,
  extractProductSpec,
  generateProductView,
  initialProductViews,
} from "@/lib/video-generator/video-product-agent";
import {
  DEFAULT_VIDEO_MODEL,
  DEFAULT_VOICE_MODEL,
  VIDEO_LENGTH_OPTIONS,
  estimateVideoCostUsd,
  resolutionsForVideoModel,
  type VideoAspect,
  type VideoLengthSeconds,
  type VideoResolution,
} from "@/lib/video-generator/video-model-defaults";
import {
  createVideoRender,
  fetchVideoRender,
  startVideoRender,
  uploadVideoRenderFrame,
} from "@/lib/video-generator/video-render-api";
import { buildSubjectHarness } from "@/lib/video-generator/video-brainstorm-api";
import { generateStoryboardFrame } from "@/lib/video-generator/video-storyboard-agent";
import { videoLog, videoLogError, videoTimer } from "@/lib/video-generator/video-log";
import { stepIndex, type VideoGeneratorStep } from "./video-generator-steps";

const RENDER_POLL_MS = 10_000;

export type InstructionScope = "scene" | "video";

/** What Brainstorming hands to the Brief. */
export type BrainstormBrief = {
  prompt: string;
  lengthSeconds: VideoLengthSeconds;
  aspect: VideoAspect;
  references: ManualImageReference[];
};

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export function useVideoGenerator(apiKey: string) {
  const videoModel = typeof window === "undefined" ? DEFAULT_VIDEO_MODEL : getVideoModel();
  const imageModel = getImageModel();

  const [step, setStep] = useState<VideoGeneratorStep>("brainstorm");
  const [maxStep, setMaxStep] = useState<VideoGeneratorStep>("brief");
  const [prompt, setPrompt] = useState("");
  const [lengthSeconds, setLengthSeconds] = useState<VideoLengthSeconds>(VIDEO_LENGTH_OPTIONS[1]);
  const [aspect, setAspect] = useState<VideoAspect>("16:9");
  const [resolution, setResolution] = useState<VideoResolution>(() => resolutionsForVideoModel(videoModel)[0]);
  const [references, setReferences] = useState<ManualImageReference[]>([]);
  const [isPreparingReferences, setIsPreparingReferences] = useState(false);
  /** The product photos and the one harness sheet the server tiles from them. */
  const [subjectPhotos, setSubjectPhotos] = useState<ManualImageReference[]>([]);
  const [subject, setSubject] = useState<ManualImageReference | null>(null);
  const [isPreparingSubject, setIsPreparingSubject] = useState(false);
  const [questions, setQuestions] = useState<VideoClarifyQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [plan, setPlan] = useState<VideoPlan | null>(null);
  /** What the Director has written so far while the plan is in progress (reasoning, then the plan JSON). */
  const [planLive, setPlanLive] = useState<OpenRouterAppStreamDelta>({ reasoning: "", content: "" });
  const [frames, setFrames] = useState<StoryboardFrame[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [render, setRender] = useState<VideoRenderSnapshot | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [productLock, setProductLock] = useState<ProductLockState>(() => ({
    spec: null,
    views: initialProductViews(),
    locked: false,
  }));
  /** Bumped whenever a new plan replaces the old one; frame and prompt results from an older run are dropped. */
  const runRef = useRef(0);

  const needsProductStep = subjectPhotos.length > 0;

  const brief: VideoBrief = useMemo(
    () => ({ prompt, lengthSeconds, aspect, resolution, references, subject }),
    [prompt, lengthSeconds, aspect, resolution, references, subject],
  );

  const estimatedCostUsd = estimateVideoCostUsd(videoModel, resolution, lengthSeconds, plan?.scenes.length ?? 1);

  useEffect(() => videoLog("generator", `step -> ${step}`), [step]);
  useEffect(() => videoLog("generator", busy ? `busy: ${busy}` : "idle"), [busy]);
  useEffect(() => {
    if (error) videoLogError("generator", "error shown on the status line", error);
  }, [error]);

  /** Start a new run: results from earlier frame and prompt calls are dropped when they arrive. */
  const bumpRun = useCallback((why: string): number => {
    runRef.current += 1;
    videoLog("generator", `run ${runRef.current} started: ${why}`);
    return runRef.current;
  }, []);

  const advance = useCallback((next: VideoGeneratorStep) => {
    setStep(next);
    setMaxStep((prev) => (stepIndex(next) > stepIndex(prev) ? next : prev));
  }, []);

  /** Go back to `next` and close later steps (used after a Director revision). */
  const rewind = useCallback((next: VideoGeneratorStep) => {
    setStep(next);
    setMaxStep(next);
  }, []);

  const requireApiKey = useCallback((): string | null => {
    const key = apiKey.trim();
    if (!key) {
      setError("OpenRouter API key is missing. Add it in Dashboard > API Keys.");
      return null;
    }
    return key;
  }, [apiKey]);

  const addReferenceFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setIsPreparingReferences(true);
    setError("");
    try {
      const prepared = await Promise.all(list.map((f) => prepareManualReference(f)));
      setReferences((prev) => [...prev, ...prepared]);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setIsPreparingReferences(false);
    }
  }, []);

  const removeReference = useCallback((id: string) => {
    setReferences((prev) => prev.filter((r) => r.id !== id));
  }, []);

  /** Removing the harness tile drops every subject photo with it. */
  const clearSubject = useCallback(() => {
    setSubjectPhotos([]);
    setSubject(null);
    videoLog("subject", "harness cleared");
  }, []);

  /** Rebuilds the harness sheet from `photos` on the server; no photos clears it. */
  const rebuildSubject = useCallback(
    async (key: string, photos: ManualImageReference[]) => {
      setSubjectPhotos(photos);
      if (!photos.length) {
        clearSubject();
        return;
      }
      setIsPreparingSubject(true);
      setError("");
      try {
        const harnessDataUrl = await buildSubjectHarness({ apiKey: key, images: photos.map((p) => ({ fileName: p.fileName, dataUrl: p.dataUrl })) });
        setSubject(await manualReferenceFromDataUrl("subject-harness.png", harnessDataUrl));
        videoLog("subject", "harness ready", { photos: photos.map((p) => p.fileName) });
      } catch (e) {
        videoLogError("subject", "harness build failed", e);
        setSubject(null);
        setError(errorText(e));
      } finally {
        setIsPreparingSubject(false);
      }
    },
    [clearSubject],
  );

  const addSubjectFiles = useCallback(
    async (files: FileList | File[]) => {
      const key = requireApiKey();
      if (!key) return;
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (!list.length) return;
      videoLog("subject", "photos added", list.map((f) => ({ name: f.name, bytes: f.size })));
      setIsPreparingSubject(true);
      setError("");
      let prepared: ManualImageReference[];
      try {
        prepared = await Promise.all(list.map((f) => prepareManualReference(f)));
      } catch (e) {
        videoLogError("subject", "photo prepare failed", e);
        setError(errorText(e));
        setIsPreparingSubject(false);
        return;
      }
      await rebuildSubject(key, [...subjectPhotos, ...prepared]);
    },
    [rebuildSubject, requireApiKey, subjectPhotos],
  );

  const removeSubjectPhoto = useCallback(
    (id: string) => {
      const key = requireApiKey();
      if (!key) return;
      void rebuildSubject(key, subjectPhotos.filter((p) => p.id !== id));
    },
    [rebuildSubject, requireApiKey, subjectPhotos],
  );

  /** Brainstorming fills the Brief and opens it. */
  const setBriefFromBrainstorm = useCallback(
    (next: BrainstormBrief) => {
      setPrompt(next.prompt);
      setLengthSeconds(next.lengthSeconds);
      setAspect(next.aspect);
      setReferences(next.references);
      advance("brief");
    },
    [advance],
  );

  /** Draws one frame; resolves to the image data URL, or undefined when the tile failed or the run is stale. */
  const runFrame = useCallback(
    async (
      key: string,
      run: number,
      currentPlan: VideoPlan,
      sceneId: string,
      refs: { heroFrameDataUrl?: string; currentFrameDataUrl?: string } = {},
    ): Promise<string | undefined> => {
      const scene = currentPlan.scenes.find((s) => s.id === sceneId);
      if (!scene) return undefined;
      const patch = (next: Partial<StoryboardFrame>) => {
        if (runRef.current !== run) return;
        setFrames((prev) => prev.map((f) => (f.sceneId === sceneId ? { ...f, ...next } : f)));
      };
      patch({ status: "generating", error: undefined, imageDataUrl: refs.currentFrameDataUrl, videoPrompt: undefined });
      try {
        const sceneReferenceDataUrls = scene.referenceIndexes.map((n) => {
          const ref = references[n - 1];
          if (!ref) throw new Error(`Upload ${n} was removed after the plan was written; regenerate the plan.`);
          return ref.dataUrl;
        });
        const imageDataUrl = await generateStoryboardFrame({
          apiKey: key,
          imageModel,
          plan: currentPlan,
          scene,
          aspect,
          subjectDataUrl: subject?.dataUrl,
          sceneReferenceDataUrls,
          heroFrameDataUrl: refs.heroFrameDataUrl,
          currentFrameDataUrl: refs.currentFrameDataUrl,
        });
        if (runRef.current !== run) {
          videoLog("storyboard", `scene ${scene.order} frame dropped: run ${run} is stale (current run ${runRef.current})`);
          return undefined;
        }
        patch({ status: "done", imageDataUrl });
        return imageDataUrl;
      } catch (e) {
        videoLogError("storyboard", `scene ${scene.order} failed`, e);
        patch({ status: "failed", error: errorText(e) });
        return undefined;
      }
    },
    [aspect, imageModel, references, subject],
  );

  /** Cinematographer writes scene `index`'s clip prompt from its frame and the previous frame; a failure fails the tile. */
  const writePrompt = useCallback(
    async (key: string, run: number, currentPlan: VideoPlan, index: number, frameDataUrl: string, previousFrameDataUrl?: string) => {
      const scene = currentPlan.scenes[index];
      const patch = (next: Partial<StoryboardFrame>) => {
        if (runRef.current !== run) return;
        setFrames((prev) => prev.map((f) => (f.sceneId === scene.id ? { ...f, ...next } : f)));
      };
      try {
        const videoPrompt = await writeSceneVideoPrompt({
          apiKey: key,
          plan: currentPlan,
          scene,
          frameDataUrl,
          previousScene: currentPlan.scenes[index - 1],
          previousFrameDataUrl,
          nextScene: currentPlan.scenes[index + 1],
        });
        if (runRef.current !== run) videoLog("cinematographer", `scene ${scene.order} prompt dropped: run ${run} is stale (current run ${runRef.current})`);
        patch({ videoPrompt });
      } catch (e) {
        videoLogError("cinematographer", `scene ${scene.order} failed`, e);
        patch({ status: "failed", error: errorText(e) });
      }
    },
    [],
  );

  /**
   * Draws `drawIds` (scene 1 first when included, since its frame anchors the rest, then the others in parallel) and writes the
   * clip prompt for every scene in `promptIds` as soon as that scene's frame and the previous scene's frame exist.
   * `existing` holds frames that are kept as they are; `current` holds frames being revised in place (edited, not redrawn from scratch).
   */
  const drawScenes = useCallback(
    async (
      key: string,
      run: number,
      currentPlan: VideoPlan,
      drawIds: string[],
      promptIds: string[],
      existing: Map<string, string>,
      current: Map<string, string> = new Map(),
    ) => {
      const heroId = currentPlan.scenes[0].id;
      let hero = existing.get(heroId);
      videoLog("storyboard", `run ${run}: draw ${drawIds.length} frames, write ${promptIds.length} prompts`, {
        draw: drawIds,
        prompts: promptIds,
        kept: [...existing.keys()],
        editedInPlace: [...current.keys()],
      });
      if (drawIds.includes(heroId)) {
        setBusy("Storyboard artist is drawing the hero frame (scene 1)");
        hero = await runFrame(key, run, currentPlan, heroId, { currentFrameDataUrl: current.get(heroId) });
        if (!hero) {
          if (runRef.current !== run) return;
          videoLogError("storyboard", "hero frame failed; the other frames are marked failed", drawIds);
          setFrames((prev) =>
            prev.map((f) =>
              drawIds.includes(f.sceneId) && f.sceneId !== heroId
                ? { ...f, status: "failed", error: "Scene 1 frame failed; regenerate it first" }
                : f,
            ),
          );
          return;
        }
      }
      const rest = drawIds.filter((id) => id !== heroId);
      if (rest.length) setBusy(`Storyboard artist is drawing ${rest.length === 1 ? "the scene" : `${rest.length} scenes`} from the hero frame`);
      const framePromises = new Map<string, Promise<string | undefined>>();
      for (const s of currentPlan.scenes) {
        framePromises.set(
          s.id,
          rest.includes(s.id)
            ? runFrame(key, run, currentPlan, s.id, { heroFrameDataUrl: hero, currentFrameDataUrl: current.get(s.id) })
            : Promise.resolve(s.id === heroId ? hero : existing.get(s.id)),
        );
      }
      await Promise.all(
        currentPlan.scenes.map(async (s, i) => {
          if (!promptIds.includes(s.id)) return;
          const frame = await framePromises.get(s.id);
          if (!frame) return videoLog("cinematographer", `scene ${s.order} prompt skipped: its frame is missing`);
          const previous = i > 0 ? await framePromises.get(currentPlan.scenes[i - 1].id) : undefined;
          if (i > 0 && !previous) return videoLog("cinematographer", `scene ${s.order} prompt skipped: previous frame is missing`);
          if (runRef.current !== run) return videoLog("cinematographer", `scene ${s.order} prompt skipped: run ${run} is stale`);
          await writePrompt(key, run, currentPlan, i, frame, previous);
        }),
      );
    },
    [runFrame, writePrompt],
  );

  const beginStoryboard = useCallback(
    async (key: string, next: VideoPlan) => {
      const run = bumpRun(`storyboard for "${next.title}", ${next.scenes.length} frames`);
      setFrames(next.scenes.map((s) => ({ sceneId: s.id, status: "waiting" as const })));
      setRender(null);
      setSelectedSceneId(next.scenes[0].id);
      setMaxStep("storyboard");
      advance("storyboard");
      const ids = next.scenes.map((s) => s.id);
      await drawScenes(key, run, next, ids, ids, new Map());
    },
    [advance, bumpRun, drawScenes],
  );

  /** A new plan replaces everything downstream and draws itself: storyboard frames, then clip prompts. */
  const startPlan = useCallback(
    async (key: string, next: VideoPlan) => {
      bumpRun(`plan "${next.title}" landed`);
      setPlan(next);
      await beginStoryboard(key, next);
    },
    [beginStoryboard, bumpRun],
  );

  const continueToProduct = useCallback(() => advance("product"), [advance]);

  const patchProductView = useCallback((viewId: ProductViewId, patch: Partial<ProductLockState["views"][number]>) => {
    setProductLock((prev) => ({
      ...prev,
      views: prev.views.map((v) => (v.id === viewId ? { ...v, ...patch } : v)),
    }));
  }, []);

  const generateProductViews = useCallback(
    async (viewIds?: ProductViewId[]) => {
      const key = requireApiKey();
      if (!key || !subjectPhotos.length) return;
      setError("");
      setBusy("Reading the product from your photos");
      try {
        let spec = productLock.spec;
        if (!spec) {
          spec = await extractProductSpec({
            apiKey: key,
            briefPrompt: prompt,
            subjectPhotos,
            productHeroReferences: references.slice(0, 2),
          });
          setProductLock((prev) => ({ ...prev, spec }));
        }
        const refUrls = collectProductReferenceDataUrls({ subjectPhotos, references });
        const targets = viewIds?.length ? productLock.views.filter((v) => viewIds.includes(v.id)) : productLock.views;
        let frontDataUrl: string | undefined = productLock.views.find((v) => v.id === "front_elevation")?.imageDataUrl;
        for (const view of targets) {
          patchProductView(view.id, { status: "generating", error: undefined });
          setBusy(`Rendering product view: ${view.label}`);
          try {
            const imageDataUrl = await generateProductView({
              apiKey: key,
              imageModel,
              spec,
              viewId: view.id,
              referenceDataUrls: refUrls,
              priorViewDataUrl: view.id !== "front_elevation" ? frontDataUrl : undefined,
            });
            if (view.id === "front_elevation") frontDataUrl = imageDataUrl;
            patchProductView(view.id, { status: "done", imageDataUrl });
          } catch (e) {
            patchProductView(view.id, { status: "failed", error: errorText(e) });
          }
        }
      } catch (e) {
        videoLogError("product", "generate failed", e);
        setError(errorText(e));
      } finally {
        setBusy(null);
      }
    },
    [imageModel, patchProductView, productLock.spec, productLock.views, prompt, references, requireApiKey, subjectPhotos],
  );

  const regenerateProductView = useCallback(
    (viewId: ProductViewId) => {
      void generateProductViews([viewId]);
    },
    [generateProductViews],
  );

  const productReadyToLock =
    productLock.views.length > 0 && productLock.views.every((v) => v.status === "done" && v.imageDataUrl);

  /** Clears every step after the Brief and asks the Director's questions for `currentBrief`. */
  const clarify = useCallback(
    async (key: string, currentBrief: VideoBrief) => {
      bumpRun("asking the Director's questions");
      setQuestions(null);
      setAnswers({});
      setPlan(null);
      setFrames([]);
      setRender(null);
      setSelectedSceneId(null);
      setError("");
      setBusy("Director is reading the brief");
      setStep("questions");
      setMaxStep("questions");
      try {
        const result = await runVideoDirectorClarify({ apiKey: key, brief: currentBrief });
        setQuestions(result.questions);
      } catch (e) {
        videoLogError("clarify", "failed", e);
        setError(errorText(e));
      } finally {
        setBusy(null);
      }
    },
    [bumpRun],
  );

  /** The four studio renders become the subject harness the Director and every storyboard frame receive; then the Director is asked. */
  const lockProduct = useCallback(async () => {
    const key = requireApiKey();
    if (!key || !productReadyToLock) return;
    setError("");
    setBusy("Building the locked product harness");
    let locked: ManualImageReference;
    try {
      const renders = productLock.views.map((v, i) => ({
        fileName: `product-lock-${String(i + 1).padStart(2, "0")}-${v.id}.png`,
        dataUrl: v.imageDataUrl as string,
      }));
      const harnessDataUrl = await buildSubjectHarness({ apiKey: key, images: renders });
      locked = await manualReferenceFromDataUrl("subject-harness.png", harnessDataUrl);
      setSubject(locked);
      setProductLock((prev) => ({ ...prev, locked: true }));
      videoLog("product", "locked", { views: renders.map((r) => r.fileName) });
    } catch (e) {
      videoLogError("product", "lock failed", e);
      setError(errorText(e));
      setBusy(null);
      return;
    }
    await clarify(key, { ...brief, subject: locked });
  }, [brief, clarify, productLock.views, productReadyToLock, requireApiKey]);

  const draftPlan = useCallback(
    async (key: string, qs: VideoClarifyQuestion[], ans: Record<string, string>) => {
      bumpRun("drafting a new plan");
      setPlan(null);
      setPlanLive({ reasoning: "", content: "" });
      setFrames([]);
      setRender(null);
      setSelectedSceneId(null);
      setError("");
      setBusy("Director is writing the scene plan");
      setStep("plan");
      setMaxStep("plan");
      try {
        const next = await runVideoDirectorPlan({
          apiKey: key,
          brief,
          questions: qs,
          answers: ans,
          onDelta: (d) => setPlanLive((prev) => ({ reasoning: prev.reasoning + d.reasoning, content: prev.content + d.content })),
        });
        await startPlan(key, next);
      } catch (e) {
        videoLogError("plan", "draft failed", e);
        setError(errorText(e));
      } finally {
        setBusy(null);
      }
    },
    [brief, bumpRun, startPlan],
  );

  const askQuestions = useCallback(async () => {
    const key = requireApiKey();
    if (!key || !prompt.trim()) return;
    await clarify(key, brief);
  }, [brief, clarify, prompt, requireApiKey]);

  const answerQuestion = useCallback((id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }, []);

  const allAnswered = Boolean(questions?.length) && (questions ?? []).every((q) => Boolean(answers[q.id]?.trim()));

  const submitAnswers = useCallback(async () => {
    const key = requireApiKey();
    if (!key || !questions || !allAnswered) return;
    await draftPlan(key, questions, answers);
  }, [allAnswered, answers, draftPlan, questions, requireApiKey]);

  const regeneratePlan = useCallback(async () => {
    const key = requireApiKey();
    if (!key) return;
    await draftPlan(key, questions ?? [], answers);
  }, [answers, draftPlan, questions, requireApiKey]);

  const regenerateFrame = useCallback(
    async (sceneId: string) => {
      const key = requireApiKey();
      if (!key || !plan) return;
      const run = runRef.current;
      const index = plan.scenes.findIndex((s) => s.id === sceneId);
      const existing = new Map(frames.filter((f) => f.imageDataUrl && f.sceneId !== sceneId).map((f) => [f.sceneId, f.imageDataUrl as string]));
      const next = plan.scenes[index + 1];
      setRender(null);
      setBusy(`Storyboard artist is redrawing scene ${plan.scenes[index]?.order ?? ""}`);
      await drawScenes(key, run, plan, [sceneId], next ? [sceneId, next.id] : [sceneId], existing);
      setBusy(null);
    },
    [drawScenes, frames, plan, requireApiKey],
  );

  const sendInstruction = useCallback(
    async (scope: InstructionScope, instruction: string) => {
      const key = requireApiKey();
      const text = instruction.trim();
      if (!key || !plan || !text) return;
      if (scope === "scene" && !selectedSceneId) return;
      setError("");
      try {
        if (scope === "scene") {
          const sceneId = selectedSceneId as string;
          setBusy("Director is revising the scene");
          const revised = await runVideoDirectorReviseScene({ apiKey: key, brief, plan, sceneId, instruction: text });
          const index = plan.scenes.findIndex((s) => s.id === sceneId);
          const nextPlan: VideoPlan = { ...plan, scenes: plan.scenes.map((s) => (s.id === sceneId ? revised : s)) };
          const run = bumpRun(`scene ${revised.order} revised`);
          setPlan(nextPlan);
          setRender(null);
          rewind("storyboard");
          const current = frames.find((f) => f.sceneId === sceneId)?.imageDataUrl;
          const existing = new Map(frames.filter((f) => f.imageDataUrl && f.sceneId !== sceneId).map((f) => [f.sceneId, f.imageDataUrl as string]));
          setFrames((prev) => prev.map((f) => (f.sceneId === sceneId ? { ...f, status: "waiting", videoPrompt: undefined } : f)));
          const next = nextPlan.scenes[index + 1];
          setBusy("Storyboard artist is redrawing the scene");
          await drawScenes(
            key,
            run,
            nextPlan,
            [sceneId],
            next ? [sceneId, next.id] : [sceneId],
            existing,
            current ? new Map([[sceneId, current]]) : new Map(),
          );
          return;
        }
        setBusy("Director is revising the plan");
        const nextPlan = await runVideoDirectorRevisePlan({ apiKey: key, brief, plan, instruction: text });
        const run = bumpRun("plan revised");
        setPlan(nextPlan);
        setRender(null);
        if (!nextPlan.scenes.some((s) => s.id === selectedSceneId)) setSelectedSceneId(nextPlan.scenes[0].id);
        rewind("storyboard");
        const changed = nextPlan.scenes
          .filter((s) => {
            const before = plan.scenes.find((p) => p.id === s.id);
            return !before || before.storyboardPrompt !== s.storyboardPrompt;
          })
          .map((s) => s.id);
        videoLog("revise", "scenes whose storyboard changed will be redrawn", changed);
        const kept = new Map(frames.filter((f) => f.imageDataUrl && !changed.includes(f.sceneId)).map((f) => [f.sceneId, f]));
        setFrames(
          nextPlan.scenes.map((s) => {
            const k = kept.get(s.id);
            return k ? { ...k, videoPrompt: undefined } : { sceneId: s.id, status: "waiting" as const };
          }),
        );
        const existing = new Map(Array.from(kept.values()).map((f) => [f.sceneId, f.imageDataUrl as string]));
        await drawScenes(
          key,
          run,
          nextPlan,
          changed,
          nextPlan.scenes.map((s) => s.id),
          existing,
        );
      } catch (e) {
        videoLogError("revise", "failed", e);
        setError(errorText(e));
      } finally {
        setBusy(null);
      }
    },
    [brief, bumpRun, drawScenes, frames, plan, requireApiKey, rewind, selectedSceneId],
  );

  /** Every frame is drawn and every clip prompt is written: the render can be bought. */
  const readyToRender = frames.length > 0 && frames.every((f) => f.status === "done" && f.imageDataUrl && f.videoPrompt);

  const renderVideo = useCallback(async () => {
    const key = requireApiKey();
    if (!key || !plan || !readyToRender) return;
    setError("");
    const elapsed = videoTimer();
    try {
      setBusy("Submitting the render");
      const scenes = plan.scenes.map((s) => {
        const frame = frames.find((f) => f.sceneId === s.id);
        if (!frame?.imageDataUrl || !frame.videoPrompt) throw new Error(`Scene ${s.order} has no frame or clip prompt.`);
        return {
          id: s.id,
          order: s.order,
          durationSeconds: s.durationSeconds,
          videoPrompt: frame.videoPrompt,
          narration: s.narration,
          transitionIn: s.transitionIn,
          frameDataUrl: frame.imageDataUrl,
        };
      });
      const renderId = await createVideoRender({
        apiKey: key,
        model: videoModel,
        resolution,
        aspectRatio: aspect,
        voiceModel: DEFAULT_VOICE_MODEL,
        voice: plan.voice,
        scenes: scenes.map(({ frameDataUrl: _frame, ...scene }) => scene),
      });
      for (const scene of scenes) {
        videoLog("render", `uploading frame for scene ${scene.order}`, { bytes: scene.frameDataUrl.length });
        await uploadVideoRenderFrame({ apiKey: key, renderId, sceneId: scene.id, dataUrl: scene.frameDataUrl });
      }
      const snapshot = await startVideoRender({ apiKey: key, renderId });
      videoLog("render", "started", { seconds: elapsed(), snapshot });
      setRender(snapshot);
      advance("render");
    } catch (e) {
      videoLogError("render", `submit failed after ${elapsed()} s`, e);
      setError(errorText(e));
    } finally {
      setBusy(null);
    }
  }, [advance, aspect, frames, plan, readyToRender, requireApiKey, resolution, videoModel]);

  const renderActive = render !== null && (render.status === "rendering" || render.status === "stitching");
  const apiKeyRef = useRef(apiKey);
  apiKeyRef.current = apiKey;

  useEffect(() => {
    if (!renderActive || !render) return;
    const renderId = render.id;
    let cancelled = false;
    const tick = async () => {
      try {
        const next = await fetchVideoRender({ apiKey: apiKeyRef.current, renderId });
        if (next.status === "done" || next.status === "failed") videoLog("render", `finished: ${next.status}`, { finalUrl: next.finalUrl, error: next.error });
        if (!cancelled) setRender(next);
      } catch (e) {
        videoLogError("render", "poll failed", e);
        if (!cancelled) setError(errorText(e));
      }
    };
    const handle = window.setInterval(() => void tick(), RENDER_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(handle);
    };
  }, [render, renderActive]);

  const reset = useCallback(() => {
    bumpRun("new video");
    setStep("brainstorm");
    setMaxStep("brief");
    setQuestions(null);
    setAnswers({});
    setPlan(null);
    setFrames([]);
    setSelectedSceneId(null);
    setRender(null);
    setSubjectPhotos([]);
    setSubject(null);
    setProductLock({ spec: null, views: initialProductViews(), locked: false });
    setError("");
  }, [bumpRun]);

  return {
    step,
    maxStep,
    setStep,
    brief,
    setPrompt,
    setLengthSeconds,
    setAspect,
    setResolution,
    isPreparingReferences,
    addReferenceFiles,
    removeReference,
    subjectPhotos,
    isPreparingSubject,
    addSubjectFiles,
    removeSubjectPhoto,
    clearSubject,
    setBriefFromBrainstorm,
    questions,
    answers,
    answerQuestion,
    allAnswered,
    plan,
    planLive,
    frames,
    readyToRender,
    selectedSceneId,
    selectScene: setSelectedSceneId,
    render,
    renderActive,
    busy,
    error,
    videoModel,
    estimatedCostUsd,
    askQuestions,
    submitAnswers,
    regeneratePlan,
    regenerateFrame,
    sendInstruction,
    renderVideo,
    reset,
    needsProductStep,
    continueToProduct,
    productLock,
    productReadyToLock,
    generateProductViews,
    regenerateProductView,
    lockProduct,
  };
}

export type VideoGeneratorController = ReturnType<typeof useVideoGenerator>;
