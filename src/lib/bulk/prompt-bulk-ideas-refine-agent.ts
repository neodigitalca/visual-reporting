import type { CSVRow } from "@/lib/bulk-auto-generate";
import type { BulkSitemapScopeTag } from "@/lib/bulk/bulk-sitemap-mode";
import type { PromptBulkKwConnectedSiteContext } from "@/lib/bulk/prompt-bulk-kw-research-agent";
import { resolveModelForAgentCategory } from "@/lib/openrouter-agent-category-api";
import { postOpenRouterAppChat } from "@/lib/openrouter-app-api";

const POSTS_GEO_RULES = `When contentScope includes "posts":
- keyword must NOT contain city, province, state, region, country, or "near me" tokens. Move geography into title only when it helps readability.
- Each row must target a clearly different search intent. No near-duplicates, synonym swaps, or overlapping angles (e.g. glamping rentals vs camping tent rentals for the same market counts as too similar — pick distinct intents).`;

const SYSTEM = `You rewrite a batch of blog idea rows for approval. One OpenRouter response only.

${POSTS_GEO_RULES}

Rules:
- Return exactly the same number of ideas as rows[] in the user payload, same order.
- keyword: short SEO focus phrase (2–5 words), intent-only, geography-free when posts scope applies.
- title: complete headline, Title Case; geo in title is allowed when posts scope applies.
- Preserve locked slots: when a row has lockedKeyword true, keep that keyword string exactly; only improve the title if needed.
- Do not explain your work. Output the JSON object only.

JSON contract: {"ideas":[{"keyword":"...","title":"..."}]}`;

export function buildPromptBulkIdeasRefineResponseFormat(count: number): {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: Record<string, unknown>;
  };
} {
  const n = Math.max(1, Math.min(50, Math.floor(count) || 1));
  return {
    type: "json_schema",
    json_schema: {
      name: "prompt_bulk_ideas_refine",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["ideas"],
        properties: {
          ideas: {
            type: "array",
            minItems: n,
            maxItems: n,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["keyword", "title"],
              properties: {
                keyword: { type: "string", minLength: 1 },
                title: { type: "string", minLength: 1 },
              },
            },
          },
        },
      },
    },
  };
}

type RefinePayload = {
  ideas?: Array<{ keyword?: unknown; title?: unknown }>;
};

function cleanField(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function ideasFromParsedOnly(parsed: unknown, expectedCount: number): RefinePayload["ideas"] {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Ideas refine agent returned no parsed JSON object.");
  }
  const ideas = (parsed as RefinePayload).ideas;
  if (!Array.isArray(ideas) || ideas.length !== expectedCount) {
    throw new Error(
      `Ideas refine agent returned ${Array.isArray(ideas) ? ideas.length : 0}/${expectedCount} rows.`,
    );
  }
  return ideas;
}

export type RefinePromptBulkIdeasArgs = {
  apiKey: string;
  siteId?: string;
  rows: CSVRow[];
  contentScope: BulkSitemapScopeTag[];
  connectedSite?: PromptBulkKwConnectedSiteContext | null;
  topic?: string;
  lockedSlotKeywords?: boolean[];
};

export async function refinePromptBulkIdeasWithResearch(
  args: RefinePromptBulkIdeasArgs,
): Promise<CSVRow[]> {
  const count = args.rows.length;
  if (count === 0) return [];

  const apiKey = args.apiKey.trim();
  if (!apiKey) {
    return args.rows.map((r) => ({ ...r }));
  }

  const model = resolveModelForAgentCategory("research", args.siteId);
  const locked = args.lockedSlotKeywords ?? [];

  const userPayload = {
    topic: (args.topic ?? "").trim(),
    contentScope: args.contentScope,
    connectedSite: args.connectedSite ?? undefined,
    rows: args.rows.map((row, i) => ({
      keyword: (row.keyword ?? "").trim(),
      title: (row.title ?? "").trim(),
      lockedKeyword: locked[i] === true,
    })),
  };

  try {
    const { parsed } = await postOpenRouterAppChat({
      apiKey,
      model,
      system: SYSTEM,
      user: JSON.stringify(userPayload),
      temperature: 0.2,
      maxTokens: Math.min(16384, Math.max(2048, count * 200)),
      responseFormat: buildPromptBulkIdeasRefineResponseFormat(count),
    });

    const rawIdeas = ideasFromParsedOnly(parsed, count);
    const out: CSVRow[] = [];
    for (let i = 0; i < count; i++) {
      const item = rawIdeas[i] ?? {};
      const keyword = locked[i] ? (args.rows[i]?.keyword ?? "").trim() : cleanField(item.keyword);
      const title = cleanField(item.title);
      if (!keyword || !title) {
        out.push({ ...args.rows[i]! });
        continue;
      }
      out.push({ ...args.rows[i], keyword, title });
    }
    return out;
  } catch {
    return args.rows.map((r) => ({ ...r }));
  }
}
