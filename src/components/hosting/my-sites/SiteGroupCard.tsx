import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, Settings, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HostedEnvironment, HostedSiteGroup } from "@/lib/hosting-api";
import { EnvironmentRow } from "./EnvironmentRow";
import type { EnvironmentAction } from "./EnvironmentKebabMenu";
import { HOST_DIVIDER, MY_SITES_CARD, MY_SITES_CARD_HEADER, MY_SITES_ICON_BTN } from "./my-sites-theme";

export type SiteGroupCardProps = {
  group: HostedSiteGroup;
  canAdmin: boolean;
  onAddEnvironment: (group: HostedSiteGroup) => void;
  onManageTags: (group: HostedSiteGroup) => void;
  onEnvironmentAction: (action: EnvironmentAction, env: HostedEnvironment) => void;
  onOpenSite: (group: HostedSiteGroup, env: HostedEnvironment | null) => void;
};

export function SiteGroupCard({ group, canAdmin, onAddEnvironment, onManageTags, onEnvironmentAction, onOpenSite }: SiteGroupCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [first, ...rest] = group.environments;
  const tagNames = group.tags.map((t) => t.name).join(", ");

  return (
    <section className={MY_SITES_CARD} aria-label={group.name}>
      <header className={MY_SITES_CARD_HEADER}>
        <h2 className="min-w-0 truncate text-lg font-semibold tracking-tight">
          <button type="button" className="max-w-full truncate text-left text-white hover:text-primary" onClick={() => onOpenSite(group, null)}>
            {group.name}
          </button>
        </h2>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            className={MY_SITES_ICON_BTN}
            aria-label={`Add environment to ${group.name}`}
            disabled={!canAdmin}
            onClick={() => onAddEnvironment(group)}
          >
            <Copy className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={`${MY_SITES_ICON_BTN} w-auto gap-1 px-2`}
            aria-label={`Tags for ${group.name}`}
            title={tagNames || "No tags"}
            disabled={!canAdmin}
            onClick={() => onManageTags(group)}
          >
            <Tag className="h-4 w-4" aria-hidden />
            <span className="min-w-[1ch] tabular-nums">{group.tags.length}</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={MY_SITES_ICON_BTN}
            aria-label={`Settings for ${group.name}`}
            disabled={!canAdmin}
            onClick={() => onManageTags(group)}
          >
            <Settings className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </header>
      {first ? <EnvironmentRow env={first} canAdmin={canAdmin} onAction={onEnvironmentAction} onOpen={(env) => onOpenSite(group, env)} /> : null}
      {expanded
        ? rest.map((env) => <EnvironmentRow key={env.id} env={env} canAdmin={canAdmin} onAction={onEnvironmentAction} onOpen={(e) => onOpenSite(group, e)} />)
        : null}
      {rest.length > 0 ? (
        <div className={`flex h-10 shrink-0 items-center justify-center border-t ${HOST_DIVIDER}`}>
          <Button
            type="button"
            variant="ghost"
            className="h-7 gap-1 rounded-none px-3 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Show less" : `Show (${rest.length}) more`}
            {expanded ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
