import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MY_SITES_HEADER_BAND, MY_SITES_PRIMARY_BTN } from "./my-sites-theme";

export type MySitesHeaderProps = {
  canAdmin: boolean;
  onAddSite: () => void;
};

export function MySitesHeader({ canAdmin, onAddSite }: MySitesHeaderProps) {
  return (
    <div className={MY_SITES_HEADER_BAND}>
      <h1 className="text-2xl font-semibold text-white">My Sites</h1>
      <Button type="button" className={MY_SITES_PRIMARY_BTN} disabled={!canAdmin} onClick={onAddSite}>
        <Plus className="h-4 w-4" aria-hidden />
        Add site
      </Button>
    </div>
  );
}
