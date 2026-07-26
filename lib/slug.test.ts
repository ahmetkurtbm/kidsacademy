import { describe, expect, it } from "vitest";
import { normalizeSlug } from "./slug";

describe("normalizeSlug", () => {
  it("lowercases and transliterates Turkish characters", () => {
    expect(normalizeSlug("Ahmet Kurt Öğüşçı")).toBe("ahmetkurtogusci");
  });

  it("strips characters outside a-z0-9-", () => {
    expect(normalizeSlug("ahmet_kurt!123")).toBe("ahmetkurt123");
  });

  it("keeps hyphens", () => {
    expect(normalizeSlug("ahmet-kurt")).toBe("ahmet-kurt");
  });

  it("returns an empty string for nullish input", () => {
    expect(normalizeSlug(undefined)).toBe("");
    expect(normalizeSlug(null)).toBe("");
  });

  it("coerces non-string input", () => {
    expect(normalizeSlug(12345)).toBe("12345");
  });
});
