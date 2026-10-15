import { buildSoloImagePrompt } from "@/lib/image-generator/image-generator-options";
import { generateImage } from "@/lib/image-api";
import { fetchImageDataUrlViaApi } from "@/lib/proxy-fetch-text";
import { callAgentCategoryOpenRouterChat } from "@/lib/openrouter-agent-category-api";
import type { OpenRouterAppMessage } from "@/lib/openrouter-app-api";
import { parseJsonObjectFromModelText } from "@/lib/openrouter-vision-chat";
import type { ManualImageReference } from "@/lib/image-generator/manual-reference-upload";
import type { ProductSpec, ProductView, ProductViewId } from "./video-generator-types";
import { videoLog, videoLogError, videoTimer } from "./video-log";

const PRODUCT_MAX_REFERENCES = 3;

export const PRODUCT_VIEW_DEFINITIONS: Array<{ id: ProductViewId; label: string }> = [
  { id: "front_elevation", label: "Front elevation" },
  { id: "side_elevation", label: "Side elevation" },
  { id: "three_quarter", label: "Three-quarter" },
  { id: "glazing_detail", label: "Glazing detail" },
];

const SPEC_SCHEMA = `{"name":"string","summary":"string","proportions":"string","roof":"string","cladding":"string","glazing":"string","baseOrChassis":"string","palette":"string","mustNotChange":["string"]}`;

function imagePart(url: string) {
  return { type: "image_url", image_url: { url } };
}

export function parseProductSpec(raw: unknown): ProductSpec {
  if (!raw || typeof raw !== "object") throw new Error("Product spec must be a JSON object.");
  const o = raw as Record<string, unknown>;
  const mustNotChange = Array.isArray(o.mustNotChange)
    ? o.mustNotChange.map((x) => String(x).trim()).filter(Boolean)
    : [];
  const spec: ProductSpec = {
    name: String(o.name ?? "").trim(),
    summary: String(o.summary ?? "").trim(),
    proportions: String(o.proportions ?? "").trim(),
    roof: String(o.roof ?? "").trim(),
    cladding: String(o.cladding ?? "").trim(),
    glazing: String(o.glazing ?? "").trim(),
    baseOrChassis: String(o.baseOrChassis ?? "").trim(),
    palette: String(o.palette ?? "").trim(),
    mustNotChange,
  };
  const missing = (["name", "summary", "proportions", "cladding", "glazing"] as const).filter((k) => !spec[k]);
  if (missing.length) throw new Error(`Product spec is missing: ${missing.join(", ")}`);
  return spec;
}

function specBlock(spec: ProductSpec): string {
  return `Product: ${spec.name}
${spec.summary}
Proportions: ${spec.proportions}
Roof: ${spec.roof}
Cladding: ${spec.cladding}
Glazing: ${spec.glazing}
Base or chassis: ${spec.baseOrChassis}
Palette: ${spec.palette}
Must not change: ${spec.mustNotChange.join("; ")}`;
}

function cameraLine(viewId: ProductViewId): string {
  switch (viewId) {
    case "front_elevation":
      return "Camera: straight-on front elevation, eye level, orthographic feel, full module centered, flat neutral studio backdrop.";
    case "side_elevation":
      return "Camera: pure side elevation, eye level, the long elevation fully visible with door and glazing bays readable, module centered.";
    case "three_quarter":
      return "Camera: three-quarter view from front corner, slightly elevated, entire module visible on neutral studio floor.";
    case "glazing_detail":
      return "Camera: tight three-quarter detail on the primary glazing bay and cladding junction, still readable as the same module.";
  }
}

function viewPrompt(args: { viewId: ProductViewId; spec: ProductSpec }): string {
  const grounded = buildSoloImagePrompt(
    args.spec.name,
    {
      includeText: false,
      includePeople: false,
      includeAnimals: false,
      includeCars: false,
      isInfographic: false,
      colorForeground: "",
      colorBackground: "",
    },
    true,
  );
  return `${grounded}

This is a PRODUCT LOCK frame: the canonical studio view of the one product a short film is about.
${specBlock(args.spec)}

Render ONE complete modular product as high-end CGI product visualization on a neutral studio cyclorama (soft grey floor and backdrop). Full object in frame, PBR materials, crisp edges, no environment, no people, no vehicles, no crane, no site, no snow, no text, no watermark.
${cameraLine(args.viewId)}
Attached reference photos show the real product and approved renders: match design, proportions, cladding layout, glazing count and placement, colours and details exactly. Multiple refs describe ONE product, not a collage of variants.`;
}

export async function extractProductSpec(args: {
  apiKey: string;
  /** The Brief text; names the product and what the film is for. */
  briefPrompt: string;
  subjectPhotos: ManualImageReference[];
  productHeroReferences: ManualImageReference[];
}): Promise<ProductSpec> {
  const refLines = [
    ...args.subjectPhotos.map((r, i) => `Subject photo ${i + 1}: ${r.fileName}`),
    ...args.productHeroReferences.map((r, i) => `Hero reference ${i + 1}: ${r.fileName}`),
  ].join("\n");
  const messages: OpenRouterAppMessage[] = [
    {
      role: "system",
      content: `You extract a canonical product specification from photos and renders for a modular building or manufactured product film.
Output one JSON object only, no markdown fences.
Schema:
${SPEC_SCHEMA}
Rules:
- name: marketing or model name when visible or implied; else a precise descriptive name.
- summary: two sentences on what the product is and its use.
- mustNotChange: 4 to 8 short bullet strings (dimensions, glazing pattern, materials) that every generated frame must preserve.`,
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Brief for the film:
${args.briefPrompt.trim() || "(none)"}

${refLines}

Write the product spec JSON now.`,
        },
        ...args.subjectPhotos.map((r) => imagePart(r.dataUrl)),
        ...args.productHeroReferences.map((r) => imagePart(r.dataUrl)),
      ],
    },
  ];
  const elapsed = videoTimer();
  videoLog("product", "spec request", { photos: args.subjectPhotos.length, heroes: args.productHeroReferences.length });
  const res = await callAgentCategoryOpenRouterChat({
    category: "research",
    apiKey: args.apiKey,
    messages,
    maxTokens: 8000,
    reasoning: { effort: "low" },
    temperature: 0.2,
    responseFormat: { type: "json_object" },
  });
  videoLog("product", "spec reply", { seconds: elapsed(), finishReason: res.finishReason, content: res.content });
  try {
    return parseProductSpec(parseJsonObjectFromModelText(res.content));
  } catch (e) {
    videoLogError("product", "spec parse failed", e);
    throw e;
  }
}

async function imageResultToDataUrl(result: Awaited<ReturnType<typeof generateImage>>): Promise<string> {
  if (result.error) throw new Error(result.error);
  if (result.imageBase64) {
    return result.imageBase64.startsWith("data:") ? result.imageBase64 : `data:image/png;base64,${result.imageBase64}`;
  }
  if (result.imageUrl) {
    return result.imageUrl.startsWith("data:image/") ? result.imageUrl : await fetchImageDataUrlViaApi(result.imageUrl);
  }
  throw new Error("Image generator returned no image.");
}

export async function generateProductView(args: {
  apiKey: string;
  imageModel: string;
  spec: ProductSpec;
  viewId: ProductViewId;
  referenceDataUrls: string[];
  priorViewDataUrl?: string;
}): Promise<string> {
  const refs = [...args.referenceDataUrls, ...(args.priorViewDataUrl ? [args.priorViewDataUrl] : [])].slice(0, PRODUCT_MAX_REFERENCES);
  const elapsed = videoTimer();
  videoLog("product", `view ${args.viewId} start`, { refs: refs.length, model: args.imageModel });
  const result = await generateImage({
    apiKey: args.apiKey,
    model: args.imageModel,
    prompt: viewPrompt({ viewId: args.viewId, spec: args.spec }),
    aspectRatio: "16:9",
    referenceImageDataUrls: refs,
    maxReferenceImages: PRODUCT_MAX_REFERENCES,
  });
  let dataUrl: string;
  try {
    dataUrl = await imageResultToDataUrl(result);
  } catch (e) {
    videoLogError("product", `view ${args.viewId} failed after ${elapsed()} s`, e);
    throw e;
  }
  videoLog("product", `view ${args.viewId} done`, { seconds: elapsed(), bytes: dataUrl.length });
  return dataUrl;
}

export function initialProductViews(): ProductView[] {
  return PRODUCT_VIEW_DEFINITIONS.map((d) => ({ id: d.id, label: d.label, status: "waiting" as const }));
}

export function collectProductReferenceDataUrls(args: {
  subjectPhotos: ManualImageReference[];
  references: ManualImageReference[];
}): string[] {
  const urls: string[] = [];
  for (const r of args.subjectPhotos) urls.push(r.dataUrl);
  for (const r of args.references.slice(0, 2)) urls.push(r.dataUrl);
  return urls.slice(0, PRODUCT_MAX_REFERENCES);
}
