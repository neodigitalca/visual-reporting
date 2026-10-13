import type { ReactNode } from "react";
import { LineChart } from "lucide-react";
import { UnifiedWorkspaceChrome } from "@/components/shared/UnifiedWorkspaceChrome";
import { OrganicDashboardToolbar, type OrganicDashboardToolbarProps } from "@/components/organic-dashboard/OrganicDashboardToolbar";

export type OrganicDashboardWorkspaceHeaderProps = OrganicDashboardToolbarProps & {
  workspaceBusy: boolean;
  titleRowMenu?: ReactNode;
};

export function OrganicDashboardWorkspaceHeader({
  workspaceBusy,
  titleRowMenu,
  ...toolbar
}: OrganicDashboardWorkspaceHeaderProps) {
  return (
    <div className="no-print w-full min-w-0 shrink-0">
    <UnifiedWorkspaceChrome
      icon={LineChart}
      iconClassName="text-primary"
      title="Reporting"
      titleRowMenu={titleRowMenu}
      toolbar={<OrganicDashboardToolbar {...toolbar} />}
      workspaceBusy={workspaceBusy}
      progressBand="empty"
    />
    </div>
  );
}
