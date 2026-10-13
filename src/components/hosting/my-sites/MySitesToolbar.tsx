import { Download, Filter, Tag, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { HostedTag } from "@/lib/hosting-api";
import { MySitesFilterPopover } from "./MySitesFilterPopover";
import { activeFilterCount, type MySitesFilters } from "./my-sites-view-model";
import { MY_SITES_COUNT_BADGE, MY_SITES_FIELD, MY_SITES_TOOL_BTN, MY_SITES_TOOLBAR_BAND } from "./my-sites-theme";

export type MySitesToolbarProps = {
  filters: MySitesFilters;
  onFiltersChange: (next: MySitesFilters) => void;
  tags: HostedTag[];
  phpVersions: string[];
  canAdmin: boolean;
  onManageTags: () => void;
  onAddUserToAllSites: () => void;
  onDownloadCsv: () => void;
};

export function MySitesToolbar({
  filters,
  onFiltersChange,
  tags,
  phpVersions,
  canAdmin,
  onManageTags,
  onAddUserToAllSites,
  onDownloadCsv,
}: MySitesToolbarProps) {
  const active = activeFilterCount(filters);
  return (
    <div className={MY_SITES_TOOLBAR_BAND}>
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" className={MY_SITES_TOOL_BTN}>
            <Filter className="h-4 w-4" aria-hidden />
            Filter
            <span className={MY_SITES_COUNT_BADGE}>{active}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 rounded-none border-0 bg-zinc-900 p-3 text-base">
          <MySitesFilterPopover filters={filters} onChange={onFiltersChange} tags={tags} phpVersions={phpVersions} />
        </PopoverContent>
      </Popover>
      <Input
        className={`${MY_SITES_FIELD} w-64`}
        placeholder="Search sites"
        aria-label="Search sites"
        value={filters.query}
        onChange={(e) => onFiltersChange({ ...filters, query: e.target.value })}
      />
      <div className="ml-auto flex items-center gap-2">
        <Button type="button" variant="ghost" className={MY_SITES_TOOL_BTN} disabled={!canAdmin} onClick={onManageTags}>
          <Tag className="h-4 w-4" aria-hidden />
          Manage tags
        </Button>
        <Button type="button" variant="ghost" className={MY_SITES_TOOL_BTN} disabled={!canAdmin} onClick={onAddUserToAllSites}>
          <UserPlus className="h-4 w-4" aria-hidden />
          Add user to all sites
        </Button>
        <Button type="button" variant="ghost" className={MY_SITES_TOOL_BTN} onClick={onDownloadCsv}>
          <Download className="h-4 w-4" aria-hidden />
          CSV
        </Button>
      </div>
    </div>
  );
}
