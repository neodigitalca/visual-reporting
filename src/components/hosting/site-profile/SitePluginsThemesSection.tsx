import { useMemo } from "react";
import type { HostedEnvironment, HostedSiteGroup } from "@/lib/hosting-api";
import { InventoryTable } from "../my-sites/InventoryTable";
import { inventoryRows } from "../my-sites/my-sites-view-model";
import { PROFILE_CARD_TITLE } from "./site-profile-theme";

export type SitePluginsThemesSectionProps = {
  group: HostedSiteGroup;
  env: HostedEnvironment;
};

export function SitePluginsThemesSection({ group, env }: SitePluginsThemesSectionProps) {
  const scoped = useMemo(() => [{ ...group, environments: [env] }], [group, env]);
  const plugins = useMemo(() => inventoryRows(scoped, "plugins"), [scoped]);
  const themes = useMemo(() => inventoryRows(scoped, "themes"), [scoped]);
  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-2" aria-label="Plugins">
        <h2 className={PROFILE_CARD_TITLE}>Plugins ({plugins.length})</h2>
        <InventoryTable kind="plugins" rows={plugins} loading={false} />
      </section>
      <section className="flex flex-col gap-2" aria-label="Themes">
        <h2 className={PROFILE_CARD_TITLE}>Themes ({themes.length})</h2>
        <InventoryTable kind="themes" rows={themes} loading={false} />
      </section>
    </div>
  );
}
