import { describe, it, expect } from "vitest";
const { chunk, buildPagedCollection } = require("../../src/_lib/pagination.js");

describe("chunk", () => {
  it("splits an array into groups of the given size", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns one chunk when the array is smaller than the size", () => {
    expect(chunk([1, 2], 9)).toEqual([[1, 2]]);
  });

  it("returns an empty array for empty input", () => {
    expect(chunk([], 9)).toEqual([]);
  });
});

function fakeCollection(posts) {
  return {
    getFilteredByGlob: () => posts,
  };
}

describe("buildPagedCollection", () => {
  it("groups posts by category and computes zero-indexed page numbers", () => {
    const posts = [
      { data: { category: "Kung Fu" } },
      { data: { category: "Kung Fu" } },
      { data: { category: "Lion Dance" } },
    ];
    const records = buildPagedCollection(fakeCollection(posts), "category", 2);

    const kungFu = records.filter((r) => r.name === "Kung Fu");
    expect(kungFu).toHaveLength(1);
    expect(kungFu[0].pageNumber).toBe(0);
    expect(kungFu[0].totalPages).toBe(1);
    expect(kungFu[0].totalPosts).toBe(2);

    const lionDance = records.filter((r) => r.name === "Lion Dance");
    expect(lionDance).toHaveLength(1);
    expect(lionDance[0].totalPosts).toBe(1);
  });

  it("paginates a category that spans multiple pages", () => {
    const posts = Array.from({ length: 5 }, () => ({ data: { category: "Kung Fu" } }));
    const records = buildPagedCollection(fakeCollection(posts), "category", 2);

    expect(records).toHaveLength(3); // 5 posts / 2 per page = 3 pages
    expect(records.map((r) => r.pageNumber)).toEqual([0, 1, 2]);
    records.forEach((r) => expect(r.totalPages).toBe(3));
  });

  it("groups posts by tags, where a post can appear in multiple buckets", () => {
    const posts = [
      { data: { tags: ["beginners", "hung-gar"] } },
      { data: { tags: ["beginners"] } },
    ];
    const records = buildPagedCollection(fakeCollection(posts), "tags", 9);

    const beginners = records.find((r) => r.name === "beginners");
    const hungGar = records.find((r) => r.name === "hung-gar");
    expect(beginners.totalPosts).toBe(2);
    expect(hungGar.totalPosts).toBe(1);
  });

  it("skips posts with no category — no empty-string bucket", () => {
    const posts = [{ data: {} }, { data: { category: "Kung Fu" } }];
    const records = buildPagedCollection(fakeCollection(posts), "category", 9);

    expect(records).toHaveLength(1);
    expect(records[0].name).toBe("Kung Fu");
  });

  it("skips posts with no tags — tags defaults to an empty array", () => {
    const posts = [{ data: {} }];
    const records = buildPagedCollection(fakeCollection(posts), "tags", 9);

    expect(records).toEqual([]);
  });
});
