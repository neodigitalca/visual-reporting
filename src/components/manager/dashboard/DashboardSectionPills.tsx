import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { ManagerSettingsClusterId } from "@/components/manager/manager-settings-cluster";
import {
  DASHBOARD_SECTION_LABELS,
  DASHBOARD_SECTION_ORDER,
} from "@/components/manager/dashboard/dashboard-section-labels";
import {
  WORKSPACE_PRIMARY_SELECT_ITEM_CLASS,
  WORKSPACE_PRIMARY_SELECT_MENU_CLASS,
  WORKSPACE_PRIMARY_SELECT_TRIGGER_CLASS,
  workspacePrimarySelectSlotProps,
  workspacePrimarySelectWidthStyle,
} from "@/components/shared/workspace-primary-select-styles";

export type DashboardSectionPillsProps = {
  activeSection: ManagerSettingsClusterId;
  onSectionChange: (id: ManagerSettingsClusterId) => void;
  disabled?: boolean;
  className?: string;
  sectionOrder?: readonly ManagerSettingsClusterId[];
};

export function DashboardSectionPills({
  activeSection,
  onSectionChange,
  disabled = false,
  className,
  sectionOrder = DASHBOARD_SECTION_ORDER,
}: DashboardSectionPillsProps) {
  const visibleSections = sectionOrder;
  const sectionLabels = visibleSections.map((id) => DASHBOARD_SECTION_LABELS[id]);

  const resolvedValue = visibleSections.some((id) => id === activeSection)
    ? activeSection
    : (visibleSections[0] ?? activeSection);

  const activeLabel = DASHBOARD_SECTION_LABELS[resolvedValue];

  const slot = workspacePrimarySelectSlotProps(sectionLabels);
  const menuWidth = workspacePrimarySelectWidthStyle(sectionLabels);

  return (
    <div className={cn(slot.className, className)} style={slot.style}>
      <Select
        value={resolvedValue}
        onValueChange={(id) => {
          const next = id as ManagerSettingsClusterId;
          if (next !== activeSection) onSectionChange(next);
        }}
        disabled={disabled}
      >
        <SelectTrigger
          className={WORKSPACE_PRIMARY_SELECT_TRIGGER_CLASS}
          aria-label="Dashboard section"
        >
          <span className="whitespace-nowrap">{activeLabel}</span>
        </SelectTrigger>
        <SelectContent
          position="popper"
          className={cn(WORKSPACE_PRIMARY_SELECT_MENU_CLASS, "!max-h-none")}
          style={menuWidth}
        >
          {visibleSections.map((id) => (
            <SelectItem key={id} value={id} className={WORKSPACE_PRIMARY_SELECT_ITEM_CLASS}>
              {DASHBOARD_SECTION_LABELS[id]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
