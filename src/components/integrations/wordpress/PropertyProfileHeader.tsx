import { ChevronLeft, ExternalLink, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MY_SITES_LINK, MY_SITES_TOOL_BTN } from "@/components/hosting/my-sites/my-sites-theme";
import { PROFILE_META_BAND, PROFILE_TITLE_BAND } from "@/components/hosting/site-profile/site-profile-theme";
import { wordpressSiteDisplayName } from "@/lib/wordpress-site-display-name";
import { getPublicSiteUrl } from "@/lib/wordpress-site-public-url";
import type { WordPressSite } from "../types";
import { formatLastTested, propertyConnectionTone } from "./property-profile-view-model";
import { wordpressSiteDomainLabel } from "./wordpress-site-domain-label";

const META_SEP = <span className="text-white/20" aria-hidden>·</span>;

export type PropertyProfileHeaderProps = {
  site: WordPressSite;
  onBack: () => void;
  onOpenTags: () => void;
};

export function PropertyProfileHeader({ site, onBack, onOpenTags }: PropertyProfileHeaderProps) {
  const tone = propertyConnectionTone(site);
  const publicUrl = getPublicSiteUrl(site);
  const domain = publicUrl ? wordpressSiteDomainLabel(publicUrl) : "";
  const wpAdminUrl = site.siteUrl?.trim() ? `${site.siteUrl.trim().replace(/\/$/, "")}/wp-admin/` : "";
  const tagCount = site.profileTags?.length ?? 0;

  return (
    <>
      <div className={PROFILE_TITLE_BAND}>
        <button type="button" className="inline-flex h-8 shrink-0 items-center gap-1 text-muted-foreground hover:text-foreground" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Properties
        </button>
        <span className="h-5 w-px shrink-0 bg-white/10" aria-hidden />
        <h1 className="min-w-0 truncate text-2xl font-semibold tracking-tight text-white">{wordpressSiteDisplayName(site)}</h1>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button type="button" variant="ghost" className={MY_SITES_TOOL_BTN} title={site.profileTags?.join(", ") || "No tags"} onClick={onOpenTags}>
            <Tag className="h-4 w-4" aria-hidden />
            <span className="min-w-[1ch] tabular-nums">{tagCount}</span>
          </Button>
          {wpAdminUrl ? (
            <a className={`${MY_SITES_TOOL_BTN} inline-flex items-center text-primary`} href={wpAdminUrl} target="_blank" rel="noreferrer">
              WP Admin
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          ) : (
            <span className={`${MY_SITES_TOOL_BTN} inline-flex items-center text-muted-foreground`}>WP Admin</span>
          )}
        </div>
      </div>
      <div className={PROFILE_META_BAND}>
        <span className="inline-flex items-center gap-2">
          <span className={`h-2 w-2 shrink-0 ${tone.dot}`} aria-hidden />
          <span className={`truncate ${tone.text}`}>{tone.label}</span>
        </span>
        {META_SEP}
        {publicUrl ? (
          <a className={`${MY_SITES_LINK} truncate`} href={publicUrl} target="_blank" rel="noreferrer">
            {domain}
          </a>
        ) : (
          <span className="truncate">No URL</span>
        )}
        {META_SEP}
        <span className="truncate">Last tested {formatLastTested(site.lastTested)}</span>
      </div>
    </>
  );
}
