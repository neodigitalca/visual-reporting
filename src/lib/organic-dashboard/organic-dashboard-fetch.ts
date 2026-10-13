import { loadSemrushApiKeyForAppRequests } from "@/lib/api";
import { BACKEND_API_BASE } from "@/lib/wordpress-api/connection";
import type {
  OrganicDashboardBundleResponse,
  OrganicDashboardFetchParams,
} from "@/lib/organic-dashboard/organic-dashboard-types";

function organicDashboardRequestHeaders(): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const key = loadSemrushApiKeyForAppRequests();
  if (key) {
    headers["X-Semrush-Api-Key"] = key;
  }
  return headers;
}

export async function fetchOrganicDashboardBundle(
  params: OrganicDashboardFetchParams,
): Promise<OrganicDashboardBundleResponse> {
  const response = await fetch(`${BACKEND_API_BASE}/api/organic-dashboard/fetch`, {
    method: "POST",
    credentials: "include",
    headers: organicDashboardRequestHeaders(),
    body: JSON.stringify(params),
  });

  const data = (await response.json().catch(() => ({}))) as OrganicDashboardBundleResponse & {
    error?: string;
  };

  if (!response.ok || data.success === false) {
    const message =
      typeof data.error === "string" && data.error.trim()
        ? data.error.trim()
        : `Organic dashboard HTTP ${response.status}`;
    throw new Error(message);
  }

  return data;
}
