import { describe, expect, it, vi } from "vitest";
import { openRouterAssistantTextFromMessage } from "@/lib/openrouter-app-api";
import { streamOpenRouterChatCompletionCore } from "@/lib/openrouter-stream-chat-core";

describe("openRouterAssistantTextFromMessage", () => {
  it("uses string content when present", () => {
    expect(openRouterAssistantTextFromMessage({ content: " hello " })).toBe("hello");
  });

  it("falls back to reasoning when content is empty", () => {
    expect(
      openRouterAssistantTextFromMessage({
        content: "",
        reasoning: '{"keywords":["solar panels"]}',
      }),
    ).toBe('{"keywords":["solar panels"]}');
  });

  it("joins reasoning_details text parts", () => {
    expect(
      openRouterAssistantTextFromMessage({
        content: "",
        reasoning_details: [{ text: "line one" }, { text: "line two" }],
      }),
    ).toBe("line one\nline two");
  });
});

describe("streamOpenRouterChatCompletionCore", () => {
  it("ignores delta.reasoning chunks and only emits delta.content", async () => {
    const ssePayload = [
      `data: ${JSON.stringify({ choices: [{ delta: { content: "", reasoning: "**Exploring Title Case Nuances** I'm analyzing..." } }] })}\n\n`,
      `data: ${JSON.stringify({ choices: [{ delta: { content: "Moving Away From Grey Blinds " } }] })}\n\n`,
      `data: ${JSON.stringify({ choices: [{ delta: { content: "Toward Warmer Color Palettes" }, finish_reason: "stop" }] })}\n\n`,
      "data: [DONE]\n\n",
    ].join("");

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(ssePayload));
        controller.close();
      },
    });

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(stream, { status: 200, headers: { "Content-Type": "text/event-stream" } }),
    );

    const chunks: string[] = [];
    const res = await streamOpenRouterChatCompletionCore({
      apiKey: "sk-or-test",
      model: "google/gemma-4-31b-it",
      messages: [{ role: "user", content: "Write a title" }],
      temperature: 0.3,
      maxTokens: 500,
      topP: 0.9,
      httpReferer: "http://localhost:8080",
      onContentChunk: (chunk) => chunks.push(chunk),
    });

    expect(chunks.join("")).toBe("Moving Away From Grey Blinds Toward Warmer Color Palettes");
    expect(res.content).toBe("Moving Away From Grey Blinds Toward Warmer Color Palettes");
    expect(res.finishReason).toBe("stop");
    fetchSpy.mockRestore();
  });
});

