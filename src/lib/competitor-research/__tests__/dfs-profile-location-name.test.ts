import { describe, expect, it } from "vitest";
import { profileGeoToDataForSeoLocationName } from "@/lib/competitor-research/dfs-profile-location-name";
import type { ProfileMapsGeo } from "@/lib/competitor-research/discover-competitor-places-from-dfs";

function geo(partial: Partial<ProfileMapsGeo>): ProfileMapsGeo {
  return {
    city: "",
    region: "",
    postalCode: "",
    countryCode: "",
    cityRegionLabel: "",
    ...partial,
  };
}

describe("profileGeoToDataForSeoLocationName", () => {
  it("formats Edmonton AB Canada", () => {
    expect(
      profileGeoToDataForSeoLocationName(
        geo({ city: "Edmonton", region: "AB", countryCode: "CA" }),
      ),
    ).toBe("Edmonton,Alberta,Canada");
  });

  it("formats US city with state code", () => {
    expect(
      profileGeoToDataForSeoLocationName(
        geo({ city: "Austin", region: "TX", countryCode: "US" }),
      ),
    ).toBe("Austin,Texas,United States");
  });

  it("throws when city and region are both empty", () => {
    expect(() => profileGeoToDataForSeoLocationName(geo({ countryCode: "CA" }))).toThrow(
      /Integrations profile/i,
    );
  });

  it("rejects street-style labels", () => {
    expect(() =>
      profileGeoToDataForSeoLocationName(
        geo({
          city: "123 Main St",
          region: "AB",
          countryCode: "CA",
        }),
      ),
    ).toThrow(/valid DataForSEO city label/i);
  });
});
