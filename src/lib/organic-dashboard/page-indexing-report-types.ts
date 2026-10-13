export type PageIndexingReasonRow = {
  reason: string;
  source: string;
  validation: string;
  trend: "flat" | "down" | "up";
  pages: number;
};

export type PageIndexingChartPoint = {
  date: string;
  indexed: number;
  notIndexed: number;
};

export type PageIndexingReport = {
  success: boolean;
  property?: string;
  sitemapUrl: string;
  sitemapTotalUrls: number;
  sampleSize: number;
  indexedCount: number;
  notIndexedCount: number;
  inspectErrors: number;
  reasonCount: number;
  reasons: PageIndexingReasonRow[];
  fetchedAt: string;
  chart: PageIndexingChartPoint[];
  error?: string;
};

export type PageIndexingReportParams = {
  siteUrl: string;
  sitemapUrl: string;
  username?: string;
  appPassword?: string;
  maxUrls?: number;
};
