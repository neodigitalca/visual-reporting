import { describe, expect, it } from "vitest";
import type { WordPressSite } from "@/components/integrations/types";
import { applyGa4PropertyIdDefaults } from "./ga4-property-id-defaults";

const base = { id: "1", name: "x", username: "", appPassword: "", connectedAt: 0 } as unknown as WordPressSite;

describe("applyGa4PropertyIdDefaults", () => {
  it("fills the GA4 property ID for a known host", () => {
    expect(applyGa4PropertyIdDefaults({ ...base, siteUrl: "https://lindseyblindsetc.com/" }).ga4PropertyId).toBe("552228616");
    expect(applyGa4PropertyIdDefaults({ ...base, siteUrl: "https://posh-outdoors.com" }).ga4PropertyId).toBe("506436710");
  });

  it("skips unknown hosts and blank URLs", () => {
    const unknown = { ...base, siteUrl: "https://blindswest.ca" };
    expect(applyGa4PropertyIdDefaults(unknown)).toBe(unknown);
    const blank = { ...base, siteUrl: "" };
    expect(applyGa4PropertyIdDefaults(blank)).toBe(blank);
  });

  it("never overwrites an existing ID", () => {
    const set = { ...base, siteUrl: "https://superiorblinds.com", ga4PropertyId: "1" };
    expect(applyGa4PropertyIdDefaults(set)).toBe(set);
  });
});
