import { describe, expect, it } from "vitest";
import { buildPulseHostHash, isPulseHostHash, parsePulseHostRouteFromHash } from "../pulse-host-hash";

describe("pulse-host-hash", () => {
  it("recognises list and profile hashes only", () => {
    expect(isPulseHostHash("#pulse-host")).toBe(true);
    expect(isPulseHostHash("#pulse-host/sites/abc")).toBe(true);
    expect(isPulseHostHash("#pulse-forge")).toBe(false);
    expect(isPulseHostHash("#pulse-hosting")).toBe(false);
  });

  it("parses the list route", () => {
    expect(parsePulseHostRouteFromHash("#pulse-host")).toEqual({ view: "list" });
    expect(parsePulseHostRouteFromHash("#pulse-host/sites")).toEqual({ view: "list" });
    expect(parsePulseHostRouteFromHash("#settings")).toEqual({ view: "list" });
  });

  it("parses group, environment, and section", () => {
    expect(parsePulseHostRouteFromHash("#pulse-host/sites/g1")).toEqual({ view: "site", groupId: "g1", envId: null, section: "overview" });
    expect(parsePulseHostRouteFromHash("#pulse-host/sites/g1/e1/users")).toEqual({ view: "site", groupId: "g1", envId: "e1", section: "users" });
  });

  it("falls to overview for an unknown section", () => {
    expect(parsePulseHostRouteFromHash("#pulse-host/sites/g1/e1/nope")).toMatchObject({ view: "site", section: "overview" });
  });

  it("builds hashes that parse back to the same route", () => {
    const route = { view: "site" as const, groupId: "g 1", envId: "e1", section: "activity" as const };
    const hash = buildPulseHostHash(route);
    expect(hash).toBe("pulse-host/sites/g%201/e1/activity");
    expect(parsePulseHostRouteFromHash(`#${hash}`)).toEqual(route);
    expect(buildPulseHostHash({ view: "list" })).toBe("pulse-host");
    expect(buildPulseHostHash({ view: "site", groupId: "g1", envId: null, section: "overview" })).toBe("pulse-host/sites/g1");
  });
});
