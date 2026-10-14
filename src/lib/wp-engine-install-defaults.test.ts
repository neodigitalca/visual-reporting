import { describe, expect, it } from "vitest";
import type { WordPressSite } from "@/components/integrations/types";
import { WP_ENGINE_ACCOUNT_ID, applyWpEngineHostingDefaults } from "./wp-engine-install-defaults";

const base = { id: "1", name: "x", username: "", appPassword: "", connectedAt: 0 } as unknown as WordPressSite;

describe("applyWpEngineHostingDefaults", () => {
  it("fills install and account ID for a known host", () => {
    const next = applyWpEngineHostingDefaults({ ...base, siteUrl: "https://www.shutterspot.com/" });
    expect(next.wpEngineInstall).toBe("shuterspot");
    expect(next.wpEngineAccountId).toBe(WP_ENGINE_ACCOUNT_ID);
  });

  it("leaves unknown hosts and blank URLs untouched", () => {
    const unknown = { ...base, siteUrl: "https://ejhdistribution.com/" };
    expect(applyWpEngineHostingDefaults(unknown)).toBe(unknown);
    const blank = { ...base, siteUrl: "" };
    expect(applyWpEngineHostingDefaults(blank)).toBe(blank);
  });

  it("never overwrites an existing account ID or install", () => {
    const set = { ...base, siteUrl: "https://blindmagic.com", wpEngineInstall: "blindmagic1stg", wpEngineAccountId: "other" };
    expect(applyWpEngineHostingDefaults(set)).toBe(set);
  });
});
