import { callAgentCategoryOpenRouterChat } from "@/lib/openrouter-agent-category-api";
import { parseJsonObjectFromModelText } from "@/lib/openrouter-vision-chat";
import { continuityBlock } from "./video-storyboard-agent";
import type { VideoPlan, VideoScenePlan } from "./video-generator-types";
import { videoLog, videoLogError, videoTimer } from "./video-log";

/** Cinematographer: looks at the storyboard frame, its neighbours and the continuity rules, and writes the image-to-video prompt. */

export function buildCinematographerSystemPrompt(): string {
  return `You are the Cinematographer on a short video that must cut together as one seamless piece.
You receive the Director's continuity rules, this scene, the previous and next scenes, and one or two images: image 1 is this scene's storyboard still; image 2 (when present) is the previous scene's storyboard still.
Write the prompt for an image-to-video model that animates this scene as ONE continuous shot.
Output a single JSON object only, no markdown fences. Schema: {"facing":"string","facingMatchesDirection":true,"videoPrompt":"string"}
Rules:
- facing: first look at image 1 and state which way the hero subject faces or travels (screen left, screen right, toward camera, away from camera). Facing is the direction the FRONT points: a person's face and toes, a vehicle's cab, nose and headlights (a truck with its cab on the screen-left end of its load faces screen left), the leading edge of a carried object in the direction it is being moved. A stationary object with no front (a box, a building, a module on piers) has facing "none" and matches any direction. facingMatchesDirection is true only when forward motion in the plan's screen direction is possible from that facing without the subject reversing or turning around.
- videoPrompt: 40 to 80 words, present tense, one continuous shot. Camera movement (push-in, pan, dolly, handheld, static), subject motion, light and atmosphere changes, pacing.
- All motion is FORWARD in the plan's screen direction. Never describe reversing, backing up, or motion toward the opposite side of frame.
- For a "continue" join: the clip is generated FROM THE FINAL FRAME OF THE PREVIOUS CLIP, not from image 1. Open on that end state (previous scene's motion completed) and move naturally into image 1's composition, then play this scene's motion. Say this explicitly in the first sentence.
- For a "dissolve" join or scene 1: the clip opens exactly on image 1.
- End the clip in a state the next scene can pick up from (describe the final pose, position and light in the last sentence).
- Mention only subjects, objects and setting elements visible in the images. No new people, props, text or locations.`;
}

function sceneLine(label: string, scene: VideoScenePlan | undefined): string {
  if (!scene) return `${label}: none`;
  return `${label}: scene ${scene.order} "${scene.title}" (${scene.durationSeconds} s). Motion: ${scene.motionPrompt}. Narration: ${scene.narration || "none"}`;
}

export async function writeSceneVideoPrompt(args: {
  apiKey: string;
  siteId?: string | null;
  plan: VideoPlan;
  scene: VideoScenePlan;
  frameDataUrl: string;
  previousScene?: VideoScenePlan;
  previousFrameDataUrl?: string;
  nextScene?: VideoScenePlan;
}): Promise<string> {
  const join = args.scene.transitionIn
    ? `${args.scene.transitionIn.type}${args.scene.transitionIn.type === "dissolve" ? ` ${args.scene.transitionIn.seconds} s` : ""}`
    : "scene 1 (opens the video)";
  const text = `Video: "${args.plan.title}" (${args.plan.logline})
Continuity: ${continuityBlock(args.plan)}
This scene: ${args.scene.order} "${args.scene.title}", ${args.scene.durationSeconds} s clip, join from previous: ${join}
Scene instructions: ${args.scene.sceneInstructions}
Director motion: ${args.scene.motionPrompt}
Scene continuity: ${args.scene.continuityNotes}
Narration over this scene: ${args.scene.narration || "none"}
${sceneLine("Previous scene", args.previousScene)}
${sceneLine("Next scene", args.nextScene)}`;
  const images: Array<{ type: "image_url"; image_url: { url: string } }> = [{ type: "image_url", image_url: { url: args.frameDataUrl } }];
  if (args.previousFrameDataUrl) images.push({ type: "image_url", image_url: { url: args.previousFrameDataUrl } });
  const elapsed = videoTimer();
  videoLog("cinematographer", `scene ${args.scene.order} prompt start`, { join, images: images.length });
  const res = await callAgentCategoryOpenRouterChat({
    category: "research",
    siteId: args.siteId,
    apiKey: args.apiKey,
    messages: [
      { role: "system", content: buildCinematographerSystemPrompt() },
      { role: "user", content: [{ type: "text", text }, ...images] },
    ],
    temperature: 0.3,
    maxTokens: 16000,
    reasoning: { effort: "low" },
    responseFormat: { type: "json_object" },
  });
  videoLog("cinematographer", `scene ${args.scene.order} reply`, { seconds: elapsed(), finishReason: res.finishReason, content: res.content });
  const parsed = parseJsonObjectFromModelText(res.content);
  const videoPrompt = String(parsed.videoPrompt ?? "").trim();
  const facing = String(parsed.facing ?? "").trim();
  if (parsed.facingMatchesDirection !== true) {
    const message = `Scene ${args.scene.order} frame faces the wrong way (${facing || "unknown"}) for ${args.plan.continuity.screenDirection.replace(/_/g, " ")} travel. Redraw it or tell the Director.`;
    videoLogError("cinematographer", `scene ${args.scene.order} rejected`, message);
    throw new Error(message);
  }
  if (!videoPrompt) {
    videoLogError("cinematographer", `scene ${args.scene.order} rejected`, "empty videoPrompt");
    throw new Error(`Cinematographer returned an empty videoPrompt for scene ${args.scene.order}.`);
  }
  videoLog("cinematographer", `scene ${args.scene.order} prompt done`, { facing, words: videoPrompt.split(/\s+/).length, videoPrompt });
  return videoPrompt;
}
