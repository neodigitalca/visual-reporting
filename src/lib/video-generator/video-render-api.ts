import { openRouterAppApiHeaders } from "@/lib/openrouter-app-api";
import { backendApiUrl } from "@/lib/wordpress-api/connection";
import type { VideoRenderSnapshot, VideoTransition } from "./video-generator-types";
import type { HeygenVoice, VideoAspect, VideoResolution } from "./video-model-defaults";
import { videoLog, videoLogError, videoTimer } from "./video-log";

/** Thin client for the server-side render (narration TTS, clip jobs, chaining, assembly all run in PHP). */

async function videoApi<T>(path: string, init: { method: "GET" | "POST"; body?: unknown; apiKey?: string }): Promise<T> {
  const elapsed = videoTimer();
  const body = init.body === undefined ? undefined : JSON.stringify(init.body);
  videoLog("render", `${init.method} video/${path}`, { bodyBytes: body?.length ?? 0 });
  const response = await fetch(backendApiUrl(`/video/${path}`), {
    method: init.method,
    credentials: "include",
    cache: "no-store",
    headers: openRouterAppApiHeaders(init.apiKey),
    body,
  });
  const data = (await response.json()) as { ok?: boolean; error?: string } & T;
  if (!response.ok || !data.ok) {
    videoLogError("render", `${init.method} video/${path} failed (${response.status}, ${elapsed()} s)`, data.error);
    throw new Error(data.error?.trim() || `Video API error (${response.status})`);
  }
  videoLog("render", `${init.method} video/${path} ok`, { seconds: elapsed() });
  return data;
}

export type CreateVideoRenderScene = {
  id: string;
  order: number;
  durationSeconds: number;
  videoPrompt: string;
  narration: string;
  transitionIn?: VideoTransition;
};

export async function createVideoRender(args: {
  apiKey: string;
  model: string;
  resolution: VideoResolution;
  aspectRatio: VideoAspect;
  voiceModel: string;
  /** "none" renders without a narration track. */
  voice: HeygenVoice | "none";
  scenes: CreateVideoRenderScene[];
}): Promise<string> {
  const { apiKey, ...body } = args;
  videoLog("render", "submit", {
    model: body.model,
    resolution: body.resolution,
    aspectRatio: body.aspectRatio,
    voice: body.voice,
    scenes: body.scenes.map((s) => ({ order: s.order, durationSeconds: s.durationSeconds, join: s.transitionIn?.type ?? "open", videoPrompt: s.videoPrompt })),
  });
  const data = await videoApi<{ id: string }>("render", { method: "POST", body, apiKey });
  videoLog("render", "job created", { renderId: data.id });
  return data.id;
}

export async function uploadVideoRenderFrame(args: {
  apiKey: string;
  renderId: string;
  sceneId: string;
  dataUrl: string;
}): Promise<void> {
  await videoApi(`render/${encodeURIComponent(args.renderId)}/frame`, {
    method: "POST",
    body: { sceneId: args.sceneId, dataUrl: args.dataUrl },
    apiKey: args.apiKey,
  });
}

export async function startVideoRender(args: { apiKey: string; renderId: string }): Promise<VideoRenderSnapshot> {
  const data = await videoApi<{ render: VideoRenderSnapshot }>(`render/${encodeURIComponent(args.renderId)}/start`, {
    method: "POST",
    body: {},
    apiKey: args.apiKey,
  });
  return data.render;
}

export async function fetchVideoRender(args: { apiKey: string; renderId: string }): Promise<VideoRenderSnapshot> {
  const data = await videoApi<{ render: VideoRenderSnapshot }>(`render/${encodeURIComponent(args.renderId)}`, {
    method: "GET",
    apiKey: args.apiKey,
  });
  videoLog("render", `poll ${args.renderId}`, data.render);
  return data.render;
}
