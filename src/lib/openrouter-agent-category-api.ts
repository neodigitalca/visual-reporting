import { callOpenRouterChatCompletion } from "@/lib/competitor-research/competitor-report-openrouter";
import {
  getAdsModel,
  getBlogModel,
  getImageModel,
  getMetaModel,
  getReportModel,
  getResearchModel,
  getVideoModel,
} from "@/lib/optimization-settings-storage";
import {
  postOpenRouterAppChat,
  streamOpenRouterAppChat,
  type OpenRouterAppMessage,
  type OpenRouterAppReasoning,
  type OpenRouterAppResponseFormat,
  type OpenRouterAppStreamDelta,
} from "@/lib/openrouter-app-api";

export type AgentOpenRouterCategory =
  | "research"
  | "blog"
  | "image"
  | "meta"
  | "report"
  | "ads"
  | "video";

export function resolveModelForAgentCategory(
  category: AgentOpenRouterCategory,
  siteId?: string | null,
): string {
  switch (category) {
    case "research":
      return getResearchModel(siteId ?? undefined);
    case "blog":
      return getBlogModel(siteId);
    case "image":
      return getImageModel(siteId);
    case "meta":
      return getMetaModel(siteId);
    case "report":
      return getReportModel(siteId);
    case "ads":
      return getAdsModel(siteId);
    case "video":
      return getVideoModel(siteId);
    default: {
      const _exhaustive: never = category;
      return _exhaustive;
    }
  }
}

/** Streaming variant: the category model's reasoning and content deltas arrive through `onDelta` as they are written. */
export function streamAgentCategoryOpenRouterChat(args: {
  category: AgentOpenRouterCategory;
  siteId?: string | null;
  apiKey: string;
  messages: OpenRouterAppMessage[];
  maxTokens?: number;
  temperature?: number;
  responseFormat?: OpenRouterAppResponseFormat;
  reasoning?: OpenRouterAppReasoning;
  signal?: AbortSignal;
  onDelta: (delta: OpenRouterAppStreamDelta) => void;
}): Promise<{ content: string; reasoning: string; finishReason?: string }> {
  return streamOpenRouterAppChat({
    apiKey: args.apiKey.trim(),
    model: resolveModelForAgentCategory(args.category, args.siteId),
    messages: args.messages,
    temperature: args.temperature,
    maxTokens: args.maxTokens,
    responseFormat: args.responseFormat,
    reasoning: args.reasoning,
    signal: args.signal,
    onDelta: args.onDelta,
  });
}

export async function callAgentCategoryOpenRouterChat(args: {
  category: AgentOpenRouterCategory;
  siteId?: string | null;
  apiKey: string;
  system?: string;
  user?: string;
  messages?: OpenRouterAppMessage[];
  maxTokens?: number;
  temperature?: number;
  responseFormat?: OpenRouterAppResponseFormat;
  reasoning?: OpenRouterAppReasoning;
  signal?: AbortSignal;
}): Promise<{
  raw: unknown;
  content: string;
  finishReason?: string;
  nativeFinishReason?: string;
}> {
  const model = resolveModelForAgentCategory(args.category, args.siteId);
  const apiKey = args.apiKey.trim();

  if (args.messages?.length) {
    return postOpenRouterAppChat({
      apiKey,
      model,
      messages: args.messages,
      temperature: args.temperature,
      maxTokens: args.maxTokens,
      responseFormat: args.responseFormat,
      reasoning: args.reasoning,
      signal: args.signal,
    });
  }

  if (!args.system?.trim() || args.user === undefined) {
    throw new Error("OpenRouter agent call requires system and user, or messages.");
  }

  return callOpenRouterChatCompletion({
    apiKey,
    model,
    system: args.system,
    user: args.user,
    maxTokens: args.maxTokens ?? 4096,
    temperature: args.temperature,
    responseFormat: args.responseFormat,
    reasoning: args.reasoning,
    signal: args.signal,
  });
}
