import type { CSVRow } from "@/lib/bulk-auto-generate";
import type { BulkSitemapScopeTag } from "@/lib/bulk/bulk-sitemap-mode";
import { postOpenRouterAppChat } from "@/lib/openrouter-app-api";
import type { PromptBulkKwConnectedSiteContext } from "@/lib/bulk/prompt-bulk-kw-research-agent";
import { GLOBAL_BLOCKED_TOPIC_PROMPT_BLOCK } from "@/lib/content-topic-blocklist";

const POSTS_SCOPE_IDEAS_HINT = `When contentScope includes "posts":
- keyword must be geography-free (no city, province, state, region, or country names). Put location in title if needed.
- Each idea in the batch must target a different search intent (no overlapping angles).`;

const INVENTORY_EXCLUSION = `When SITE_INVENTORY_JSON is present:
- Read pages, posts, and sap entries (title, slug, link).
- Do not propose ideas that cannibalize an existing post or page (same topic/intent).
- Prefer net-new angles grounded in GSC_TOP_500 and the user topic that are not already covered.`;

const SYSTEM = `You draft blog post ideas for human approval. No SERP fetch. Output keyword and title per idea (meta descriptions are written separately).

Rules:
- Return exactly the requested count.
- keyword: short SEO focus phrase (2–5 words), intent-only. Not the full headline. Never include guide, listicle, buying guide, or how-to wrapper words in keyword (those belong in title only).
- title: complete headline, Title Case, readable and specific.
- When a topic is given, every idea must fit that topic.
- When a slot already has a keyword, keep that keyword and write a title for it.
- When SITE_INVENTORY_JSON and GSC_TOP_500 are present, use them for grounding and exclusion (see below).
- Read CONNECTED_SITE for business name and market; never use the trading/company name as the keyword focus.
- Do not explain your work. Do not use chain-of-thought. The assistant message must be the JSON object only.

${INVENTORY_EXCLUSION}

${POSTS_SCOPE_IDEAS_HINT}

${GLOBAL_BLOCKED_TOPIC_PROMPT_BLOCK}

JSON contract (mandatory, last): output one object only. Double-quoted keys. No markdown fences. No extra keys. Exact shape:
{"ideas":[{"keyword":"...","title":"..."}]}`;

export function buildPromptBulkIdeasResponseFormat(count: number): {
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
      name: "prompt_bulk_blog_ideas",
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

type IdeasPayload = {
  ideas?: Array<{
    keyword?: unknown;
    title?: unknown;
  }>;
};

function cleanField(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function payloadFromResponse(
  parsed: Record<string, unknown> | undefined,
  content: string,
  finishReason?: string,
): IdeasPayload {
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    return parsed as IdeasPayload;
  }
  const trimmed = content.trim();
  if (!trimmed) {
    if (import.meta.env.DEV) {
      console.error("[prompt-bulk-ideas]", { finishReason, content });
    }
    throw new Error("Ideas agent returned empty content.");
  }
  try {
    return JSON.parse(trimmed) as IdeasPayload;
  } catch {
    if (import.meta.env.DEV) {
      console.error("[prompt-bulk-ideas]", { finishReason, content });
    }
    throw new Error("Ideas agent returned invalid JSON.");
  }
}

export async function generateSimplePromptIdeas(args: {
  apiKey: string;
  model: string;
  count: number;
  topic?: string;
  modifier?: string;
  slotKeywords?: string[];
  slotModifiers?: string[];
  temperature?: number;
  maxTokens?: number;
  connectedSite?: PromptBulkKwConnectedSiteContext | null;
  siteInventoryJson?: string;
  gscKeywords?: string[];
  contentScope?: BulkSitemapScopeTag[];
}): Promise<CSVRow[]> {
  const count = Math.max(1, Math.min(50, Math.floor(args.count) || 1));
  const apiKey = args.apiKey.trim();
  if (!apiKey) {
    throw new Error("OpenRouter API key is required.");
  }

  const slots = Array.from({ length: count }, (_, i) => ({
    keyword: args.slotKeywords?.[i]?.trim() || "",
    modifier: args.slotModifiers?.[i]?.trim() || "",
  }));

  const topicLine = [args.topic?.trim(), args.modifier?.trim()].filter(Boolean).join(". ");

  const userPayload: Record<string, unknown> = {
    count,
    topic: topicLine,
    slots,
  };

  if (args.connectedSite) {
    userPayload.CONNECTED_SITE = args.connectedSite;
  }
  const inventoryJson = args.siteInventoryJson?.trim();
  if (inventoryJson) {
    userPayload.SITE_INVENTORY_JSON = JSON.parse(inventoryJson) as unknown;
  }
  if (args.gscKeywords?.length) {
    userPayload.GSC_TOP_500 = args.gscKeywords;
  }
  if (args.contentScope?.length) {
    userPayload.contentScope = args.contentScope;
  }

  const user = JSON.stringify(userPayload);

  const tokenBudget = Math.max(2048, count * 512);
  const maxTokens =
    typeof args.maxTokens === "number" && args.maxTokens > 0
      ? Math.max(tokenBudget, args.maxTokens)
      : tokenBudget;

  const { content, parsed, finishReason } = await postOpenRouterAppChat({
    apiKey,
    model: args.model,
    system: SYSTEM,
    user,
    temperature: args.temperature ?? 0.35,
    maxTokens,
    responseFormat: buildPromptBulkIdeasResponseFormat(count),
  });

  const payload = payloadFromResponse(parsed, content, finishReason);

  const rawIdeas = Array.isArray(payload.ideas) ? payload.ideas : [];
  if (rawIdeas.length !== count) {
    if (import.meta.env.DEV) {
      console.error("[prompt-bulk-ideas]", {
        finishReason,
        expected: count,
        got: rawIdeas.length,
        content,
      });
    }
    throw new Error(`Ideas agent returned ${rawIdeas.length}/${count} rows.`);
  }

  const rows: CSVRow[] = [];
  for (let i = 0; i < count; i++) {
    const item = rawIdeas[i] ?? {};
    const slotKw = slots[i]?.keyword ?? "";
    const keyword = slotKw || cleanField(item.keyword);
    const title = cleanField(item.title);
    if (!keyword || !title) {
      throw new Error(`Ideas row ${i + 1} is missing keyword or title.`);
    }
    const row: CSVRow = { keyword, title };
    const mod = slots[i]?.modifier;
    if (mod) row.modifier = mod;
    rows.push(row);
  }
  return rows;
}
