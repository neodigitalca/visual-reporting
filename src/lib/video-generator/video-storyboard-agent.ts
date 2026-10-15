import { generateImage } from "@/lib/image-api";
import { fetchImageDataUrlViaApi } from "@/lib/proxy-fetch-text";
import type { VideoAspect } from "./video-model-defaults";
import type { VideoPlan, VideoScenePlan } from "./video-generator-types";
import { videoLog, videoLogError, videoTimer } from "./video-log";

/** Storyboard artist: one opening still per scene through the existing image generator. */

/** Subject harness + hero (or current) frame + one scene upload. */
const STORYBOARD_MAX_REFERENCES = 3;

export function continuityBlock(plan: VideoPlan): string {
  const c = plan.continuity;
  return `Hero subject: ${c.heroSubject}. Screen direction for all travel: ${c.screenDirection.replace(/_/g, " ")}. Camera stays on: ${c.cameraSide}. Palette: ${c.palette}. Light: ${c.lightArc}.`;
}

const ORDINAL = ["first", "second", "third", "fourth"];

function storyboardPromptFor(args: {
  plan: VideoPlan;
  scene: VideoScenePlan;
  aspect: VideoAspect;
  hasSubject: boolean;
  hasHeroFrame: boolean;
  hasCurrentFrame: boolean;
  sceneReferenceCount: number;
}): string {
  const { plan, scene, aspect } = args;
  let slot = 0;
  const subjectRule = args.hasSubject
    ? `The ${ORDINAL[slot++]} reference image is the subject harness: the real product photographed from several angles. The hero subject in this frame IS this product: identical design, proportions, materials, cladding, glazing, colours and details. Do not substitute, restyle or simplify it.`
    : "";
  const anchorRule = args.hasCurrentFrame
    ? `The ${ORDINAL[slot++]} reference image is the current version of this frame: keep its composition, camera angle, subject, setting, lighting and palette, and change only what the revised description below changes.`
    : args.hasHeroFrame
      ? `The ${ORDINAL[slot++]} reference image is the hero frame of this video: match its subject, materials, palette and the direction the subject faces exactly; this frame is a later moment of the same story.`
      : "";
  const n = args.sceneReferenceCount;
  const uploadRule =
    n > 0
      ? `The ${n === 1 ? ORDINAL[slot] : `next ${n}`} reference image${n === 1 ? " is" : "s are"} the client's own frame${n === 1 ? "" : "s"} for this scene (sketch, drawing or photo): reproduce the composition, subject placement, camera angle and the direction the subject faces exactly, rendered photoreal.`
      : "";
  const facing = plan.continuity.screenDirection === "left_to_right" ? "RIGHT" : "LEFT";
  return `Storyboard frame ${scene.order} of ${plan.scenes.length} for the video "${plan.title}".
${subjectRule}
${anchorRule}
${uploadRule}
${scene.storyboardPrompt}

Video continuity (every frame obeys it): ${continuityBlock(plan)}
Facing (hard rule): the hero subject's front (a vehicle's cab, nose and headlights; a person's face and toes; the leading edge of anything being carried) points to screen ${facing}, because every movement in this video travels ${plan.continuity.screenDirection.replace(/_/g, " ")}. Never mirror the composition.
Identity (hard rule): the hero subject is the same physical object in every frame: same design, proportions, colours, materials, cladding, windows and details as the reference images. Do not redesign, restyle or swap it; only its position, the setting and the light change between scenes.
Scene continuity: ${scene.continuityNotes || "keep subject, wardrobe, setting and palette consistent."}
This is the opening frame of a continuous shot; composition must leave room for this motion: ${scene.motionPrompt}
Photoreal cinematic still, ${aspect} frame, no text, no captions, no watermark, no borders.`;
}

export async function generateStoryboardFrame(args: {
  apiKey: string;
  imageModel: string;
  plan: VideoPlan;
  scene: VideoScenePlan;
  aspect: VideoAspect;
  /** Subject harness sheet; always reference 1 when present. */
  subjectDataUrl?: string;
  /** The uploads the Director assigned to this scene (`scene.referenceIndexes`), in that order. */
  sceneReferenceDataUrls: string[];
  /** Scene 1 frame, prepended as the first reference for every later scene. */
  heroFrameDataUrl?: string;
  /** Existing frame being revised; wins over the hero frame as the first reference. */
  currentFrameDataUrl?: string;
}): Promise<string> {
  const anchor = args.currentFrameDataUrl ?? args.heroFrameDataUrl;
  const references = [
    ...(args.subjectDataUrl ? [args.subjectDataUrl] : []),
    ...(anchor ? [anchor] : []),
    ...args.sceneReferenceDataUrls,
  ].slice(0, STORYBOARD_MAX_REFERENCES);
  const elapsed = videoTimer();
  videoLog("storyboard", `scene ${args.scene.order} draw start`, {
    model: args.imageModel,
    subjectHarness: Boolean(args.subjectDataUrl),
    anchor: args.currentFrameDataUrl ? "current frame" : args.heroFrameDataUrl ? "hero frame" : "none",
    sceneReferences: args.sceneReferenceDataUrls.length,
    referencesAttached: references.length,
    title: args.scene.title,
  });
  const result = await generateImage({
    apiKey: args.apiKey,
    prompt: storyboardPromptFor({
      plan: args.plan,
      scene: args.scene,
      aspect: args.aspect,
      hasSubject: Boolean(args.subjectDataUrl),
      hasHeroFrame: Boolean(args.heroFrameDataUrl) && !args.currentFrameDataUrl,
      hasCurrentFrame: Boolean(args.currentFrameDataUrl),
      sceneReferenceCount: Math.max(0, references.length - (args.subjectDataUrl ? 1 : 0) - (anchor ? 1 : 0)),
    }),
    model: args.imageModel,
    aspectRatio: args.aspect,
    referenceImageDataUrls: references,
    maxReferenceImages: STORYBOARD_MAX_REFERENCES,
  });
  if (result.error) {
    videoLogError("storyboard", `scene ${args.scene.order} draw failed after ${elapsed()} s`, result.error);
    throw new Error(result.error);
  }
  let dataUrl: string;
  if (result.imageBase64) {
    dataUrl = result.imageBase64.startsWith("data:") ? result.imageBase64 : `data:image/png;base64,${result.imageBase64}`;
  } else if (result.imageUrl) {
    dataUrl = result.imageUrl.startsWith("data:image/") ? result.imageUrl : await fetchImageDataUrlViaApi(result.imageUrl);
  } else {
    videoLogError("storyboard", `scene ${args.scene.order} draw returned no image after ${elapsed()} s`, result);
    throw new Error("Image generator returned no image.");
  }
  videoLog("storyboard", `scene ${args.scene.order} draw done`, { seconds: elapsed(), bytes: dataUrl.length });
  return dataUrl;
}
