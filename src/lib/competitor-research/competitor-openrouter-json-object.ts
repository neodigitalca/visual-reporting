import { callOpenRouterChatCompletion } from "@/lib/competitor-research/competitor-report-openrouter";
import { jsonObjectFromOpenRouterChatResult } from "@/lib/competitor-research/competitor-report-json-parse";
import type { OpenRouterAppResponseFormat } from "@/lib/openrouter-app-api";

const JSON_REPAIR_USER_SUFFIX =
  "\n\nYour last reply was not valid JSON. Respond with ONLY one JSON object. No prose, no markdown fences, no preamble.";

const JSON_REPAIR_SYSTEM_SUFFIX =
  "\n\nCRITICAL: The response body must be parseable JSON only. Do not write sentences outside the JSON object.";

export async function callOpenRouterJsonObject(args: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  maxTokens: number;
  temperature?: number;
  responseFormat?: OpenRouterAppResponseFormat;
  signal?: AbortSignal;
  /** When true, returns null after one repair attempt instead of throwing. */
  allowEmptyOnFailure?: boolean;
}): Promise<unknown | null> {
  const run = () =>
    callOpenRouterChatCompletion({
      apiKey: args.apiKey,
      model: args.model,
      system: args.system,
      user: args.user,
      maxTokens: args.maxTokens,
      temperature: args.temperature,
      responseFormat: args.responseFormat ?? { type: "json_object" },
      signal: args.signal,
    });

  const first = await run();
  let obj = jsonObjectFromOpenRouterChatResult(first);
  if (obj) return obj;

  const repair = await callOpenRouterChatCompletion({
    apiKey: args.apiKey,
    model: args.model,
    system: `${args.system}${JSON_REPAIR_SYSTEM_SUFFIX}`,
    user: `${args.user}${JSON_REPAIR_USER_SUFFIX}`,
    maxTokens: args.maxTokens,
    temperature: Math.min(args.temperature ?? 0.25, 0.2),
    responseFormat: { type: "json_object" },
    signal: args.signal,
  });
  obj = jsonObjectFromOpenRouterChatResult(repair);
  if (obj) return obj;

  if (args.allowEmptyOnFailure) return null;
  throw new Error("OpenRouter did not return a JSON object after retry.");
}
