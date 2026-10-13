import { Button } from "@/components/ui/button";
import type { HostedBackup, HostedEnvironment } from "@/lib/hosting-api";
import { MY_SITES_PRIMARY_BTN } from "../my-sites/my-sites-theme";
import { formatBytes } from "../my-sites/my-sites-view-model";
import { formatDateTime } from "./site-profile-view-model";
import { PROFILE_CARD_HEAD, PROFILE_CARD_TITLE, PROFILE_TD, PROFILE_TH } from "./site-profile-theme";

export type SiteBackupsSectionProps = {
  env: HostedEnvironment;
  backups: HostedBackup[];
  loading: boolean;
  canAdmin: boolean;
  onBackupNow: () => void;
};

export function SiteBackupsSection({ env, backups, loading, canAdmin, onBackupNow }: SiteBackupsSectionProps) {
  const provisioned = Boolean(env.renderServiceId);
  return (
    <section className="flex flex-col gap-2" aria-label="Backups">
      <div className={PROFILE_CARD_HEAD}>
        <h2 className={PROFILE_CARD_TITLE}>Backups</h2>
        <Button type="button" className={MY_SITES_PRIMARY_BTN} disabled={!canAdmin || !provisioned} onClick={onBackupNow}>
          Backup now
        </Button>
      </div>
      <div className="min-h-[10rem] bg-zinc-900/60">
        <table className="w-full table-fixed border-collapse text-base">
          <thead className="bg-zinc-900">
            <tr>
              <th className={`${PROFILE_TH} w-[24%]`}>Created</th>
              <th className={`${PROFILE_TH} w-[14%]`}>Status</th>
              <th className={`${PROFILE_TH} w-[12%]`}>Size</th>
              <th className={PROFILE_TH}>Location</th>
            </tr>
          </thead>
          <tbody>
            {backups.length === 0 ? (
              <tr>
                <td className={`${PROFILE_TD} text-muted-foreground`} colSpan={4}>
                  {loading ? "Loading…" : "No backups recorded for this environment."}
                </td>
              </tr>
            ) : null}
            {backups.map((b) => (
              <tr key={b.id} className="border-t border-white/5">
                <td className={`${PROFILE_TD} tabular-nums`}>{formatDateTime(b.createdAt)}</td>
                <td className={`${PROFILE_TD} ${b.status === "completed" ? "text-primary" : b.status === "failed" ? "text-red-300" : "text-muted-foreground"}`} title={b.errorMessage ?? undefined}>
                  {b.status}
                </td>
                <td className={`${PROFILE_TD} tabular-nums`}>{formatBytes(b.sizeBytes)}</td>
                <td className={`${PROFILE_TD} truncate text-muted-foreground`} title={b.storageUri}>
                  {b.storageUri}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
