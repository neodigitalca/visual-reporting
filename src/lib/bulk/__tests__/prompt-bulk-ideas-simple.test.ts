import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  buildPromptBulkIdeasResponseFormat,
  generateSimplePromptIdeas,
} from "@/lib/bulk/prompt-bulk-ideas-simple";

vi.mock("@/lib/openrouter-app-api", () => ({
  postOpenRouterAppChat: vi.fn(),
}));

describe("buildPromptBulkIdeasResponseFormat", () => {
  it("uses strict schema with exact item count", () => {
    const fmt = buildPromptBulkIdeasResponseFormat(2);
    expect(fmt.json_schema.strict).toBe(true);
    const ideas = fmt.json_schema.schema.properties as Record<string, unknown>;
    const ideasProp = ideas.ideas as { minItems?: number; maxItems?: number };
    expect(ideasProp.minItems).toBe(2);
    expect(ideasProp.maxItems).toBe(2);
  });
});

describe("generateSimplePromptIdeas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps parsed ideas to CSV rows on one successful call", async () => {
    const { postOpenRouterAppChat } = await import("@/lib/openrouter-app-api");
    vi.mocked(postOpenRouterAppChat).mockResolvedValue({
      content: "",
      parsed: {
        ideas: [
          { keyword: "solar panel cost", title: "Solar Panel Cost In Alberta" },
          { keyword: "home battery backup", title: "Home Battery Backup Options" },
        ],
      },
      raw: {},
      finishReason: "stop",
    });

    const rows = await generateSimplePromptIdeas({
      apiKey: "sk-test",
      model: "test/model",
      count: 2,
      topic: "Alberta solar",
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]!.keyword).toBe("solar panel cost");
    expect(rows[0]!.title).toBe("Solar Panel Cost In Alberta");
    expect(postOpenRouterAppChat).toHaveBeenCalledTimes(1);
  });
});
