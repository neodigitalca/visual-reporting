import type { OpenRouterAppResponseFormat } from "@/lib/openrouter-app-api";
import { GSC_OUTLINE_OUTPUT_LIMITS } from "@/lib/gsc-reporting/gsc-reporting-outline-schema";

const L = GSC_OUTLINE_OUTPUT_LIMITS;

export const ORGANIC_REPORTING_HIGHLIGHTS_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: [
    "executiveSummary",
    "keyTakeaways",
    "performanceNarrative",
    "keywordNarrative",
    "topOpportunities",
  ],
  properties: {
    executiveSummary: { type: "string", maxLength: 320 },
    performanceNarrative: {
      type: "array",
      minItems: 2,
      maxItems: 3,
      items: { type: "string", maxLength: 520 },
    },
    keywordNarrative: {
      type: "array",
      minItems: 1,
      maxItems: 2,
      items: { type: "string", maxLength: 480 },
    },
    keyTakeaways: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: { type: "string", maxLength: 280 },
    },
    topOpportunities: {
      type: "array",
      minItems: 3,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["rank", "label", "why", "comparisonRows"],
        properties: {
          rank: { type: "integer" },
          label: { type: "string", maxLength: L.labelMaxChars },
          why: { type: "string", maxLength: L.whyMaxChars },
          comparisonRows: {
            type: "array",
            minItems: 1,
            maxItems: 4,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["metric", "comparePeriodValue", "primaryPeriodValue"],
              properties: {
                metric: { type: "string", maxLength: 80 },
                comparePeriodValue: { type: "string", maxLength: 72 },
                primaryPeriodValue: { type: "string", maxLength: 72 },
              },
            },
          },
          evidence: {
            type: "array",
            maxItems: L.evidenceMaxItems,
            items: { type: "string", maxLength: L.evidenceMaxChars },
          },
        },
      },
    },
  },
};

export const ORGANIC_REPORTING_HIGHLIGHTS_RESPONSE_FORMAT: OpenRouterAppResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "organic_reporting_highlights",
    strict: true,
    schema: ORGANIC_REPORTING_HIGHLIGHTS_JSON_SCHEMA,
  },
};
