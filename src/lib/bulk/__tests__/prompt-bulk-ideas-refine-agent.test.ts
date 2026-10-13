import { describe, expect, it, vi, beforeEach } from "vitest";
import { refinePromptBulkIdeasWithResearch } from "@/lib/bulk/prompt-bulk-ideas-refine-agent";

vi.mock("@/lib/openrouter-app-api", () => ({
  postOpenRouterAppChat: vi.fn(),
}));

describe("refinePromptBulkIdeasWithResearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps parsed ideas to rows on one successful call", async () => {
    const { postOpenRouterAppChat } = await import("@/lib/openrouter-app-api");
    vi.mocked(postOpenRouterAppChat).mockResolvedValue({
      content: "",
      parsed: {
        ideas: [
          { keyword: "glamping tent rentals", title: "Glamping Tent Rentals In Alberta" },
          { keyword: "party tent sizes", title: "Party Tent Sizes For Events" },
        ],
      },
      raw: {},
      finishReason: "stop",
    });

    const rows = await refinePromptBulkIdeasWithResearch({
      apiKey: "test-key",
      rows: [
        { keyword: "glamping tent rentals alberta", title: "Old Title 1" },
        { keyword: "party tents edmonton", title: "Old Title 2" },
      ],
      contentScope: ["posts"],
    });

    expect(rows[0]?.keyword).toBe("glamping tent rentals");
    expect(rows[1]?.title).toBe("Party Tent Sizes For Events");
  });

  it("keeps input rows when parsed count mismatches", async () => {
    const { postOpenRouterAppChat } = await import("@/lib/openrouter-app-api");
    vi.mocked(postOpenRouterAppChat).mockResolvedValue({
      content: "",
      parsed: { ideas: [{ keyword: "a", title: "A" }] },
      raw: {},
      finishReason: "stop",
    });

    const input = [
      { keyword: "one", title: "One" },
      { keyword: "two", title: "Two" },
    ];
    const rows = await refinePromptBulkIdeasWithResearch({
      apiKey: "test-key",
      rows: input,
      contentScope: ["posts"],
    });

    expect(rows).toEqual(input);
  });
});
