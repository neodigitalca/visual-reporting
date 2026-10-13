import type { HostedEnvironment } from "@/lib/hosting-api";
import { formatBytes, formatCount } from "../my-sites/my-sites-view-model";
import { formatDateTime } from "./site-profile-view-model";
import { PROFILE_CARD, PROFILE_CARD_HEAD, PROFILE_CARD_TITLE, PROFILE_TD, PROFILE_TH, PROFILE_TILE, PROFILE_TILE_LABEL, PROFILE_TILE_VALUE } from "./site-profile-theme";

export type SiteUsageSectionProps = { env: HostedEnvironment };

const ROWS = (env: HostedEnvironment): Array<[string, string]> => [
  ["Install", env.slug],
  ["Region", env.region],
  ["Disk", `${env.diskGb} GB`],
  ["Render web service", env.renderServiceId ?? "–"],
  ["Render database", env.renderDbServiceId ?? "–"],
  ["Stats collected", formatDateTime(env.stats?.collectedAt)],
  ["Stats error", env.stats?.errorMessage ?? "None"],
];

export function SiteUsageSection({ env }: SiteUsageSectionProps) {
  const s = env.stats;
  return (
    <div className="flex flex-col gap-4">
      <section className={PROFILE_CARD} aria-label="Usage for last 30 days">
        <div className={PROFILE_CARD_HEAD}>
          <h2 className={PROFILE_CARD_TITLE}>Usage for last 30 days</h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className={PROFILE_TILE}>
            <span className={PROFILE_TILE_LABEL}>Storage</span>
            <span className={PROFILE_TILE_VALUE}>{formatBytes(s?.storageBytes ?? null)}</span>
            <span className="h-6 text-muted-foreground">WordPress files and uploads</span>
          </div>
          <div className={PROFILE_TILE}>
            <span className={PROFILE_TILE_LABEL}>Bandwidth</span>
            <span className={PROFILE_TILE_VALUE}>{formatBytes(s?.bandwidthBytes30d ?? null)}</span>
            <span className="h-6 text-muted-foreground">Render egress</span>
          </div>
          <div className={PROFILE_TILE}>
            <span className={PROFILE_TILE_LABEL}>Visits</span>
            <span className={PROFILE_TILE_VALUE}>{formatCount(s?.visits30d ?? null)}</span>
            <span className="h-6 text-muted-foreground">HTTP requests</span>
          </div>
        </div>
      </section>
      <section className="bg-zinc-900/60" aria-label="Environment details">
        <table className="w-full table-fixed border-collapse text-base">
          <tbody>
            {ROWS(env).map(([label, value]) => (
              <tr key={label} className="border-t border-white/5 first:border-t-0">
                <th scope="row" className={`${PROFILE_TH} w-[14rem]`}>
                  {label}
                </th>
                <td className={`${PROFILE_TD} truncate`} title={value}>
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
