import type { WordPressSite } from "@/components/integrations/types";
import { siteHostLabel } from "./wp-engine-install-defaults";

/** First hostname label (www stripped) -> GA4 property ID, from the Neo Digital GA4 account. */
export const GA4_PROPERTY_ID_BY_HOST_LABEL: Record<string, string> = {
  blindmagic: "289673706",
  eliteshadings: "555143777",
  kwbllp: "399539045",
  lindseyblindsetc: "552228616",
  neodigital: "371746651",
  phoenixpainting: "368800948",
  "posh-outdoors": "506436710",
  superiorblinds: "500408917",
  superiortentrentals: "502092347",
  youjunkit: "313046173",
};

/** Fill GA4 property ID for known hosts; never overwrites an existing value. */
export function applyGa4PropertyIdDefaults(site: WordPressSite): WordPressSite {
  if (site.ga4PropertyId?.trim()) return site;
  const id = GA4_PROPERTY_ID_BY_HOST_LABEL[siteHostLabel(site)];
  if (!id) return site;
  return { ...site, ga4PropertyId: id };
}
