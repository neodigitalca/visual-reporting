import { openRouterAppApiHeaders } from "@/lib/openrouter-app-api";
import { backendApiUrl } from "@/lib/wordpress-api/connection";
import { videoLog, videoLogError, videoTimer } from "./video-log";

/** Thin client for the server-side video cut-up (ffmpeg runs in PHP). */

export type VideoSample = { time: number; dataUrl: string };

export type VideoSamplesResult = {
  id: string;
  durationSeconds: number;
  width: number;
  height: number;
  samples: VideoSample[];
};

export type VideoBeatsResult = {
  beats: VideoSample[];
  sheetDataUrl: string;
};

async function brainstormApi<T>(path: string, body: unknown, apiKey: string): Promise<T> {
  const elapsed = videoTimer();
  const json = JSON.stringify(body);
  videoLog("brainstorm", `POST video/brainstorm/${path}`, { bodyBytes: json.length });
  const response = await fetch(backendApiUrl(`/video/brainstorm/${path}`), {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: openRouterAppApiHeaders(apiKey),
    body: json,
  });
  const data = (await response.json()) as { ok?: boolean; error?: string } & T;
  if (!response.ok || !data.ok) {
    videoLogError("brainstorm", `POST video/brainstorm/${path} failed (${response.status}, ${elapsed()} s)`, data.error);
    throw new Error(data.error?.trim() || `Video API error (${response.status})`);
  }
  videoLog("brainstorm", `POST video/brainstorm/${path} ok`, { seconds: elapsed() });
  return data;
}

/** Tiles the subject photos into one harness sheet on the server; the sheet is attached first to every agent and frame. */
export async function buildSubjectHarness(args: { apiKey: string; images: { fileName: string; dataUrl: string }[] }): Promise<string> {
  const result = await brainstormApi<{ id: string; harnessDataUrl: string }>("subject", { images: args.images }, args.apiKey);
  videoLog("brainstorm", "subject harness received", { id: result.id, photos: args.images.length, bytes: result.harnessDataUrl.length });
  return result.harnessDataUrl;
}

/** Uploads the video and returns one small frame every 2 s. */
export async function sampleVideoFrames(args: { apiKey: string; fileName: string; dataUrl: string }): Promise<VideoSamplesResult> {
  const result = await brainstormApi<VideoSamplesResult>("frames", { fileName: args.fileName, dataUrl: args.dataUrl }, args.apiKey);
  videoLog("brainstorm", "samples received", {
    id: result.id,
    durationSeconds: result.durationSeconds,
    size: `${result.width}x${result.height}`,
    samples: result.samples.map((s) => s.time),
  });
  return result;
}

/** Cuts full-size stills at `times` (in order) and one contact sheet of them. */
export async function cutVideoBeats(args: { apiKey: string; id: string; times: number[] }): Promise<VideoBeatsResult> {
  const result = await brainstormApi<VideoBeatsResult>(`${encodeURIComponent(args.id)}/beats`, { times: args.times }, args.apiKey);
  videoLog("brainstorm", "beats received", { beats: result.beats.map((b) => b.time), sheetBytes: result.sheetDataUrl.length });
  return result;
}
