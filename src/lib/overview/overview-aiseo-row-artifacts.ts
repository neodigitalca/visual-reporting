import type { BulkOptimizationState } from "@/hooks/content-optimization/use-optimization-state";
import type { PipelineAgentKind } from "@/lib/agent-pipeline-cost-estimates";
import { mergeGeneratedFilesByName } from "@/lib/overview/overview-peer-csv-details";

export type AiseoFileSlotRunKind = Exclude<
  BulkOptimizationState["runKind"],
  undefined | "research"
>;

export type AiseoElementCategory = "research" | "meta" | "content" | "image" | "site";

export const AISEO_POST_CONTENT_SLOT_TITLE = "Post content";
export const AISEO_WP_UPLOAD_SLOT_TITLE = "WordPress upload";

export type AiseoGeneratedFile = {
  name: string;
  content: string;
  mimeType: string;
};

export type AiseoRowArtifactContract = {
  runKind: AiseoFileSlotRunKind;
  category: AiseoElementCategory;
  agentKind: PipelineAgentKind | "none";
  label: string;
  reason: string;
  elementSlotTitle: string | null;
  elementFileName: string | null;
  pipelineTitles: readonly string[];
};

export const AISEO_ROW_ARTIFACT_REGISTRY: Record<AiseoFileSlotRunKind, AiseoRowArtifactContract> = {
  aiAllMeta: {
    runKind: "aiAllMeta",
    category: "meta",
    agentKind: "meta",
    label: "All Meta",
    reason: "Generates Title, Meta Description, and FAQ schema in one coordinated pass grounded in the row research brief.",
    elementSlotTitle: "All Meta",
    elementFileName: "ai-all-meta.json",
    pipelineTitles: ["All Meta", AISEO_POST_CONTENT_SLOT_TITLE, AISEO_WP_UPLOAD_SLOT_TITLE],
  },
  aiTitle: {
    runKind: "aiTitle",
    category: "meta",
    agentKind: "meta",
    label: "Titles",
    reason: "Rewrites the SEO and WordPress title (50-60 chars) with exact focus-keyword weaving and zero colons or brand prefixes.",
    elementSlotTitle: "AI titles",
    elementFileName: "ai-title.json",
    pipelineTitles: ["AI titles", AISEO_POST_CONTENT_SLOT_TITLE, AISEO_WP_UPLOAD_SLOT_TITLE],
  },
  aiMeta: {
    runKind: "aiMeta",
    category: "meta",
    agentKind: "meta",
    label: "Meta Description (MD)",
    reason: "Writes a 130-150 character SERP meta description containing the exact focus keyword and specific buyer value.",
    elementSlotTitle: "AI meta",
    elementFileName: "ai-meta.json",
    pipelineTitles: ["AI meta", AISEO_POST_CONTENT_SLOT_TITLE, AISEO_WP_UPLOAD_SLOT_TITLE],
  },
  contentKw: {
    runKind: "contentKw",
    category: "research",
    agentKind: "meta",
    label: "Keywords (Content)",
    reason: "Derives a 2-5 word short-tail primary focus keyword (`keyword_focus`) from URL path, title, meta, and research brief.",
    elementSlotTitle: "AI keywords (content)",
    elementFileName: "focus-keyword.json",
    pipelineTitles: ["AI keywords (content)", AISEO_POST_CONTENT_SLOT_TITLE, AISEO_WP_UPLOAD_SLOT_TITLE],
  },
  entityKw: {
    runKind: "entityKw",
    category: "research",
    agentKind: "meta",
    label: "Keywords (Entity / SAP)",
    reason: "Derives a localized service-area focus keyword (`[Service] [Neighborhood/City] [ST]`) from URL, title, and NAP context.",
    elementSlotTitle: "Entity keywords",
    elementFileName: "focus-keyword.json",
    pipelineTitles: ["Entity keywords", AISEO_POST_CONTENT_SLOT_TITLE, AISEO_WP_UPLOAD_SLOT_TITLE],
  },
  aiUrl: {
    runKind: "aiUrl",
    category: "meta",
    agentKind: "none",
    label: "URLs",
    reason: "Computes a short keyword-aligned URL slug and Rank Math 301 redirect CSV entry when the current slug drifts from the focus keyword.",
    elementSlotTitle: "AI URL paths",
    elementFileName: "ai-url.json",
    pipelineTitles: ["AI URL paths", AISEO_POST_CONTENT_SLOT_TITLE, AISEO_WP_UPLOAD_SLOT_TITLE],
  },
  aiFaq: {
    runKind: "aiFaq",
    category: "meta",
    agentKind: "meta",
    label: "FAQs",
    reason: "Generates conversational buyer Q&A pairs for ACF FAQ schema and appends a structured FAQ section to the post body.",
    elementSlotTitle: "FAQ",
    elementFileName: "faq.json",
    pipelineTitles: ["FAQ", AISEO_POST_CONTENT_SLOT_TITLE, AISEO_WP_UPLOAD_SLOT_TITLE],
  },
  aiScenario: {
    runKind: "aiScenario",
    category: "content",
    agentKind: "blog",
    label: "Scenario",
    reason: "Inserts or refreshes a localized `[ILLUSTRATIVE]` case scenario (`Scenario: ...` H2 + blockquote + `Recommendation:` H3).",
    elementSlotTitle: "Case scenario",
    elementFileName: "scenario.json",
    pipelineTitles: ["Case scenario", AISEO_POST_CONTENT_SLOT_TITLE, AISEO_WP_UPLOAD_SLOT_TITLE],
  },
  aiAnswer: {
    runKind: "aiAnswer",
    category: "content",
    agentKind: "blog",
    label: "Answer",
    reason: "Generates or replaces the leading `<h2>Answer</h2>` direct-answer block for AI Overviews and featured snippets.",
    elementSlotTitle: "Answer",
    elementFileName: "answer.html",
    pipelineTitles: ["Answer", AISEO_POST_CONTENT_SLOT_TITLE, AISEO_WP_UPLOAD_SLOT_TITLE],
  },
  aiOverview: {
    runKind: "aiOverview",
    category: "content",
    agentKind: "blog",
    label: "Overview",
    reason: "Generates the `<h2>Overview</h2>` summary with bold-label key-point bullets and `#anchor` scroll citations to every body H2.",
    elementSlotTitle: "Overview",
    elementFileName: "overview.html",
    pipelineTitles: ["Overview", AISEO_POST_CONTENT_SLOT_TITLE, AISEO_WP_UPLOAD_SLOT_TITLE],
  },
  aiHeaders: {
    runKind: "aiHeaders",
    category: "content",
    agentKind: "blog",
    label: "Headers",
    reason: "Rewrites generic or weak body H2 headings in place to align with GSC queries, SERP intent, and focus keyword variations.",
    elementSlotTitle: "Headers",
    elementFileName: "headers-plan.json",
    pipelineTitles: ["Headers", AISEO_POST_CONTENT_SLOT_TITLE, AISEO_WP_UPLOAD_SLOT_TITLE],
  },
  aiLinks: {
    runKind: "aiLinks",
    category: "content",
    agentKind: "blog",
    label: "Links",
    reason: "Audits, replaces, and weaves contextual internal links (`<a href>`) from the connected site's verified Posts/Pages/SAP inventory.",
    elementSlotTitle: "Links",
    elementFileName: "links-plan.json",
    pipelineTitles: ["Links", AISEO_POST_CONTENT_SLOT_TITLE, AISEO_WP_UPLOAD_SLOT_TITLE],
  },
  aiWikipediaLink: {
    runKind: "aiWikipediaLink",
    category: "content",
    agentKind: "research",
    label: "Wikipedia link",
    reason: "Resolves the canonical Wikipedia entity URL for the row's place/topic and weaves an external authority citation at first mention.",
    elementSlotTitle: "Wikipedia link",
    elementFileName: "wikipedia-link.json",
    pipelineTitles: ["Wikipedia link", AISEO_POST_CONTENT_SLOT_TITLE, AISEO_WP_UPLOAD_SLOT_TITLE],
  },
  contentCleanup: {
    runKind: "contentCleanup",
    category: "content",
    agentKind: "none",
    label: "Clean Up",
    reason: "Strips duplicate body `<h1>` blocks and converts raw Markdown pipe tables into semantic HTML `<table>` markup.",
    elementSlotTitle: "Clean Up",
    elementFileName: "cleanup.json",
    pipelineTitles: ["Clean Up", AISEO_POST_CONTENT_SLOT_TITLE, AISEO_WP_UPLOAD_SLOT_TITLE],
  },
  aiInContentImage: {
    runKind: "aiInContentImage",
    category: "image",
    agentKind: "image",
    label: "In Content Image",
    reason: "Selects the best H2 section, generates or reuses a grounded 16:9 visual (or SAP local place photo), uploads to WP Media, and inserts `<figure>`.",
    elementSlotTitle: "In content image",
    elementFileName: "in-content-image.md",
    pipelineTitles: ["In content image", AISEO_POST_CONTENT_SLOT_TITLE, AISEO_WP_UPLOAD_SLOT_TITLE],
  },
  aiFeaturedImage: {
    runKind: "aiFeaturedImage",
    category: "image",
    agentKind: "image",
    label: "Featured image",
    reason: "Builds an image checklist from post HTML, generates a grounded 16:9 featured image, uploads to WP Media, and sets `featured_media`.",
    elementSlotTitle: "Featured image",
    elementFileName: "image-requirements.json",
    pipelineTitles: ["Featured image", AISEO_POST_CONTENT_SLOT_TITLE, AISEO_WP_UPLOAD_SLOT_TITLE],
  },
  extraText: {
    runKind: "extraText",
    category: "content",
    agentKind: "research",
    label: "Extra Text",
    reason: "Generates supplementary `<h2>` + `<h3>` HTML with internal links for the page's `seo_extra_text` ACF field.",
    elementSlotTitle: "Extra text",
    elementFileName: "extra-text.html",
    pipelineTitles: ["Extra text", AISEO_POST_CONTENT_SLOT_TITLE, AISEO_WP_UPLOAD_SLOT_TITLE],
  },
  wpUpload: {
    runKind: "wpUpload",
    category: "site",
    agentKind: "none",
    label: "WordPress Upload",
    reason: "Pushes staged row title, meta, focus keyword, FAQ, and HTML body to WordPress and records the `wordpress.json` upload receipt.",
    elementSlotTitle: null,
    elementFileName: null,
    pipelineTitles: [AISEO_POST_CONTENT_SLOT_TITLE, AISEO_WP_UPLOAD_SLOT_TITLE],
  },
  content: {
    runKind: "content",
    category: "content",
    agentKind: "blog",
    label: "Blog Optimization (Content)",
    reason: "Full multi-section blog optimization (Checklist -> Blueprint -> Link targets -> H2 Section writers -> Post content -> WordPress upload) without re-running Research.",
    elementSlotTitle: null,
    elementFileName: null,
    pipelineTitles: [],
  },
};

export function listAiseoElementLibrary(): AiseoRowArtifactContract[] {
  return Object.values(AISEO_ROW_ARTIFACT_REGISTRY);
}

export function isAiseoFileSlotRunKind(
  runKind: BulkOptimizationState["runKind"] | undefined,
): runKind is AiseoFileSlotRunKind {
  return (
    runKind != null &&
    runKind in AISEO_ROW_ARTIFACT_REGISTRY &&
    runKind !== "content" &&
    runKind !== "aiFeaturedImage"
  );
}

export function getAiseoRowArtifactContract(
  runKind: BulkOptimizationState["runKind"] | undefined,
): AiseoRowArtifactContract | undefined {
  if (!runKind || runKind === "research") {
    return undefined;
  }
  return AISEO_ROW_ARTIFACT_REGISTRY[runKind as AiseoFileSlotRunKind];
}

export function aiseoRowPipelineTitles(
  runKind: BulkOptimizationState["runKind"] | undefined,
): readonly string[] {
  return getAiseoRowArtifactContract(runKind)?.pipelineTitles ?? [];
}

export function generatedFileName(file: { name?: string; fileName?: string }): string {
  return file.name?.trim() || file.fileName?.trim() || "";
}

export function aiseoPostContentFileSlug(url: string): string {
  return (
    url
      .replace(/^https?:\/\//i, "")
      .replace(/\/+$/, "")
      .split("/")
      .pop()
      ?.replace(/[^a-z0-9._-]+/gi, "_")
      .slice(0, 60) || "page"
  );
}

export function isAiseoPostContentFileName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.startsWith("content-") && trimmed.endsWith(".html");
}

export function isWordPressUploadProofFileName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed === "wordpress.json" || (trimmed.startsWith("upload-payload-") && trimmed.endsWith(".json"));
}

/** Full WordPress post_content (exact bytes uploaded). */
export function buildAiseoPostContentHtmlFile(
  url: string,
  html: string,
): AiseoGeneratedFile | null {
  const body = html.trim();
  if (!body) return null;
  return {
    name: `content-${aiseoPostContentFileSlug(url)}.html`,
    content: body,
    mimeType: "text/html;charset=utf-8",
  };
}

export function findAiseoPostContentFile<T extends { name?: string; fileName?: string }>(
  files: T[],
): T | undefined {
  return files.find((file) => isAiseoPostContentFileName(generatedFileName(file)));
}

export function aiseoRowPipelineFileName(
  runKind: BulkOptimizationState["runKind"] | undefined,
  title: string,
): string | null {
  const contract = getAiseoRowArtifactContract(runKind);
  if (!contract) return null;
  if (title === contract.elementSlotTitle && contract.elementFileName) {
    return contract.elementFileName;
  }
  if (title === AISEO_POST_CONTENT_SLOT_TITLE) return null;
  if (title === AISEO_WP_UPLOAD_SLOT_TITLE) return "wordpress.json";
  return null;
}

type DisplayStatus = "waiting" | "generating" | "done";

export function buildAiseoRowDisplaySections(
  runKind: BulkOptimizationState["runKind"] | undefined,
  harness: Array<{ status?: string }> | undefined,
  files: Array<{ name?: string; fileName?: string }>,
): Array<{ sectionIndex: number; title: string; status: DisplayStatus }> {
  const contract = getAiseoRowArtifactContract(runKind);
  if (!contract?.pipelineTitles.length) return [];

  const sections = harness ?? [];
  const generating = sections.some((section) => section.status === "generating");
  const harnessDone = sections.length > 0 && sections.every((section) => section.status === "done");
  const hasElement =
    contract.elementFileName != null &&
    files.some((file) => generatedFileName(file) === contract.elementFileName);
  const hasPostContent = Boolean(findAiseoPostContentFile(files));
  const hasWordpress = files.some((file) => generatedFileName(file) === "wordpress.json");

  let elementStatus: DisplayStatus = "waiting";
  if (hasElement || (contract.elementSlotTitle && harnessDone)) elementStatus = "done";
  else if (generating) elementStatus = "generating";

  let contentStatus: DisplayStatus = "waiting";
  if (hasPostContent || hasWordpress) contentStatus = "done";
  else if (hasElement || (contract.elementSlotTitle == null && generating)) contentStatus = "generating";
  else if (elementStatus === "done") contentStatus = "generating";

  let wpStatus: DisplayStatus = "waiting";
  if (hasWordpress) wpStatus = "done";
  else if (hasPostContent || elementStatus === "done") wpStatus = "generating";

  const statuses: DisplayStatus[] = [];
  if (contract.elementSlotTitle) {
    statuses.push(elementStatus, contentStatus, wpStatus);
  } else if (contract.runKind === "wpUpload") {
    statuses.push(contentStatus, wpStatus);
  } else {
    return [];
  }

  return contract.pipelineTitles.map((title, sectionIndex) => ({
    sectionIndex,
    title,
    status: statuses[sectionIndex] ?? "waiting",
  }));
}

export function filterAiseoRowDisplayFiles<
  T extends { name?: string; fileName?: string },
>(runKind: BulkOptimizationState["runKind"] | undefined, files: T[]): T[] {
  const contract = getAiseoRowArtifactContract(runKind);
  if (!contract) return files;

  const out: T[] = [];
  if (contract.elementFileName) {
    const element = files.find((file) => generatedFileName(file) === contract.elementFileName);
    if (element) out.push(element);
  }
  if (contract.runKind === "aiFeaturedImage") {
    for (const extraName of ["google-image.png", "openrouter-image.png"]) {
      const extra = files.find((file) => generatedFileName(file) === extraName);
      if (extra) out.push(extra);
    }
  }
  const postContent = findAiseoPostContentFile(files);
  if (postContent) out.push(postContent);
  const uploadPayload = files.find((file) => {
    const n = generatedFileName(file);
    return n.startsWith("upload-payload-") && n.endsWith(".json");
  });
  if (uploadPayload) out.push(uploadPayload);
  const wordpress = files.find((file) => generatedFileName(file) === "wordpress.json");
  if (wordpress) out.push(wordpress);
  return out;
}

export function mergeAiseoRowFinishFiles(args: {
  runKind: BulkOptimizationState["runKind"];
  url: string;
  existingFiles: AiseoGeneratedFile[];
  elementFiles?: AiseoGeneratedFile[];
  postHtml?: string;
}): AiseoGeneratedFile[] {
  const existingWordpress = args.existingFiles.find(
    (file) => generatedFileName(file) === "wordpress.json",
  );
  const existingUploadPayload = args.existingFiles.find((file) => {
    const n = generatedFileName(file);
    return n.startsWith("upload-payload-") && n.endsWith(".json");
  });
  const merged = mergeGeneratedFilesByName(args.existingFiles, [
    ...(args.elementFiles ?? []),
    ...(args.postHtml?.trim()
      ? [buildAiseoPostContentHtmlFile(args.url, args.postHtml)].filter(
          (file): file is AiseoGeneratedFile => file != null,
        )
      : []),
  ]);
  let filtered = filterAiseoRowDisplayFiles(args.runKind, merged);
  if (
    existingUploadPayload &&
    !filtered.some((file) => generatedFileName(file) === generatedFileName(existingUploadPayload))
  ) {
    filtered = [...filtered, existingUploadPayload];
  }
  if (
    existingWordpress &&
    !filtered.some((file) => generatedFileName(file) === "wordpress.json")
  ) {
    filtered = [...filtered, existingWordpress];
  }
  return filtered.map((file) => ({
    name: generatedFileName(file),
    content: "content" in file && typeof file.content === "string" ? file.content : "",
    mimeType:
      "mimeType" in file && typeof file.mimeType === "string"
        ? file.mimeType
        : "application/octet-stream",
  }));
}

export function buildAiseoElementJsonFile(
  name: string,
  payload: unknown,
): AiseoGeneratedFile | null {
  const trimmedName = name.trim();
  if (!trimmedName) return null;
  return {
    name: trimmedName,
    content: JSON.stringify(payload, null, 2),
    mimeType: "application/json;charset=utf-8",
  };
}

export function buildAiseoElementHtmlFile(name: string, html: string): AiseoGeneratedFile | null {
  const body = html.trim();
  if (!body) return null;
  return {
    name: name.trim(),
    content: body,
    mimeType: "text/html;charset=utf-8",
  };
}

export function buildAiseoElementTextFile(
  name: string,
  text: string,
  mimeType = "text/markdown;charset=utf-8",
): AiseoGeneratedFile | null {
  const body = text.trim();
  if (!body) return null;
  return {
    name: name.trim(),
    content: body,
    mimeType,
  };
}

export type AiseoDownloadableFile = {
  name: string;
  content: string;
  mimeType: string;
};

function toAiseoDownloadableFile(
  file: { name?: string; fileName?: string; content?: string; mimeType?: string },
): AiseoDownloadableFile | undefined {
  const name = generatedFileName(file);
  const content = typeof file.content === "string" ? file.content : "";
  if (!name || !content.trim()) return undefined;
  return {
    name,
    content,
    mimeType:
      typeof file.mimeType === "string" && file.mimeType.trim()
        ? file.mimeType
        : "application/octet-stream",
  };
}

/** Map a fixed pipeline slot title to a downloadable file for Details drawers. */
export function resolveAiseoPipelineDownloadFile(
  runKind: AiseoFileSlotRunKind,
  title: string,
  files: Array<{ name?: string; fileName?: string; content?: string; mimeType?: string }>,
): AiseoDownloadableFile | undefined {
  if (title === AISEO_POST_CONTENT_SLOT_TITLE) {
    const match = findAiseoPostContentFile(files);
    return match ? toAiseoDownloadableFile(match) : undefined;
  }
  const fileName = aiseoRowPipelineFileName(runKind, title);
  if (!fileName) return undefined;
  const match = files.find((file) => generatedFileName(file) === fileName);
  return match ? toAiseoDownloadableFile(match) : undefined;
}

export function aiseoRowFilesForUpload(args: {
  runKind: BulkOptimizationState["runKind"];
  url: string;
  elementFiles?: AiseoGeneratedFile[];
  postHtml?: string;
}): AiseoGeneratedFile[] {
  return mergeAiseoRowFinishFiles({
    runKind: args.runKind,
    url: args.url,
    existingFiles: [],
    elementFiles: args.elementFiles,
    postHtml: args.postHtml,
  });
}
