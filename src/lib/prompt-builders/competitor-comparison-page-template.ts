import { TABLE_NO_LINK_ONLY_COLUMN_RULE } from '@/lib/prompt-builders/table-prompt-rules';
import { UNIFIED_COPY_FORMATTING_RULE } from '@/lib/prompt-builders/title-rules';
import { UNIQUE_DYNAMIC_BODY_H2_RULE } from '@/lib/content-optimization/harness-heading-titles';

const COMPETITOR_PAGE_TEMPLATE_START = '--- COMPETITOR COMPARISON PAGE TEMPLATE (NON-NEGOTIABLE) ---';
const COMPETITOR_PAGE_TEMPLATE_END = '--- END COMPETITOR COMPARISON PAGE TEMPLATE ---';

export const COMPETITOR_RECOMMENDATION_TABLE_RULE = `**LOCAL RECOMMENDATION TABLE (COMPETITOR COMPARISON — NON-NEGOTIABLE)**:
This section is the [RECOMMENDATION] slot. It is a chooser for Edmonton-area homeowners comparing two providers, not a geography landing page.
1. H2 title: write from the writing keyword and window-covering context. Forbidden: "near {competitor name}" or treating the competitor as a neighborhood.
2. First sentence names the comparison context (Edmonton / area climate), then the HTML table. After the table, one closing sentence that names the connected business offerings without superlatives.
3. [TABLE] with exactly four columns: Product | Best for | Budget | Reason. ${TABLE_NO_LINK_ONLY_COLUMN_RULE}
4. **Product:** Named offering from the connected site (Pages inventory, Hunter Douglas lines, motorization, service). Link when inventory has a URL.
5. **Best for:** A reader job (insulation, glare, motorization, repairs) tied to Edmonton homes — not "shopping at {competitor}".
6. **Budget:** "Quote; varies with …" unless sourced pricing exists. No invented dollar ranges.
7. **Reason:** One factual contrast (durability, warranty service, custom measure, product line depth) without saying "best" or "right choice."
8. Rows: 4-6. Article table cap: offerings table + this recommendation table only.`;

export function formatCompetitorComparisonChecklistBlock(competitorName: string, connectedSiteName: string): string {
  const competitor = competitorName.trim() || '[Competitor business]';
  const connected = connectedSiteName.trim() || '[Connected site]';
  return [
    COMPETITOR_PAGE_TEMPLATE_START,
    'This is a provider comparison page (NOT a service-area / SAP geo page). Compare two window-covering businesses for Edmonton-area homeowners. The competitor is a business name, never a place or neighborhood.',
    `Competitor business (compare against ${connected}): ${competitor}`,
    `Connected site (host brand, first-person "we" where appropriate): ${connected}`,
    'Output exactly 9 numbered checklist items. Unique topical H2 titles. Forbidden: "near {competitor}", "in {competitor} area", "homes in {competitor}".',
    UNIQUE_DYNAMIC_BODY_H2_RULE,
    UNIFIED_COPY_FORMATTING_RULE,
    '',
    'Required checklist items (unique H2 title, then [STRUCTURE] and markers):',
    `1. Answer [STRUCTURE]: Direct answer naming ${competitor} and ${connected} in plain business names. **[EXACT PRIMARY PER H2]**. [LINK]: Pages inventory.`,
    `2. Overview [STRUCTURE]: 1-2 paragraphs + bullet list of section anchors. Comparison framing for Edmonton window coverings. **[EXACT PRIMARY PER H2]**.`,
    `3. Comparing providers [STRUCTURE]: 2-3 paragraphs on how shoppers weigh ${competitor} vs ${connected}. Local climate/light, not geo-slugging the competitor. **[EXACT PRIMARY PER H2]**. [LINK].`,
    `4. Local climate and home styles [STRUCTURE]: 1-2 paragraphs + [LIST] or climate table for Edmonton area homes (not "{competitor} area homeowners"). **[EXACT PRIMARY PER H2]**.`,
    `5. Selecting styles and features [STRUCTURE]: 2-3 paragraphs + [DECISION] or criteria table (situation vs importance). **[EXACT PRIMARY PER H2]**. [LINK].`,
    `6. Worked example [STRUCTURE]: 1 intro paragraph, then [ILLUSTRATIVE] scenario in <blockquote> (shopper choosing between ${competitor} and ${connected}). Exactly one [ILLUSTRATIVE] on the page. h3 Recommendation under the quote: connected-site product line (Hunter Douglas, PowerView, service) with evidence — no "choose us" or superlatives. **[EXACT PRIMARY PER H2]**.`,
    `7. What the connected site offers [STRUCTURE]: 1-2 paragraphs + [TABLE] Product/Service | Description (Pages links). **[EXACT PRIMARY PER H2]**.`,
    `8. Recommendations for local homes [RECOMMENDATION] + [TABLE]: four-column Product | Best for | Budget | Reason. **[EXACT PRIMARY PER H2]**.`,
    `9. Getting started [STRUCTURE]: numbered [LIST] steps (consultation, measure, install, aftercare). **[EXACT PRIMARY PER H2]**. [LINK].`,
    '',
    COMPETITOR_RECOMMENDATION_TABLE_RULE,
    'Forbidden: SAP "near" titles, competitor as geography, superiority claims ("best", "#1", "the right choice"), second illustrative scenarios.',
    COMPETITOR_PAGE_TEMPLATE_END,
  ].join('\n');
}

export function formatCompetitorComparisonWriterBlock(
  competitorName?: string,
  connectedSiteName?: string,
): string {
  const competitor = competitorName?.trim() || '';
  const connected = connectedSiteName?.trim() || '';
  return [
    COMPETITOR_PAGE_TEMPLATE_START,
    'Writer: provider comparison for Edmonton-area window coverings. The entity field is the competitor business name only. Never write as if the competitor were a neighborhood or service area.',
    competitor ? `Competitor business: ${competitor}` : '',
    connected ? `Connected site (use first-person for their offerings): ${connected}` : '',
    UNIFIED_COPY_FORMATTING_RULE,
    UNIQUE_DYNAMIC_BODY_H2_RULE,
    COMPETITOR_RECOMMENDATION_TABLE_RULE,
    'Bias through evidence only: longevity, Hunter Douglas depth, motorization, in-home measure, repair department — not slogans or "we are better."',
    'Exactly one [ILLUSTRATIVE] blockquote scenario on the page.',
    COMPETITOR_PAGE_TEMPLATE_END,
  ]
    .filter(Boolean)
    .join('\n');
}

export function formatCompetitorChecklistExample(
  competitorName: string,
  _title: string,
): string {
  const c = competitorName.trim() || '[Competitor]';
  return `1. Answer [STRUCTURE]: … ${c} … **[EXACT PRIMARY PER H2]**. [LINK].
2. Overview [STRUCTURE]: comparison guide bullets … **[EXACT PRIMARY PER H2]**.
3. Comparing window treatments … [STRUCTURE]: … **[EXACT PRIMARY PER H2]**. [LINK].
4. Local climate and home styles … [STRUCTURE]: [LIST] … **[EXACT PRIMARY PER H2]**.
5. Considerations for selecting blind styles [STRUCTURE]: [DECISION] table … **[EXACT PRIMARY PER H2]**.
6. Unique topical H2 for worked example [STRUCTURE]: [ILLUSTRATIVE] [BLOCKQUOTE] … **[EXACT PRIMARY PER H2]**.
7. What the connected site offers [STRUCTURE]: [TABLE] … **[EXACT PRIMARY PER H2]**.
8. Window treatment recommendations [RECOMMENDATION]: [TABLE] Product | Best for | Budget | Reason … **[EXACT PRIMARY PER H2]**.
9. Getting started with your window project [STRUCTURE]: [LIST] … **[EXACT PRIMARY PER H2]**. [LINK].`;
}
