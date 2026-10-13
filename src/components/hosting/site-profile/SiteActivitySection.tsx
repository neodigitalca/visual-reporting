import { useMemo } from "react";
import type { HostedSiteActivity } from "@/lib/hosting-api";
import { activityTimeline, formatDateTime, type ActivityKind } from "./site-profile-view-model";
import { PROFILE_CARD_HEAD, PROFILE_CARD_TITLE, PROFILE_TD, PROFILE_TH } from "./site-profile-theme";

export type SiteActivitySectionProps = {
  activity: HostedSiteActivity | null;
  loading: boolean;
};

const KIND_LABEL: Record<ActivityKind, string> = { job: "Job", deploy: "Deploy", backup: "Backup", audit: "Audit" };

function statusClass(status: string): string {
  if (status === "completed" || status === "live") return "text-primary";
  if (status === "failed") return "text-red-300";
  if (status === "running" || status === "queued" || status === "triggered") return "text-sky-300";
  return "text-muted-foreground";
}

export function SiteActivitySection({ activity, loading }: SiteActivitySectionProps) {
  const rows = useMemo(() => (activity ? activityTimeline(activity) : []), [activity]);
  return (
    <section className="flex flex-col gap-2" aria-label="Activity">
      <div className={PROFILE_CARD_HEAD}>
        <h2 className={PROFILE_CARD_TITLE}>Activity</h2>
        <span className="tabular-nums text-muted-foreground">{rows.length} entries</span>
      </div>
      <div className="min-h-[10rem] bg-zinc-900/60">
        <table className="w-full table-fixed border-collapse text-base">
          <thead className="bg-zinc-900">
            <tr>
              <th className={`${PROFILE_TH} w-[22%]`}>When</th>
              <th className={`${PROFILE_TH} w-[10%]`}>Type</th>
              <th className={`${PROFILE_TH} w-[20%]`}>Event</th>
              <th className={`${PROFILE_TH} w-[14%]`}>Status</th>
              <th className={PROFILE_TH}>Detail</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className={`${PROFILE_TD} text-muted-foreground`} colSpan={5}>
                  {loading ? "Loading…" : "No activity recorded for this environment yet."}
                </td>
              </tr>
            ) : null}
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-white/5">
                <td className={`${PROFILE_TD} tabular-nums`}>{formatDateTime(r.at)}</td>
                <td className={`${PROFILE_TD} text-muted-foreground`}>{KIND_LABEL[r.kind]}</td>
                <td className={`${PROFILE_TD} truncate`} title={r.label}>
                  {r.label}
                </td>
                <td className={`${PROFILE_TD} ${statusClass(r.status)}`}>{r.status}</td>
                <td className={`${PROFILE_TD} truncate text-muted-foreground`} title={r.detail || undefined}>
                  {r.detail}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
