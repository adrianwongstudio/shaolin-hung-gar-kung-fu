import { describe, it, expect } from "vitest";
const filters = require("../../src/_lib/filters.js");

describe("telHref", () => {
  it("strips spaces, parens, and dashes into a dialable tel: link", () => {
    expect(filters.telHref("+1 (604) 555 0148")).toBe("tel:+16045550148");
  });

  it("returns an empty string for non-string input", () => {
    expect(filters.telHref(undefined)).toBe("");
    expect(filters.telHref(null)).toBe("");
  });
});

describe("isoDate", () => {
  it("formats a date-only string as YYYY-MM-DD", () => {
    expect(filters.isoDate("2026-01-05")).toBe("2026-01-05");
  });
});

describe("readableDate", () => {
  it("renders a long-form date without shifting to the previous day", () => {
    // Regression guard: this exact bug shows up when a date-only string is
    // formatted in a non-UTC timezone (see design.md "Known gotchas").
    expect(filters.readableDate("2026-01-05")).toBe("January 5, 2026");
  });
});

describe("limit", () => {
  it("returns the first n items", () => {
    expect(filters.limit([1, 2, 3, 4], 2)).toEqual([1, 2]);
  });

  it("handles undefined input", () => {
    expect(filters.limit(undefined, 2)).toEqual([]);
  });
});

describe("firstPageOnly", () => {
  it("keeps only records where pageNumber is 0", () => {
    const records = [{ pageNumber: 0, name: "a" }, { pageNumber: 1, name: "a" }, { pageNumber: 0, name: "b" }];
    expect(filters.firstPageOnly(records)).toEqual([
      { pageNumber: 0, name: "a" },
      { pageNumber: 0, name: "b" },
    ]);
  });
});

describe("uniqueBy", () => {
  it("de-duplicates by the given key, keeping first occurrence", () => {
    const items = [{ category: "Kung Fu" }, { category: "Lion Dance" }, { category: "Kung Fu" }];
    expect(filters.uniqueBy(items, "category")).toEqual([{ category: "Kung Fu" }, { category: "Lion Dance" }]);
  });
});
