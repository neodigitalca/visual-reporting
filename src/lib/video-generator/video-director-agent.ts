import { parseClarifyJson } from "@/lib/flow-freeform/flow-freeform-prompts";
import type { FlowFreeformClarifyResult } from "@/lib/flow-freeform/flow-freeform-types";
import { callAgentCategoryOpenRouterChat, streamAgentCategoryOpenRouterChat } from "@/lib/openrouter-agent-category-api";
import type { OpenRouterAppMessage, OpenRouterAppStreamDelta } from "@/lib/openrouter-app-api";
import { parseJsonObjectFromModelText } from "@/lib/openrouter-vision-chat";
import type {
  VideoBrief,
  VideoPlan,
  VideoPlanContinuity,
  VideoScenePlan,
  VideoTransition,
} from "./video-generator-types";
import { videoLog, videoLogError, videoTimer } from "./video-log";
import {
  HEYGEN_VOICES,
  NARRATION_WORDS_PER_SECOND,
  VIDEO_SCENE_MAX_SECONDS,
  VIDEO_SCENE_MIN_SECONDS,
  type HeygenVoice,
} from "./video-model-defaults";

/** Director agent: clarifies the brief, then writes the scene plan. Runs on the research model. */

export function briefBlock(brief: VideoBrief): string {
  const refs = brief.references.length
    ? brief.references.map((r, i) => `Image ${i + 1}: ${r.fileName}`).join("\n")
    : "(none)";
  const subject = brief.subject
    ? "Subject harness (attached first): the one product this video is about, photographed from several angles. continuity.heroSubject names exactly this product and every scene features it as it is; the harness is not one of the numbered images and is assigned to no scene."
    : "Subject harness: none.";
  const refCount = brief.references.length;
  return `Target length: ${brief.lengthSeconds} seconds
Aspect ratio: ${brief.aspect}
Resolution: ${brief.resolution}
${subject}
Numbered reference images uploaded: ${refCount}. Subject photos and the subject harness are NOT numbered images. Every scene referenceIndexes entry must use integers 1..${refCount}, or [] when ${refCount} is 0. Do not assign Image numbers that appear only in the brief text if those files were not uploaded.
Images uploaded by the user (attached ${brief.subject ? "after the harness" : "below"} in this order):
${refs}

Brief:
${brief.prompt.trim()}`;
}

/** System text plus one user message: the text, the subject harness when present, then every uploaded image in upload order. */
export function directorMessages(system: string, userText: string, brief: VideoBrief): OpenRouterAppMessage[] {
  return [
    { role: "system", content: system },
    {
      role: "user",
      content: [
        { type: "text", text: userText },
        ...(brief.subject ? [{ type: "image_url", image_url: { url: brief.subject.dataUrl } }] : []),
        ...brief.references.map((r) => ({ type: "image_url", image_url: { url: r.dataUrl } })),
      ],
    },
  ];
}

/** Every legal scene count for the length with its average duration, e.g. "3 scenes (10 s each on average), 4 scenes (7.5 s), ...". */
function sceneCountOptions(lengthSeconds: number): string {
  const min = Math.ceil(lengthSeconds / VIDEO_SCENE_MAX_SECONDS);
  const max = Math.floor(lengthSeconds / VIDEO_SCENE_MIN_SECONDS);
  const counts = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return counts.map((n) => `${n} scenes (${(lengthSeconds / n).toFixed(1)} s each on average)`).join(", ");
}

function answersBlock(answers: Record<string, string>, questions: { id: string; text: string }[]): string {
  const lines = questions
    .map((q) => {
      const a = answers[q.id]?.trim();
      return a ? `- ${q.text} -> ${a}` : "";
    })
    .filter(Boolean);
  return lines.length ? lines.join("\n") : "(none)";
}

export function buildDirectorClarifySystemPrompt(): string {
  return `You are the Director for ONE short video (storyboard first, then one continuous clip per scene).
Output a single JSON object only, no markdown fences.
Schema: {"questions":[{"id":"string","text":"string","options":["string",...]}]}
Always ask 2 to 4 questions, never zero. Each question has 2 to 6 distinct, fixed options the user can pick without typing.
Prioritize the creative decisions the brief leaves open or only implies: pacing and energy, camera style, main subject or character, time of day and light, text overlays, closing shot or call to action, how literally to follow the uploaded images.
Narration, voiceover, music and sound are OFF unless the brief asks for them; never ask about them unless the brief mentions them.
Look at every uploaded image before asking; do not ask what they show or whether to use them. When a subject harness is attached, the hero subject is that product: never ask what the subject is or whether to feature it.
Do NOT ask about length, aspect ratio, or resolution; those are already set. Do not restate facts the brief already decides as a question.
Ids must be snake_case and unique.`;
}

export async function runVideoDirectorClarify(args: {
  apiKey: string;
  siteId?: string | null;
  brief: VideoBrief;
  signal?: AbortSignal;
}): Promise<FlowFreeformClarifyResult> {
  const elapsed = videoTimer();
  videoLog("clarify", "request", { promptChars: args.brief.prompt.length, subjectHarness: Boolean(args.brief.subject), references: args.brief.references.map((r) => r.fileName) });
  const res = await callAgentCategoryOpenRouterChat({
    category: "research",
    siteId: args.siteId,
    apiKey: args.apiKey,
    messages: directorMessages(buildDirectorClarifySystemPrompt(), briefBlock(args.brief), args.brief),
    maxTokens: 16000,
    reasoning: { effort: "low" },
    temperature: 0.25,
    responseFormat: { type: "json_object" },
    signal: args.signal,
  });
  videoLog("clarify", "reply", { seconds: elapsed(), finishReason: res.finishReason, content: res.content });
  const parsed = parseClarifyJson(res.content);
  if (parsed.questions.length === 0) {
    videoLogError("clarify", "no questions in reply", res.content);
    throw new Error("Director returned no questions; the brief step requires 2 to 4 multiple-choice questions.");
  }
  videoLog("clarify", "questions", parsed.questions.map((q) => q.text));
  return parsed;
}

export const PLAN_SCHEMA = `{"title":"string","logline":"string","voice":"none|nadine|tabitha|bram|gareth|noelle|meredith|sabrina|lucian|weston|vincent","continuity":{"heroSubject":"string","screenDirection":"left_to_right|right_to_left","cameraSide":"string","palette":"string","lightArc":"string"},"scenes":[{"id":"string","order":1,"title":"string","durationSeconds":8,"sceneInstructions":"string","storyboardPrompt":"string","motionPrompt":"string","continuityNotes":"string","narration":"string","referenceIndexes":[2],"transitionIn":null},{"id":"string","order":2,"title":"string","durationSeconds":7,"sceneInstructions":"string","storyboardPrompt":"string","motionPrompt":"string","continuityNotes":"string","narration":"string","referenceIndexes":[3],"transitionIn":{"type":"continue|dissolve","seconds":0}}]}`;

export const SCENE_RULES = `- durationSeconds is an integer from ${VIDEO_SCENE_MIN_SECONDS} to ${VIDEO_SCENE_MAX_SECONDS}.
- sceneInstructions: what happens in the scene, the beat it delivers, and any on-screen text (2 to 4 sentences).
- storyboardPrompt: the opening still as an image prompt: subject, framing, lens, lighting, palette, materials, mood. Describe only what is visible in that first frame, and state explicitly which way the hero subject faces (screen left or screen right) so it matches continuity.screenDirection.
- motionPrompt: camera movement and subject motion across the clip, in present tense. All travel is FORWARD in continuity.screenDirection; never reverse, never cross the axis of action (180 degree rule). No new characters or locations.
- continuityNotes: character, wardrobe, setting, and palette details that must stay identical across scenes.
- narration: exactly "" (empty) unless the brief explicitly asks for narration, voiceover or spoken lines. Only when it does: the voiceover spoken during this scene, plain spoken English, no stage directions, no quotes, at most ${NARRATION_WORDS_PER_SECOND} words per second of the scene, rounded down (5 s: 11 words, 6 s: 13, 7 s: 15, 8 s: 17, 10 s: 22). Count the words of each narration before you answer and cut words until it fits; a hyphenated term counts as one word. Narration flows as one script across scenes.
- referenceIndexes: a required key on every scene: the numbers (Image N as labelled) of the uploaded images this scene's opening frame is drawn from, normally exactly one. A contact sheet, overview or grid of many frames is context only and is assigned to no scene. When the uploads form a frame sequence, follow it in upload order, one scene per frame unless the length budget forces merging two neighbouring frames into one scene. storyboardPrompt then describes exactly what that uploaded frame shows, rendered photoreal. With no uploads, referenceIndexes is [].
- transitionIn: a required key on EVERY scene object. Exactly null on scene 1 (it opens the video). On every later scene an object, never omitted: {"type":"continue","seconds":0} when the clip picks up exactly where the previous clip ends (same place, camera keeps rolling, action continues; the clip is generated FROM the previous clip's final frame, so the scene must be physically reachable in one shot from that end state). {"type":"dissolve","seconds":0.5..1.0} only for a deliberate jump in time or place. Prefer continue; a dissolve must be justified by the story.`;

export function buildDirectorPlanSystemPrompt(lengthSeconds: number, referenceCount: number): string {
  return `You are the Director writing the scene plan for ONE short video that must cut together as one seamless piece.
Each scene becomes a single continuous video clip generated from one storyboard still (image-to-video), so a scene is ONE shot: one location, one camera move, no cuts inside it.
Output a single JSON object only, no markdown fences.
Schema:
${PLAN_SCHEMA}
Rules:
- The durations MUST sum to exactly ${lengthSeconds}.
- order starts at 1 and increases by 1. Ids are snake_case and unique.
- voice: "none" unless the brief explicitly asks for narration, voiceover or spoken lines; the video then has no narration track and every scene's narration is "". Only when the brief asks: pick the HeyGen voice that fits its tone (nadine, tabitha, noelle, meredith, sabrina are female; bram, gareth, lucian, weston, vincent are male) and write narration for every scene.
- continuity: heroSubject names the one subject every scene follows; screenDirection is the single direction all travel and progress moves across the frame for the whole video; cameraSide says which side of the action the camera stays on; palette and lightArc describe colour and how light changes from first to last scene.
- Numbered reference images available: ${referenceCount}. When ${referenceCount} is 0, every scene referenceIndexes must be []. When ${referenceCount} is greater than 0, use only integers 1..${referenceCount}. Never reference beat numbers from the brief unless that many images were actually uploaded.
${SCENE_RULES}
- Respect the user's answers and uploaded images: carry their subject identity, framing and setting cues through every scene.`;
}

function readInt(v: unknown): number {
  return typeof v === "number" && Number.isInteger(v) ? v : Number.parseInt(String(v ?? ""), 10);
}

function readNumber(v: unknown): number {
  return typeof v === "number" ? v : Number.parseFloat(String(v ?? ""));
}

function parseTransition(raw: unknown, idx: number): VideoTransition {
  const o = (raw ?? {}) as Record<string, unknown>;
  const type = String(o.type ?? "").trim();
  const seconds = readNumber(o.seconds);
  if (type === "continue") {
    if (seconds !== 0) throw new Error(`Scene ${idx + 1} continue join must have seconds 0.`);
    return { type, seconds: 0 };
  }
  if (type === "dissolve") {
    if (!(seconds >= 0.5 && seconds <= 1.0)) {
      throw new Error(`Scene ${idx + 1} dissolve must be 0.5..1.0 s (got ${String(o.seconds)}).`);
    }
    return { type, seconds: Math.round(seconds * 10) / 10 };
  }
  throw new Error(
    raw === undefined || raw === null
      ? `Scene ${idx + 1} is missing transitionIn.`
      : `Scene ${idx + 1} transitionIn.type must be continue or dissolve (got ${String(o.type)}).`,
  );
}

function parseReferenceIndexes(raw: unknown, idx: number, referenceCount: number): number[] {
  if (!Array.isArray(raw)) throw new Error(`Scene ${idx + 1} is missing referenceIndexes (use [] when no upload applies).`);
  const indexes = raw.map(readInt);
  const bad = indexes.find((n) => !Number.isInteger(n) || n < 1 || n > referenceCount);
  if (bad !== undefined) {
    if (referenceCount === 0 && indexes.length > 0) {
      throw new Error(
        `Scene ${idx + 1} references Image ${bad}, but you have 0 reference images uploaded. Subject photos are not numbered images. Upload storyboard beats under Reference images, or regenerate the plan after uploads match the brief.`,
      );
    }
    throw new Error(
      `Scene ${idx + 1} references Image ${bad}, but only ${referenceCount} reference image${referenceCount === 1 ? " is" : "s are"} uploaded (use 1..${referenceCount} or []).`,
    );
  }
  if (new Set(indexes).size !== indexes.length) throw new Error(`Scene ${idx + 1} referenceIndexes repeats an image.`);
  return indexes;
}

/** Validates one scene object from the Director; `idx` is the zero-based position it must occupy. */
export function parseScene(raw: unknown, idx: number, referenceCount: number): VideoScenePlan {
  const o = (raw ?? {}) as Record<string, unknown>;
  const scene: VideoScenePlan = {
    id: String(o.id ?? "").trim(),
    order: readInt(o.order),
    title: String(o.title ?? "").trim(),
    durationSeconds: readInt(o.durationSeconds),
    sceneInstructions: String(o.sceneInstructions ?? "").trim(),
    storyboardPrompt: String(o.storyboardPrompt ?? "").trim(),
    motionPrompt: String(o.motionPrompt ?? "").trim(),
    continuityNotes: String(o.continuityNotes ?? "").trim(),
    narration: String(o.narration ?? "").trim(),
    referenceIndexes: parseReferenceIndexes(o.referenceIndexes, idx, referenceCount),
  };
  const missing = (["id", "title", "sceneInstructions", "storyboardPrompt", "motionPrompt"] as const).filter(
    (k) => !scene[k],
  );
  if (missing.length) {
    throw new Error(`Scene ${idx + 1} is missing: ${missing.join(", ")}.`);
  }
  if (
    !Number.isInteger(scene.durationSeconds) ||
    scene.durationSeconds < VIDEO_SCENE_MIN_SECONDS ||
    scene.durationSeconds > VIDEO_SCENE_MAX_SECONDS
  ) {
    throw new Error(
      `Scene ${idx + 1} duration must be ${VIDEO_SCENE_MIN_SECONDS}..${VIDEO_SCENE_MAX_SECONDS} s (got ${String(o.durationSeconds)}).`,
    );
  }
  if (scene.order !== idx + 1) {
    throw new Error(`Scene ${idx + 1} has order ${String(o.order)}; expected ${idx + 1}.`);
  }
  const words = scene.narration.split(/\s+/).filter(Boolean).length;
  const budget = Math.floor(scene.durationSeconds * NARRATION_WORDS_PER_SECOND);
  if (words > budget) {
    throw new Error(`Scene ${idx + 1} narration is ${words} words; at most ${budget} fit in ${scene.durationSeconds} s.`);
  }
  if (idx === 0) {
    if (o.transitionIn !== undefined && o.transitionIn !== null) {
      throw new Error("Scene 1 transitionIn must be null; it opens the video.");
    }
  } else {
    scene.transitionIn = parseTransition(o.transitionIn, idx);
  }
  return scene;
}

function parseContinuity(raw: unknown): VideoPlanContinuity {
  const o = (raw ?? {}) as Record<string, unknown>;
  const direction = String(o.screenDirection ?? "").trim();
  if (direction !== "left_to_right" && direction !== "right_to_left") {
    throw new Error("Director plan continuity.screenDirection must be left_to_right or right_to_left.");
  }
  const continuity: VideoPlanContinuity = {
    heroSubject: String(o.heroSubject ?? "").trim(),
    screenDirection: direction,
    cameraSide: String(o.cameraSide ?? "").trim(),
    palette: String(o.palette ?? "").trim(),
    lightArc: String(o.lightArc ?? "").trim(),
  };
  const missing = (["heroSubject", "cameraSide", "palette", "lightArc"] as const).filter((k) => !continuity[k]);
  if (missing.length) {
    throw new Error(`Director plan continuity is missing: ${missing.join(", ")}.`);
  }
  return continuity;
}

export function parseVideoPlan(raw: string, lengthSeconds: number, referenceCount: number): VideoPlan {
  const j = parseJsonObjectFromModelText(raw);
  const title = String(j.title ?? "").trim();
  const logline = String(j.logline ?? "").trim();
  const scenesRaw = j.scenes;
  if (!title || !Array.isArray(scenesRaw) || scenesRaw.length === 0) {
    throw new Error("Director plan is missing title or scenes.");
  }
  const voice = String(j.voice ?? "").trim();
  if (voice !== "none" && !(HEYGEN_VOICES as readonly string[]).includes(voice)) {
    throw new Error(`Director plan voice must be none or one of ${HEYGEN_VOICES.join(", ")} (got ${voice || "nothing"}).`);
  }
  const continuity = parseContinuity(j.continuity);
  const scenes = scenesRaw.map((s, idx) => parseScene(s, idx, referenceCount));
  const ids = new Set(scenes.map((s) => s.id));
  if (ids.size !== scenes.length) throw new Error("Scene ids must be unique.");
  const total = scenes.reduce((sum, s) => sum + s.durationSeconds, 0);
  if (total !== lengthSeconds) {
    throw new Error(`Scene durations sum to ${total} s; the plan must total ${lengthSeconds} s.`);
  }
  const narrated = scenes.filter((s) => s.narration).map((s) => s.order);
  if (voice === "none" && narrated.length) {
    throw new Error(`Director wrote narration for scene ${narrated.join(", ")} but the brief did not ask for narration; narration must be "".`);
  }
  if (voice !== "none" && narrated.length !== scenes.length) {
    throw new Error(`Director picked voice ${voice} but left narration empty on some scenes; every scene needs narration or voice must be none.`);
  }
  return { title, logline, continuity, voice: voice as HeygenVoice | "none", scenes };
}

export async function runVideoDirectorPlan(args: {
  apiKey: string;
  siteId?: string | null;
  brief: VideoBrief;
  questions: { id: string; text: string }[];
  answers: Record<string, string>;
  signal?: AbortSignal;
  /** Every reasoning and JSON delta the Director writes, in order, so the UI can show the plan being written. */
  onDelta: (delta: OpenRouterAppStreamDelta) => void;
}): Promise<VideoPlan> {
  const user = `${briefBlock(args.brief)}

User answers to your questions:
${answersBlock(args.answers, args.questions)}

Write the scene plan now. Allocate durations first: every scene is ${VIDEO_SCENE_MIN_SECONDS} to ${VIDEO_SCENE_MAX_SECONDS} s, so ${args.brief.lengthSeconds} seconds fits ${sceneCountOptions(args.brief.lengthSeconds)}. Pick a scene count, write its durations as a list, add them up, and change them until the sum is exactly ${args.brief.lengthSeconds}; only then write the scenes.`;
  const elapsed = videoTimer();
  videoLog("plan", "request", {
    lengthSeconds: args.brief.lengthSeconds,
    subjectHarness: Boolean(args.brief.subject),
    references: args.brief.references.map((r) => r.fileName),
    answers: args.answers,
  });
  const res = await streamAgentCategoryOpenRouterChat({
    category: "research",
    siteId: args.siteId,
    apiKey: args.apiKey,
    messages: directorMessages(
      buildDirectorPlanSystemPrompt(args.brief.lengthSeconds, args.brief.references.length),
      user,
      args.brief,
    ),
    // Reasoning tokens count against max_tokens; low effort plus a wide budget keeps the JSON from being cut.
    maxTokens: 64000,
    reasoning: { effort: "low" },
    temperature: 0.4,
    responseFormat: { type: "json_object" },
    signal: args.signal,
    onDelta: (delta) => {
      if (delta.reasoning) videoLog("plan", "thinking", delta.reasoning);
      if (delta.content) videoLog("plan", "writing", delta.content);
      args.onDelta(delta);
    },
  });
  videoLog("plan", "stream complete", {
    seconds: elapsed(),
    finishReason: res.finishReason,
    reasoningChars: res.reasoning.length,
    contentChars: res.content.length,
  });
  try {
    const plan = parseVideoPlan(res.content, args.brief.lengthSeconds, args.brief.references.length);
    videoLog("plan", "accepted", {
      title: plan.title,
      scenes: plan.scenes.map((s) => `${s.order}: ${s.title} (${s.durationSeconds} s, refs ${s.referenceIndexes.join(",") || "none"})`),
    });
    return plan;
  } catch (e) {
    videoLogError("plan", "rejected", e);
    throw e;
  }
}
