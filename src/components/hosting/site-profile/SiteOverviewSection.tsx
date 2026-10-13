import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HostedEnvironment } from "@/lib/hosting-api";
import { MY_SITES_LINK, MY_SITES_TOOL_BTN } from "../my-sites/my-sites-theme";
import { formatBytes, formatCount } from "../my-sites/my-sites-view-model";
import { formatDateTime, profileUpdateCounts } from "./site-profile-view-model";
import { PROFILE_CARD, PROFILE_CARD_HEAD, PROFILE_CARD_TITLE, PROFILE_TILE, PROFILE_TILE_LABEL, PROFILE_TILE_VALUE } from "./site-profile-theme";

export type SiteOverviewSectionProps = {
  env: HostedEnvironment;
  canAdmin: boolean;
  refreshing: boolean;
  onRefreshStats: () => void;
  onOpenUsage: () => void;
};

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className={PROFILE_TILE}>
      <span className={PROFILE_TILE_LABEL}>{label}</span>
      <span className={PROFILE_TILE_VALUE}>{value}</span>
      <span className="h-6 truncate text-muted-foreground">{note ?? ""}</span>
    </div>
  );
}

export function SiteOverviewSection({ env, canAdmin, refreshing, onRefreshStats, onOpenUsage }: SiteOverviewSectionProps) {
  const s = env.stats;
  const updates = profileUpdateCounts(env);
  return (
    <div className="flex flex-col gap-4">
      <section className={PROFILE_CARD} aria-label="Updates">
        <div className={PROFILE_CARD_HEAD}>
          <h2 className={PROFILE_CARD_TITLE}>Updates</h2>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">Last refreshed {formatDateTime(s?.collectedAt)}</span>
            <Button type="button" variant="ghost" className={MY_SITES_TOOL_BTN} disabled={!canAdmin || refreshing} onClick={onRefreshStats}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
              Refresh
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <Tile label="WordPress" value={s?.wpVersion ?? "–"} note={updates.wordpress ? `Update available: ${updates.wordpress}` : "Up to date"} />
          <Tile label="PHP" value={s?.phpVersion ?? "–"} />
          <Tile label="Plugins" value={String(s?.plugins.length ?? 0)} note={updates.plugins > 0 ? `${updates.plugins} update${updates.plugins === 1 ? "" : "s"}` : "Up to date"} />
          <Tile label="Themes" value={String(s?.themes.length ?? 0)} note={updates.themes > 0 ? `${updates.themes} update${updates.themes === 1 ? "" : "s"}` : "Up to date"} />
        </div>
        <p className="h-6 truncate text-amber-200" title={s?.errorMessage ?? undefined}>
          {s?.errorMessage ? `Stats incomplete: ${s.errorMessage}` : ""}
        </p>
      </section>

      <section className={PROFILE_CARD} aria-label="Environment">
        <div className={PROFILE_CARD_HEAD}>
          <h2 className={PROFILE_CARD_TITLE}>Environment</h2>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <Tile label="Status" value={env.status} note={env.statusMessage ?? undefined} />
          <Tile label="Region" value={env.region} />
          <Tile label="Disk" value={`${env.diskGb} GB`} />
          <Tile label="Created" value={formatDateTime(env.createdAt)} />
        </div>
      </section>

      <section className={PROFILE_CARD} aria-label="Usage for last 30 days">
        <div className={PROFILE_CARD_HEAD}>
          <h2 className={PROFILE_CARD_TITLE}>Usage for last 30 days</h2>
          <button type="button" className={MY_SITES_LINK} onClick={onOpenUsage}>
            View detailed usage
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Tile label="Storage" value={formatBytes(s?.storageBytes ?? null)} />
          <Tile label="Bandwidth" value={formatBytes(s?.bandwidthBytes30d ?? null)} />
          <Tile label="Visits" value={formatCount(s?.visits30d ?? null)} note="HTTP requests" />
        </div>
      </section>
    </div>
  );
}
