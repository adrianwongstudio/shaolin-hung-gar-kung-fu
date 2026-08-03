function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Flattens a "one record per category/tag" grouping into
 * "one record per (category/tag, page)" so Eleventy can paginate within
 * each bucket. See PAGINATION.md Step 2 — pageNumber is zero-indexed.
 */
function buildPagedCollection(collection, key, perPage) {
  const buckets = new Map();
  for (const post of collection.getFilteredByGlob("src/posts/*.md").reverse()) {
    const values =
      key === "tags" ? post.data.tags || [] : [post.data.category].filter(Boolean);
    for (const name of values) {
      if (!buckets.has(name)) buckets.set(name, []);
      buckets.get(name).push(post);
    }
  }

  const records = [];
  for (const [name, posts] of buckets) {
    const pages = chunk(posts, perPage);
    pages.forEach((pagePosts, i) => {
      records.push({
        name,
        posts: pagePosts,
        pageNumber: i,
        totalPages: pages.length,
        totalPosts: posts.length,
      });
    });
  }
  return records;
}

module.exports = { chunk, buildPagedCollection };
