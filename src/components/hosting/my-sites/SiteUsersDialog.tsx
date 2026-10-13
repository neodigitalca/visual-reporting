import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { HostedEnvironment } from "@/lib/hosting-api";
import type { TeamMember } from "@/lib/teams-types";
import { SiteUsersPanel } from "./SiteUsersPanel";

export type SiteUsersDialogProps = {
  open: boolean;
  /** Null = add one user to every provisioned site. */
  env: HostedEnvironment | null;
  teamMembers: TeamMember[];
  canAdmin: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SiteUsersDialog({ open, env, teamMembers, canAdmin, onOpenChange }: SiteUsersDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-none bg-zinc-950 p-5 text-base">
        <DialogHeader>
          <DialogTitle className="text-lg text-white">{env ? `Users on ${env.displayName} (${env.environment})` : "Add user to all sites"}</DialogTitle>
        </DialogHeader>
        <SiteUsersPanel env={env} teamMembers={teamMembers} canAdmin={canAdmin} />
        <div className="flex justify-end">
          <Button type="button" variant="ghost" className="h-8 rounded-none" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
