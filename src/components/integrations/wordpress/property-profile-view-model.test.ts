import { describe, expect, it } from "vitest";
import type { WordPressSite } from "../types";
import { propertyConnectionStatusTone, propertyHostingLabel, propertyWpAdminUrl } from "./property-profile-view-model";

const base: WordPressSite = {
  id: "wp-1",
  name: "Blind Magic",
  siteUrl: "https://blindmagic.com/",
  username: "u",
  appPassword: "p",
  connectedAt: 0,
};

describe("property-profile-view-model", () => {
  it("labels hosting from the WP Engine account id", () => {
    expect(propertyHostingLabel(base)).toBe("Pulse Host");
    expect(propertyHostingLabel({ ...base, wpEngineAccountId: "   " })).toBe("Pulse Host");
    expect(propertyHostingLabel({ ...base, wpEngineAccountId: "ed80c554" })).toBe("WP Engine");
  });

  it("builds the WP Admin url", () => {
    expect(propertyWpAdminUrl(base)).toBe("https://blindmagic.com/wp-admin/");
    expect(propertyWpAdminUrl({ ...base, wpEngineInstall: "blindmagic", wpEngineAccountId: "ed80c554" })).toBe(
      "https://my.wpengine.com/installs/blindmagic/launch_wp_admin?account_id=ed80c554",
    );
  });

  it("maps connection status independently of enabled", () => {
    expect(propertyConnectionStatusTone(undefined).label).toBe("Not tested");
    expect(propertyConnectionStatusTone("success").label).toBe("Connected");
  });
});
