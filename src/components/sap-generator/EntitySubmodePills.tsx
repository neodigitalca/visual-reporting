import { MapPin, Swords } from "lucide-react";
import { WorkspacePill } from "@/components/shared/WorkspacePill";
import type { EntityGeneratorSubmode } from "@/components/sap-generator/entity-generator-submode";

export type EntitySubmodePillsProps = {
  submode: EntityGeneratorSubmode;
  onSubmodeChange: (mode: EntityGeneratorSubmode) => void;
  disabled?: boolean;
};

export function EntitySubmodePills({
  submode,
  onSubmodeChange,
  disabled = false,
}: EntitySubmodePillsProps) {
  return (
    <div className="flex min-w-0 flex-nowrap items-center gap-1" aria-label="Entities mode">
      <WorkspacePill
        label="Locations"
        icon={MapPin}
        active={submode === "locations"}
        disabled={disabled}
        onClick={() => {
          if (submode !== "locations") onSubmodeChange("locations");
        }}
      />
      <WorkspacePill
        label="Competitors"
        icon={Swords}
        active={submode === "competitors"}
        disabled={disabled}
        onClick={() => {
          if (submode !== "competitors") onSubmodeChange("competitors");
        }}
      />
    </div>
  );
}
