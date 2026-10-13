import { describe, expect, it } from "vitest";
import type { WordPressSite } from "@/components/integrations/types";
import { WP_SITES_RESTORE_ORIGINAL_NAMES_ONCE_KEY } from "@/components/integrations/storage";

describe("restore original property names migration key", () => {
  it("uses a stable localStorage flag id", () => {
    expect(WP_SITES_RESTORE_ORIGINAL_NAMES_ONCE_KEY).toBe(
      "neo-pulse-wp-sites-restore-original-names-v1",
    );
  });
});

describe("restore name selection (longest wins)", () => {
  it("documents expected merge priority", () => {
    const site = {
      name: "Blind Magic",
      napInfo: { name: "Blind Magic Custom Blinds & Drapery" },
    } as WordPressSite;
    const candidates = [site.name, site.napInfo?.name ?? ""].map((c) => c.trim()).filter(Boolean);
    const best = candidates.sort((a, b) => b.length - a.length)[0];
    expect(best).toBe("Blind Magic Custom Blinds & Drapery");
  });
});
