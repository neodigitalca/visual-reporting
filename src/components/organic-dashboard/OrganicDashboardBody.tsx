import { OrganicGa4Section } from "@/components/organic-dashboard/OrganicGa4Section";
import { OrganicGscSection } from "@/components/organic-dashboard/OrganicGscSection";
import { OrganicSemrushSection } from "@/components/organic-dashboard/OrganicSemrushSection";
import { OrganicDashboardHeroBackdrop } from "@/components/organic-dashboard/OrganicDashboardHeroBackdrop";
import { OrganicDashboardSkeleton } from "@/components/organic-dashboard/OrganicDashboardSkeleton";
import { ORGANIC_DASHBOARD_SCROLL_CLASS } from "@/components/organic-dashboard/organic-dashboard-styles";
import type { OrganicDashboardViewModel } from "@/lib/organic-dashboard/organic-dashboard-view-model";

export type OrganicDashboardBodyProps = {
  loading: boolean;
  viewModel: OrganicDashboardViewModel;
  showCompare: boolean;
};

export function OrganicDashboardBody({
  loading,
  viewModel,
  showCompare,
}: OrganicDashboardBodyProps) {
  if (loading) {
    return (
      <div className={ORGANIC_DASHBOARD_SCROLL_CLASS}>
        <OrganicDashboardHeroBackdrop />
        <div className="relative z-[1]">
          <OrganicDashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className={ORGANIC_DASHBOARD_SCROLL_CLASS}>
      <OrganicDashboardHeroBackdrop />
      <div className="relative z-[1] flex flex-col gap-6">
        <OrganicGa4Section
          tableRows={viewModel.ga4Table}
          chartPoints={viewModel.ga4MonthlyChart}
          periodLabels={viewModel.periodLabels}
          showCompare={showCompare}
        />
        <OrganicGscSection
          summary={viewModel.gscSummary}
          queries={viewModel.gscQueries}
          trendDaily={viewModel.gscTrendDaily}
          trendMonthly={viewModel.gscTrendMonthly}
          periodLabels={viewModel.periodLabels}
          showCompare={showCompare}
        />
        <OrganicSemrushSection
          summary={viewModel.semrushSummary}
          keywords={viewModel.semrushKeywords}
          trend={viewModel.semrushTrend}
          overviewUrl={viewModel.semrushOverviewUrl}
          periodLabels={viewModel.periodLabels}
          showCompare={showCompare}
        />
      </div>
    </div>
  );
}
