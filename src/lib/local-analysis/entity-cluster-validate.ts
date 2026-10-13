import type { CSVRow } from "@/lib/bulk/bulk-csv-parser";
import { normalizeEntityHintCommaLabel } from "@/lib/comma-place-label";
import { entityTypeFocusWantsNeighbourhoods } from "@/lib/entity-geographic-level";
import { isCityLevelOnlyEntity } from "@/lib/local-analysis/entity-preload-suggested-keywords";

export function countDistinctEntityLabels(rows: readonly CSVRow[]): number {
  const seen = new Set<string>();
  for (const row of rows) {
    const entity = normalizeEntityHintCommaLabel((row.entity ?? "").trim());
    if (!entity) continue;
    seen.add(entity.toLowerCase());
  }
  return seen.size;
}

/** Fail fast when cluster output does not match Neighbourhoods contract (no city placeholders). */
export function validateEntityClusterResult(args: {
  rows: CSVRow[];
  total: number;
  parentCityLabel?: string;
  entityTypeFocus?: readonly string[];
}): void {
  const total = Math.max(1, Math.floor(args.total));
  const withEntity = args.rows.filter((r) => r.entity?.trim());
  if (withEntity.length === 0) {
    throw new Error("Clusters produced no entity rows.");
  }
  if (withEntity.length !== total) {
    throw new Error(
      `Clusters produced ${withEntity.length} entity row(s), expected ${total}.`,
    );
  }

  const parent = normalizeEntityHintCommaLabel((args.parentCityLabel ?? "").trim());
  const wantsNeighbourhoods = entityTypeFocusWantsNeighbourhoods(args.entityTypeFocus);

  const distinctKeys = new Set<string>();
  for (const row of withEntity) {
    const entity = normalizeEntityHintCommaLabel(row.entity!.trim());
    if (wantsNeighbourhoods && isCityLevelOnlyEntity(entity, parent || undefined)) {
      throw new Error(
        `Neighbourhoods focus cannot use city-level entity "${entity}". Pick sub-city places or change entity type focus.`,
      );
    }
    const key = entity.toLowerCase();
    if (distinctKeys.has(key)) {
      throw new Error(`Duplicate entity "${entity}" in cluster output.`);
    }
    distinctKeys.add(key);
  }

  if (wantsNeighbourhoods && distinctKeys.size !== total) {
    throw new Error(
      `Neighbourhoods focus requires ${total} distinct entities; got ${distinctKeys.size}.`,
    );
  }
}

export function assertEntityRowsHaveKeywords(rows: readonly CSVRow[]): void {
  const missing = rows.filter((r) => r.entity?.trim() && !r.keyword?.trim()).length;
  if (missing > 0) {
    throw new Error(`Keyword fill left ${missing} row(s) without keywords.`);
  }
}
