import type { FlowFreeformClarifyQuestion } from "@/lib/flow-freeform/flow-freeform-types";
import type { ManualImageReference } from "@/lib/image-generator/manual-reference-upload";
import type { HeygenVoice, VideoAspect, VideoLengthSeconds, VideoResolution } from "./video-model-defaults";

export type { FlowFreeformClarifyQuestion as VideoClarifyQuestion };

export type VideoBrief = {
  prompt: string;
  lengthSeconds: VideoLengthSeconds;
  aspect: VideoAspect;
  resolution: VideoResolution;
  references: ManualImageReference[];
  /** Subject harness: the product photos tiled into one sheet, attached first to every agent and storyboard frame. */
  subject: ManualImageReference | null;
};

export type VideoTransitionType = "continue" | "dissolve";

/** How this scene joins the previous one: `continue` starts from the previous clip's last frame; `dissolve` crossfades. */
export type VideoTransition = {
  type: VideoTransitionType;
  /** Dissolve length in seconds (0 for continue). */
  seconds: number;
};

export type VideoScreenDirection = "left_to_right" | "right_to_left";

/** Plan-wide rules every frame and clip must obey. */
export type VideoPlanContinuity = {
  heroSubject: string;
  screenDirection: VideoScreenDirection;
  cameraSide: string;
  palette: string;
  lightArc: string;
};

export type VideoScenePlan = {
  id: string;
  order: number;
  title: string;
  durationSeconds: number;
  /** Director's full scene instructions (what happens, why it matters). */
  sceneInstructions: string;
  /** Opening still for the storyboard artist. */
  storyboardPrompt: string;
  /** Camera and subject motion over the clip. */
  motionPrompt: string;
  continuityNotes: string;
  /** Voiceover spoken over this scene (plain spoken English). */
  narration: string;
  /** 1-based positions in `VideoBrief.references` this scene's opening frame is drawn from (empty when none). */
  referenceIndexes: number[];
  /** Absent on scene 1; required on every later scene. */
  transitionIn?: VideoTransition;
};

export type VideoPlan = {
  title: string;
  logline: string;
  continuity: VideoPlanContinuity;
  /** HeyGen Voice 1 voice for the narration track; "none" when the brief did not ask for narration (every scene narration is then ""). */
  voice: HeygenVoice | "none";
  scenes: VideoScenePlan[];
};

export type StoryboardFrameStatus = "waiting" | "generating" | "done" | "failed";

export type StoryboardFrame = {
  sceneId: string;
  status: StoryboardFrameStatus;
  imageDataUrl?: string;
  /** Final clip prompt written by the Cinematographer from the finished frame. */
  videoPrompt?: string;
  error?: string;
};

export type VideoRenderSceneStatus = "queued" | "generating" | "done" | "failed";

export type VideoRenderScene = {
  sceneId: string;
  status: VideoRenderSceneStatus;
  clipUrl?: string;
  error?: string;
};

export type VideoRenderStatus = "created" | "rendering" | "stitching" | "done" | "failed";

export type VideoRenderSnapshot = {
  id: string;
  status: VideoRenderStatus;
  scenes: VideoRenderScene[];
  finalUrl?: string;
  error?: string;
};

export type ProductViewId = "front_elevation" | "side_elevation" | "three_quarter" | "glazing_detail";

export type ProductViewStatus = "waiting" | "generating" | "done" | "failed";

export type ProductView = {
  id: ProductViewId;
  label: string;
  status: ProductViewStatus;
  imageDataUrl?: string;
  error?: string;
};

/** Canonical product identity extracted from subject photos and hero references before storyboard. */
export type ProductSpec = {
  name: string;
  summary: string;
  proportions: string;
  roof: string;
  cladding: string;
  glazing: string;
  baseOrChassis: string;
  palette: string;
  mustNotChange: string[];
};

export type ProductLockState = {
  spec: ProductSpec | null;
  views: ProductView[];
  locked: boolean;
};
