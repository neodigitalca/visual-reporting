import { describe, expect, it } from "vitest";
import type { WordPressSite } from "@/components/integrations/types";
import {
  wordpressSiteCanonicalName,
  wordpressSiteMenuDisplayName,
} from "@/lib/wordpress-site-display-name";

function site(partial: Partial<WordPressSite> & Pick<WordPressSite, "id" | "name" | "siteUrl" | "username" | "appPassword" | "connectedAt">): WordPressSite {
  return partial as WordPressSite;
}

describe("wordpressSiteMenuDisplayName", () => {
  it("prefers menuDisplayName over canonical label", () => {
    const s = site({
      id: "1",
      name: "Blind Magic Custom Blinds & Drapery",
      siteUrl: "https://example.com",
      username: "u",
      appPassword: "p",
      connectedAt: 0,
      menuDisplayName: "My menu label",
    });
    expect(wordpressSiteMenuDisplayName(s)).toBe("My menu label");
    expect(wordpressSiteCanonicalName(s)).toBe("Blind Magic Custom Blinds & Drapery");
  });
});

describe("wordpressSiteCanonicalName", () => {
  it("ignores menuDisplayName", () => {
    const s = site({
      id: "1",
      name: "Full Property Name",
      siteUrl: "https://example.com",
      username: "u",
      appPassword: "p",
      connectedAt: 0,
      menuDisplayName: "Short menu",
    });
    expect(wordpressSiteCanonicalName(s)).toBe("Full Property Name");
  });

  it("uses NAP when stored name has trailing truncation ellipsis", () => {
    const s = site({
      id: "1",
      name: "Blind Magic Custom Blinds & Drap ...",
      siteUrl: "https://example.com",
      username: "u",
      appPassword: "p",
      connectedAt: 0,
      napInfo: { name: "Blind Magic Custom Blinds & Drapery" },
    });
    expect(wordpressSiteCanonicalName(s)).toBe("Blind Magic Custom Blinds & Drapery");
  });
});
