import type { InventoryRow } from "./my-sites-view-model";
import { ENVIRONMENT_LABEL } from "./my-sites-view-model";
import { ENV_PILL_CLASS, MY_SITES_STAT_VALUE } from "./my-sites-theme";

export type InventoryTableProps = {
  kind: "plugins" | "themes";
  rows: InventoryRow[];
  loading: boolean;
};

const TH = "h-10 px-3 text-left font-semibold text-muted-foreground";
const TD = "h-10 px-3";

export function InventoryTable({ kind, rows, loading }: InventoryTableProps) {
  const label = kind === "plugins" ? "Plugin" : "Theme";
  return (
    <div className="bg-zinc-900/60">
      <table className="w-full table-fixed border-collapse text-base">
        <thead className="bg-zinc-900">
          <tr>
            <th className={`${TH} w-[28%]`}>{label}</th>
            <th className={`${TH} w-[22%]`}>Site</th>
            <th className={`${TH} w-[10%]`}>Env</th>
            <th className={`${TH} w-[12%]`}>Version</th>
            <th className={`${TH} w-[14%]`}>Update</th>
            <th className={`${TH} w-[14%]`}>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className={`${TD} text-muted-foreground`} colSpan={6}>
                {loading ? "Loading…" : `No ${kind} reported yet. Stats arrive after the first health check.`}
              </td>
            </tr>
          ) : null}
          {rows.map((row) => (
            <tr key={`${row.envId}-${row.slug}`} className="border-t border-white/5">
              <td className={`${TD} truncate`} title={row.name}>
                {row.name}
              </td>
              <td className={`${TD} truncate`}>{row.siteName}</td>
              <td className={TD}>
                <span className={ENV_PILL_CLASS[row.environment]}>{ENVIRONMENT_LABEL[row.environment]}</span>
              </td>
              <td className={`${TD} tabular-nums`}>{row.version || "–"}</td>
              <td className={`${TD} tabular-nums ${row.updateVersion ? "text-amber-200" : "text-muted-foreground"}`}>
                {row.updateVersion ?? "Up to date"}
              </td>
              <td className={`${TD} ${row.active ? MY_SITES_STAT_VALUE : "text-muted-foreground"}`}>{row.active ? "Active" : "Inactive"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
