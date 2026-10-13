import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  generatorTitleRowPrimarySelectMenuWidthStyle,
  generatorTitleRowPrimarySelectSlotProps,
} from "@/components/blog-generator/generator-title-row-select-width";
import {
  WORKSPACE_PRIMARY_SELECT_ITEM_CLASS,
  WORKSPACE_PRIMARY_SELECT_MENU_CLASS,
  WORKSPACE_PRIMARY_SELECT_SLOT_CLASS,
  WORKSPACE_PRIMARY_SELECT_TRIGGER_CLASS,
  sitemapScopeDropdownReserveProps,
} from "@/components/shared/workspace-primary-select-styles";

export type SitemapScopeDropdownOption = {
  id: string;
  label: string;
  disabled?: boolean;
};

export type SitemapScopeDropdownProps = {
  options: SitemapScopeDropdownOption[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
};

/** @deprecated Use {@link sitemapScopeDropdownReserveProps}. */
export const SITEMAP_SCOPE_DROPDOWN_SLOT_CLASS = WORKSPACE_PRIMARY_SELECT_SLOT_CLASS;

export { sitemapScopeDropdownReserveProps };

export function SitemapScopeDropdown({
  options,
  value,
  onChange,
  ariaLabel,
  disabled = false,
  className,
}: SitemapScopeDropdownProps) {
  const enabled = options.filter((o) => !o.disabled);
  const resolvedValue = enabled.some((o) => o.id === value)
    ? value
    : (enabled[0]?.id ?? value);

  const slot = generatorTitleRowPrimarySelectSlotProps();
  const menuWidth = generatorTitleRowPrimarySelectMenuWidthStyle();

  return (
    <div className={slot.className} style={slot.style}>
      <Select value={resolvedValue} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          className={cn(WORKSPACE_PRIMARY_SELECT_TRIGGER_CLASS, className)}
          aria-label={ariaLabel}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          position="popper"
          className={cn(WORKSPACE_PRIMARY_SELECT_MENU_CLASS, "!max-h-none")}
          style={menuWidth}
        >
          {options.map((opt) => (
            <SelectItem
              key={opt.id}
              value={opt.id}
              disabled={opt.disabled}
              className={WORKSPACE_PRIMARY_SELECT_ITEM_CLASS}
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
