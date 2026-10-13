import { ORGANIC_DASHBOARD_GRID_BACKDROP_CLASS } from "@/components/organic-dashboard/organic-dashboard-styles";

export function OrganicDashboardHeroBackdrop() {
  return (
    <div className={`organic-dashboard-hero-backdrop ${ORGANIC_DASHBOARD_GRID_BACKDROP_CLASS}`} aria-hidden>
      <div
        className="absolute left-1/2 top-0 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[hsl(var(--neo-pulse-glow)/0.08)] blur-3xl"
        aria-hidden
      />
    </div>
  );
}
