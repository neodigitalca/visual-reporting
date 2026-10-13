import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  BLOG_GENERATOR_SECTION_DEFS,
  getBlogGeneratorSectionMeta,
  type BlogGeneratorSectionId,
} from "@/components/blog-generator/blog-generator-sections";
import {
  generatorTitleRowPrimarySelectMenuWidthStyle,
  generatorTitleRowPrimarySelectSlotProps,
} from "@/components/blog-generator/generator-title-row-select-width";
import {
  WORKSPACE_PRIMARY_SELECT_ITEM_CLASS,
  WORKSPACE_PRIMARY_SELECT_MENU_CLASS,
  WORKSPACE_PRIMARY_SELECT_TRIGGER_CLASS,
} from "@/components/shared/workspace-primary-select-styles";

export type BlogGeneratorSectionPillsProps = {
  activeSection: BlogGeneratorSectionId;
  onSectionChange: (id: BlogGeneratorSectionId) => void;
  disabled?: boolean;
  /** Hide Opt when team lacks content-optimizer permission. */
  showOpt?: boolean;
};

export function BlogGeneratorSectionPills({
  activeSection,
  onSectionChange,
  disabled = false,
  showOpt = true,
}: BlogGeneratorSectionPillsProps) {
  const visibleSections = showOpt
    ? BLOG_GENERATOR_SECTION_DEFS
    : BLOG_GENERATOR_SECTION_DEFS.filter((s) => s.id !== "opt");

  const activeMeta = getBlogGeneratorSectionMeta(activeSection);
  const resolvedValue = visibleSections.some((s) => s.id === activeSection)
    ? activeSection
    : (visibleSections[0]?.id ?? activeSection);

  const slot = generatorTitleRowPrimarySelectSlotProps();
  const menuWidth = generatorTitleRowPrimarySelectMenuWidthStyle();

  return (
    <div className={slot.className} style={slot.style}>
      <Select
        value={resolvedValue}
        onValueChange={(id) => {
          const next = id as BlogGeneratorSectionId;
          if (next !== activeSection) onSectionChange(next);
        }}
        disabled={disabled}
      >
        <SelectTrigger
          className={WORKSPACE_PRIMARY_SELECT_TRIGGER_CLASS}
          aria-label="Generator mode"
        >
          <span className="truncate">{activeMeta.label}</span>
        </SelectTrigger>
        <SelectContent
          position="popper"
          className={cn(WORKSPACE_PRIMARY_SELECT_MENU_CLASS, "!max-h-none")}
          style={menuWidth}
        >
          {visibleSections.map(({ id, label, icon: Icon }) => (
            <SelectItem key={id} value={id} className={WORKSPACE_PRIMARY_SELECT_ITEM_CLASS}>
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
