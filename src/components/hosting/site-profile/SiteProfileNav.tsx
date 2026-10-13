import { SITE_PROFILE_SECTIONS, SITE_PROFILE_SECTION_LABEL, type SiteProfileSection } from "@/lib/hosting/pulse-host-hash";
import { PROFILE_NAV, PROFILE_NAV_BTN } from "./site-profile-theme";

export type SiteProfileNavProps = {
  active: SiteProfileSection;
  onChange: (section: SiteProfileSection) => void;
};

export function SiteProfileNav({ active, onChange }: SiteProfileNavProps) {
  return (
    <nav className={PROFILE_NAV} aria-label="Site sections">
      {SITE_PROFILE_SECTIONS.map((section) => (
        <button key={section} type="button" className={PROFILE_NAV_BTN} data-active={section === active} onClick={() => onChange(section)}>
          {SITE_PROFILE_SECTION_LABEL[section]}
        </button>
      ))}
    </nav>
  );
}
