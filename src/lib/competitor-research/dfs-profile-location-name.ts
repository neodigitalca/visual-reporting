import { dataForSeoCountryNameFromRegion } from "@/lib/grid-entity-hint-breadth";
import { isLikelyDataForSeoGmbLocationName } from "@/lib/local-strategy-research/local-strategy-gmb-fetch";
import type { ProfileMapsGeo } from "@/lib/competitor-research/discover-competitor-places-from-dfs";

const ISO2_TO_COUNTRY_NAME: Record<string, string> = {
  CA: "Canada",
  US: "United States",
  GB: "United Kingdom",
  AU: "Australia",
  NZ: "New Zealand",
};

const CA_REGION_CODE_TO_NAME: Record<string, string> = {
  AB: "Alberta",
  BC: "British Columbia",
  MB: "Manitoba",
  NB: "New Brunswick",
  NL: "Newfoundland and Labrador",
  NS: "Nova Scotia",
  NT: "Northwest Territories",
  NU: "Nunavut",
  ON: "Ontario",
  PE: "Prince Edward Island",
  QC: "Quebec",
  SK: "Saskatchewan",
  YT: "Yukon",
};

const US_REGION_CODE_TO_NAME: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  DC: "District of Columbia",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
};

function expandRegionLabel(region: string, countryCode: string): string {
  const r = region.trim();
  if (!r) return "";
  if (r.length === 2 && /^[A-Za-z]{2}$/.test(r)) {
    const upper = r.toUpperCase();
    const cc = countryCode.trim().toUpperCase();
    if (cc === "CA" || (!cc && dataForSeoCountryNameFromRegion(r) === "Canada")) {
      return CA_REGION_CODE_TO_NAME[upper] ?? r;
    }
    if (cc === "US" || dataForSeoCountryNameFromRegion(r) === "United States") {
      return US_REGION_CODE_TO_NAME[upper] ?? r;
    }
  }
  return r;
}

function countryNameFromProfile(geo: ProfileMapsGeo): string {
  const cc = geo.countryCode.trim().toUpperCase();
  if (cc && ISO2_TO_COUNTRY_NAME[cc]) return ISO2_TO_COUNTRY_NAME[cc]!;
  const fromRegion = dataForSeoCountryNameFromRegion(geo.region);
  if (fromRegion) return fromRegion;
  throw new Error(
    "Could not resolve country for DataForSEO location. Set country on the Integrations profile location.",
  );
}

/**
 * DataForSEO SERP/Maps `location_name` from Integrations profile geo (City,Region,Country).
 */
export function profileGeoToDataForSeoLocationName(geo: ProfileMapsGeo): string {
  const city = geo.city.trim();
  const regionExpanded = expandRegionLabel(geo.region, geo.countryCode);
  const country = countryNameFromProfile(geo);

  if (!city && !regionExpanded) {
    throw new Error("Set a business city in Integrations profile settings.");
  }

  const parts = [city, regionExpanded, country].filter(Boolean);
  const locationName = parts.join(",");

  if (!isLikelyDataForSeoGmbLocationName(locationName)) {
    throw new Error(
      "Integrations location is not a valid DataForSEO city label. Use city and region, not a street address.",
    );
  }

  return locationName;
}
