import { describe, expect, it } from "vitest";
import {
  jsonObjectFromOpenRouterChatResult,
  tryParseAssistantJsonObject,
} from "@/lib/competitor-research/competitor-report-json-parse";

describe("tryParseAssistantJsonObject", () => {
  it("returns null for prose without JSON", () => {
    expect(tryParseAssistantJsonObject("We need an analyst to review this.")).toBeNull();
  });

  it("parses fenced JSON", () => {
    const got = tryParseAssistantJsonObject('```json\n{"services":["blinds"]}\n```');
    expect(got).toEqual({ services: ["blinds"] });
  });
});

describe("jsonObjectFromOpenRouterChatResult", () => {
  it("prefers API parsed field over content string", () => {
    const got = jsonObjectFromOpenRouterChatResult({
      content: "not json",
      parsed: { services: ["a"] },
    });
    expect(got).toEqual({ services: ["a"] });
  });
});
