const { chunk, buildPagedCollection } = require("./src/_lib/pagination.js");
const filters = require("./src/_lib/filters.js");

const PER_PAGE = 9;

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.addPassthroughCopy("src/CNAME");
  eleventyConfig.addPassthroughCopy("src/.nojekyll");

  eleventyConfig.addCollection("posts", (collection) =>
    collection.getFilteredByGlob("src/posts/*.md").reverse()
  );

  eleventyConfig.addCollection("categoryPages", (collection) =>
    buildPagedCollection(collection, "category", PER_PAGE)
  );

  eleventyConfig.addCollection("tagPages", (collection) =>
    buildPagedCollection(collection, "tags", PER_PAGE)
  );

  eleventyConfig.addShortcode("today", () => new Date().toISOString().slice(0, 10));
  eleventyConfig.addShortcode("year", () => new Date().getFullYear());

  Object.entries(filters).forEach(([name, fn]) => eleventyConfig.addFilter(name, fn));

  eleventyConfig.setServerPassthroughCopyBehavior("copy");

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    pathPrefix: process.env.PATH_PREFIX || "/",
  };
};

module.exports.PER_PAGE = PER_PAGE;
module.exports.chunk = chunk;
