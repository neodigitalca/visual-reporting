---
title: Pipeline Agents & Model Routing
slug: aiseo/agent-models
section: AISEO & Details Contract
order: 20
related:
  - aiseo/overview
  - aiseo/element-library
  - aiseo/generated-files
---

<!-- manual -->

NEO Pulse routes all OpenRouter completions through **seven Pipeline Agents** configured in **Dashboard -> AI & Models** (`src/components/LLMSettingsTabContent.tsx`). Changing any agent model in **Dashboard -> AI & Models** synchronously updates `localStorage` and immediately switches the model used across all Content Optimizer AISEO elements and generators.

## The Seven Pipeline Agents

| Agent | Getter (`optimization-settings-storage.ts`) | Global `localStorage` Key | Site Override Field (`optimization_settings_{siteId}`) | Default Model | Primary Responsibilities |
| --- | --- | --- | --- | --- | --- |
| **Research agent** | `getResearchModel(siteId)` | `neo-pulse-agent-research-model` | `researchModel` | `deepseek/deepseek-v4.1-flash` | Research All (Topic Fan-out planner, factual verification, first-party claims), Blog Checklist, Blueprint, Link targets, Extra Text, Scenario placement & persona extraction, In-Content & Featured Image checklists/vision grounding |
| **Blog agent** | `getBlogModel(siteId)` / `getProductionModel(siteId)` | `neo-pulse-agent-blog-model` | `model` | `google/gemini-2.5-flash` | Blog Optimization H2 section writers, AISEO Answer, AISEO Overview, AISEO Headers, AISEO Links, AISEO Scenario HTML writer, Elementor section & page rewrites |
| **Image agent** | `getImageModel(siteId)` | `neo-pulse-agent-image-model` | `imageModel` | `google/gemini-3.1-flash-image` | AISEO Featured image generation, AISEO In Content Image generation, SAP Generate Local Image, Extra Image, standalone Image Generator |
| **Meta agent** | `getMetaModel(siteId)` | `neo-pulse-agent-meta-model` | `metaModel` | `google/gemini-2.5-flash` | AISEO All Meta, AISEO Titles, AISEO Meta Description (MD), AISEO FAQs & FAQ intro, AISEO Keywords (Content & Entity single/batch), SEO image filename slugs |
| **Report agent** | `getReportModel(siteId)` | `neo-pulse-agent-report-model` | `reportModel` | `deepseek/deepseek-v4.1-flash` | GSC Reporting outline & section writers, Organic Reporting highlights |
| **Ads agent** | `getAdsModel(siteId)` | `neo-pulse-agent-ads-model` | `adsModel` | `deepseek/deepseek-v4.1-flash` | Google Ads & Meta PPC reporting and ad copy agents |
| **Video agent** | `getVideoModel(siteId)` | `neo-pulse-agent-video-model` | `videoModel` | `heygen/video-1` | Storyboard-to-video clip generation in the Video Generator |

## Resolution Order & Synchronous Switching

Model resolution is centralized in `src/lib/optimization-settings-storage.ts` and `src/lib/global-agent-models.ts`:

1. **Synchronous Global Persistence:** When a user selects a model in **Dashboard -> AI & Models**, `Index.tsx` and `ManagerSettingsContent.tsx` call `writeGlobal*AgentModel(modelId)` synchronously before React re-renders.
2. **Site Storage Synchronization:** `writeGlobal*AgentModel(modelId)` writes the global `neo-pulse-agent-*-model` key **and** updates the matching field in any stored `optimization_settings_{siteId}` entries in `localStorage` so stale site defaults can never mask a newly selected global model.
3. **Runtime Evaluation:** Content Optimizer AISEO hooks (`useOverviewAiOptimize`, `useOverviewTabBlogHeaders`, `useOverviewTabBlogLinks`, `useOverviewTabBlogOverview`, `useOverviewTabBlogAnswer`, `useOverviewTabBlogScenario`, `useOverviewTabBlogInContentImage`, `useOverviewTabElementorHarness`) call `getMetaModel(siteId)`, `getBlogModel(siteId)`, `getResearchModel(siteId)`, and `getImageModel(siteId)` at execution time so model changes take effect immediately without reloading the page.

## Category Dispatcher

`src/lib/openrouter-agent-category-api.ts` exposes `resolveModelForAgentCategory(category, siteId)`, `callAgentCategoryOpenRouterChat`, and `streamAgentCategoryOpenRouterChat` for category-typed agent calls (`"research" | "blog" | "image" | "meta" | "report" | "ads" | "video"`).
