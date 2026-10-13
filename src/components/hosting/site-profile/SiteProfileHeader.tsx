import { ChevronLeft, Plus, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HostedEnvironment, HostedEnvironmentKind, HostedSiteGroup } from "@/lib/hosting-api";
import { EnvironmentKebabMenu, type EnvironmentAction } from "../my-sites/EnvironmentKebabMenu";
import { ENVIRONMENT_LABEL } from "../my-sites/my-sites-view-model";
import { MY_SITES_LINK, MY_SITES_TOOL_BTN, STATUS_TEXT_CLASS } from "../my-sites/my-sites-theme";
import { PROFILE_ENV_SWITCH_BTN, PROFILE_META_BAND, PROFILE_TITLE_BAND } from "./site-profile-theme";

const ENV_ORDER: HostedEnvironmentKind[] = ["production", "staging", "development"];

export type SiteProfileHeaderProps = {
  group: HostedSiteGroup;
  env: HostedEnvironment;
  canAdmin: boolean;
  onBack: () => void;
  onSelectEnvironment: (env: HostedEnvironment) => void;
  onAddEnvironment: (group: HostedSiteGroup) => void;
  onManageTags: (group: HostedSiteGroup) => void;
  onEnvironmentAction: (action: EnvironmentAction, env: HostedEnvironment) => void;
};

export function SiteProfileHeader({ group, env, canAdmin, onBack, onSelectEnvironment, onAddEnvironment, onManageTags, onEnvironmentAction }: SiteProfileHeaderProps) {
  const domain = env.primaryDomain || (env.siteUrl ? env.siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "") : "");
  const tagNames = group.tags.map((t) => t.name).join(", ");

  return (
    <>
      <div className={PROFILE_TITLE_BAND}>
        <button type="button" className={`${MY_SITES_LINK} inline-flex h-8 shrink-0 items-center gap-1`} onClick={onBack}>
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Sites
        </button>
        <h1 className="min-w-0 truncate text-2xl font-semibold text-white">{group.name}</h1>
        <div className="flex shrink-0 items-center gap-1" role="group" aria-label="Environment">
          {ENV_ORDER.map((kind) => {
            const target = group.environments.find((e) => e.environment === kind);
            return (
              <button
                key={kind}
                type="button"
                className={PROFILE_ENV_SWITCH_BTN}
                data-active={target?.id === env.id}
                disabled={!target}
                onClick={() => target && onSelectEnvironment(target)}
              >
                {ENVIRONMENT_LABEL[kind]}
              </button>
            );
          })}
          <Button type="button" variant="ghost" className={MY_SITES_TOOL_BTN} disabled={!canAdmin} onClick={() => onAddEnvironment(group)}>
            <Plus className="h-4 w-4" aria-hidden />
            Add environment
          </Button>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button type="button" variant="ghost" className={MY_SITES_TOOL_BTN} title={tagNames || "No tags"} disabled={!canAdmin} onClick={() => onManageTags(group)}>
            <Tag className="h-4 w-4" aria-hidden />
            <span className="min-w-[1ch] tabular-nums">{group.tags.length}</span>
          </Button>
          {env.wpAdminUrl ? (
            <a className={`${MY_SITES_TOOL_BTN} inline-flex items-center text-primary`} href={env.wpAdminUrl} target="_blank" rel="noreferrer">
              WP Admin
            </a>
          ) : (
            <span className={`${MY_SITES_TOOL_BTN} inline-flex items-center text-muted-foreground`}>WP Admin</span>
          )}
          <EnvironmentKebabMenu env={env} canAdmin={canAdmin} onAction={onEnvironmentAction} />
        </div>
      </div>
      <div className={PROFILE_META_BAND}>
        <span className="font-medium text-foreground">{env.slug}</span>
        {env.siteUrl ? (
          <a className={MY_SITES_LINK} href={env.siteUrl} target="_blank" rel="noreferrer">
            {domain}
          </a>
        ) : (
          <span>{domain || "Provisioning URL…"}</span>
        )}
        <span className={`min-w-[7rem] truncate ${STATUS_TEXT_CLASS[env.status]}`} title={env.statusMessage ?? undefined}>
          {env.statusMessage ?? env.status}
        </span>
        <span>{env.region}</span>
      </div>
    </>
  );
}
