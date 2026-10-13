import { useCallback, useEffect, useMemo, useState } from "react";
import { SEO_WORKSPACE_BODY_SCROLL_CLASS, SEO_WORKSPACE_SHELL_CLASS } from "@/components/seo/seo-workspace-layout";
import { useTeam } from "@/contexts/TeamContext";
import {
  clearHostedSiteCache,
  deleteHostedEnvironment,
  fetchHostedSiteGroups,
  retryHostedSiteProvision,
  triggerHostedSiteBackup,
  triggerHostedSiteDeploy,
  type HostedEnvironment,
  type HostedSiteGroup,
  type HostedTag,
} from "@/lib/hosting-api";
import { cn } from "@/lib/utils";
import { AddSiteDialog } from "./my-sites/AddSiteDialog";
import type { EnvironmentAction } from "./my-sites/EnvironmentKebabMenu";
import { InventoryTable } from "./my-sites/InventoryTable";
import { ManageTagsDialog } from "./my-sites/ManageTagsDialog";
import { MySitesHeader } from "./my-sites/MySitesHeader";
import { MySitesTabs } from "./my-sites/MySitesTabs";
import { MySitesToolbar } from "./my-sites/MySitesToolbar";
import { SiteGroupCard } from "./my-sites/SiteGroupCard";
import {
  EMPTY_FILTERS,
  csvForGroups,
  filterGroups,
  inventoryRows,
  phpVersionOptions,
  tabCounts,
  type MySitesFilters,
  type MySitesTab,
} from "./my-sites/my-sites-view-model";
import { MY_SITES_CARD, MY_SITES_STATUS_LINE } from "./my-sites/my-sites-theme";

type DialogState = { kind: "none" } | { kind: "add"; group: HostedSiteGroup | null } | { kind: "tags"; group: HostedSiteGroup | null };

/** Pulse Host "My Sites": Pulse dark theme, Render-hosted sites only. */
export function PulseHostTabContent() {
  const { activeTeam, permissions } = useTeam();
  const canAdmin = Boolean(permissions?.hosting?.write);
  const [groups, setGroups] = useState<HostedSiteGroup[]>([]);
  const [tags, setTags] = useState<HostedTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState<MySitesTab>("all");
  const [filters, setFilters] = useState<MySitesFilters>(EMPTY_FILTERS);
  const [dialog, setDialog] = useState<DialogState>({ kind: "none" });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchHostedSiteGroups();
    setLoading(false);
    if (res.ok === false) {
      setError(res.error);
      return;
    }
    setError("");
    setGroups(res.groups);
    setTags(res.tags);
  }, []);

  useEffect(() => {
    void load();
  }, [load, activeTeam?.id]);

  const counts = useMemo(() => tabCounts(groups), [groups]);
  const visible = useMemo(() => filterGroups(groups, tab, filters), [groups, tab, filters]);
  const phpVersions = useMemo(() => phpVersionOptions(groups), [groups]);

  async function onEnvironmentAction(action: EnvironmentAction, env: HostedEnvironment) {
    if (action === "copy") {
      const group = groups.find((g) => g.id === env.groupId) ?? null;
      setDialog({ kind: "add", group });
      return;
    }
    if (action === "delete") {
      const confirmed = window.confirm(`Delete ${env.slug}? This removes the Render services and all data for this environment.`);
      if (!confirmed) return;
    }
    const call =
      action === "backup"
        ? triggerHostedSiteBackup
        : action === "cache-clear"
          ? clearHostedSiteCache
          : action === "redeploy"
            ? triggerHostedSiteDeploy
            : action === "retry-provision"
              ? retryHostedSiteProvision
              : deleteHostedEnvironment;
    setNotice(`${env.slug}: working…`);
    const res = await call(env.id);
    if (res.ok === false) {
      setNotice(`${env.slug}: ${res.error}`);
      return;
    }
    setNotice(`${env.slug}: ${action.replace("-", " ")} started.`);
    await load();
  }

  function downloadCsv() {
    const blob = new Blob([csvForGroups(visible)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pulse-host-sites.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const inventoryTab = tab === "plugins" || tab === "themes";

  return (
    <div className={cn(SEO_WORKSPACE_SHELL_CLASS, "font-sans text-base")}>
      <MySitesHeader canAdmin={canAdmin} onAddSite={() => setDialog({ kind: "add", group: null })} />
      <MySitesTabs active={tab} counts={counts} onChange={setTab} />
      <MySitesToolbar
        filters={filters}
        onFiltersChange={setFilters}
        tags={tags}
        phpVersions={phpVersions}
        canAdmin={canAdmin}
        onManageTags={() => setDialog({ kind: "tags", group: null })}
        onDownloadCsv={downloadCsv}
      />
      <p className={cn(MY_SITES_STATUS_LINE, error ? "text-red-300" : "")} title={error || notice || undefined}>
        <span className="truncate">{error || notice}</span>
      </p>
      <div className={cn(SEO_WORKSPACE_BODY_SCROLL_CLASS, "flex flex-col gap-3 pb-4")}>
        {inventoryTab ? (
          <InventoryTable kind={tab === "plugins" ? "plugins" : "themes"} rows={inventoryRows(visible, tab === "plugins" ? "plugins" : "themes")} loading={loading} />
        ) : null}
        {!inventoryTab && loading && groups.length === 0 ? (
          <div className={cn(MY_SITES_CARD, "h-32 animate-pulse")} aria-busy />
        ) : null}
        {!inventoryTab && !loading && visible.length === 0 ? (
          <div className={cn(MY_SITES_CARD, "flex h-32 items-center justify-center text-muted-foreground")}>
            {groups.length === 0 ? "No hosted sites yet. Use Add site to provision your first WordPress environment." : "No sites match the current tab and filters."}
          </div>
        ) : null}
        {!inventoryTab
          ? visible.map((group) => (
              <SiteGroupCard
                key={group.id}
                group={group}
                canAdmin={canAdmin}
                onAddEnvironment={(g) => setDialog({ kind: "add", group: g })}
                onManageTags={(g) => setDialog({ kind: "tags", group: g })}
                onEnvironmentAction={(action, env) => void onEnvironmentAction(action, env)}
              />
            ))
          : null}
      </div>
      <AddSiteDialog
        open={dialog.kind === "add"}
        group={dialog.kind === "add" ? dialog.group : null}
        onOpenChange={(open) => !open && setDialog({ kind: "none" })}
        onCreated={() => void load()}
      />
      <ManageTagsDialog
        open={dialog.kind === "tags"}
        tags={tags}
        group={dialog.kind === "tags" ? dialog.group : null}
        onOpenChange={(open) => !open && setDialog({ kind: "none" })}
        onChanged={() => void load()}
      />
    </div>
  );
}
