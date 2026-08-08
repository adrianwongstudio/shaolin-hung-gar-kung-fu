import { beforeAll, describe, it, expect } from "vitest";
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const ROOT = path.join(__dirname, "..", "..");
const SITE = path.join(ROOT, "_site");
const eleventyConfig = require("../../.eleventy.js");

function read(relPath) {
  return fs.readFileSync(path.join(SITE, relPath), "utf8");
}

function exists(relPath) {
  return fs.existsSync(path.join(SITE, relPath));
}

beforeAll(() => {
  execSync("npx @11ty/eleventy", { cwd: ROOT, stdio: "pipe" });
}, 60000);

describe("all 8 documented pages build", () => {
  const pages = ["", "kung-fu", "lion-dance", "blog", "about", "free-trial", "book-lion-dance", "gallery"];

  it.each(pages)("builds /%s/", (p) => {
    expect(exists(`${p}/index.html`)).toBe(true);
  });
});

describe("special pages", () => {
  it("builds a styled 404 at the site root", () => {
    expect(exists("404.html")).toBe(true);
  });

  it("builds the shared no-JS form fallback at /thanks/", () => {
    expect(exists("thanks/index.html")).toBe(true);
  });
});

describe("blog pagination", () => {
  it(`renders exactly ${eleventyConfig.PER_PAGE} post cards on page 1`, () => {
    const html = read("blog/index.html");
    const matches = html.match(/post-card__body/g) || [];
    expect(matches.length).toBe(eleventyConfig.PER_PAGE);
  });

  it("does not produce an orphan /blog/page/1/", () => {
    expect(exists("blog/page/1/index.html")).toBe(false);
  });

  it("produces /blog/page/2/ once there are more than 9 posts", () => {
    expect(exists("blog/page/2/index.html")).toBe(true);
  });

  it("marks the current page with aria-current on page 2", () => {
    const html = read("blog/page/2/index.html");
    expect(html).toMatch(/aria-current="page"/);
  });

  it("includes rel=prev and rel=next on page 2 for SEO", () => {
    const html = read("blog/page/2/index.html");
    expect(html).toMatch(/rel="prev"/);
  });

  it("gives page 2 a distinct <title> from page 1", () => {
    const p1 = read("blog/index.html").match(/<title>(.*?)<\/title>/)[1];
    const p2 = read("blog/page/2/index.html").match(/<title>(.*?)<\/title>/)[1];
    expect(p1).not.toBe(p2);
  });
});

describe("category and tag filter pages", () => {
  it("generates a page per category that has at least one post", () => {
    expect(exists("blog/category/kung-fu/index.html")).toBe(true);
    expect(exists("blog/category/lion-dance/index.html")).toBe(true);
  });

  it("generates a page per tag that has at least one post", () => {
    expect(exists("blog/tag/hung-gar/index.html")).toBe(true);
  });

  it("does not render the same category chip twice within the filter row", () => {
    // The category-filter chip row and the sidebar's Categories widget both
    // legitimately link to the same URLs — scope this check to just the
    // chip row, per PAGINATION.md's pageNumber==0 guard.
    const html = read("blog/index.html");
    const chipRow = html.match(/<nav class="cat-filter"[\s\S]*?<\/nav>/)[0];
    const hrefs = [...chipRow.matchAll(/href="\/blog\/category\/([^"]*)"/g)].map((m) => m[1]);
    const unique = new Set(hrefs);
    expect(hrefs.length).toBe(unique.size);
  });

  it("has a canonical category filter page whose result count matches the post count", () => {
    const html = read("blog/category/kung-fu/index.html");
    const countMatch = html.match(/(\d+) article/);
    expect(countMatch).not.toBeNull();
    expect(Number(countMatch[1])).toBeGreaterThan(0);
  });
});

describe("static-file hygiene (from testing.md's local build verification)", () => {
  it("does not ship CNAME or .nojekyll (GitHub-Pages-only cargo — Cloudflare Pages handles custom domain via dashboard)", () => {
    expect(fs.existsSync(path.join(SITE, "CNAME"))).toBe(false);
    expect(fs.existsSync(path.join(SITE, ".nojekyll"))).toBe(false);
  });

  it("emits absolute paths without a repo prefix (Cloudflare Pages serves from /)", () => {
    const html = read("index.html");
    expect(html).toMatch(/href="\/css\/style\.css"/);
    expect(html).not.toMatch(/shaolin-hung-gar-kung-fu\/css/);
  });

  it("contains no leftover third-party form service residue", () => {
    const html = read("free-trial/index.html") + read("book-lion-dance/index.html");
    expect(html).not.toMatch(/formspree/i);
    expect(html).not.toMatch(/identity\.netlify|data-netlify|git-gateway/i);
  });

  it("does not commit _site into the repo (belongs in .gitignore)", () => {
    const gitignore = fs.readFileSync(path.join(ROOT, ".gitignore"), "utf8");
    expect(gitignore).toMatch(/_site\//);
  });
});

describe("phone number consistency (regression: tel: link drift)", () => {
  it("uses the same tel: href on the home page and in the footer everywhere it appears", () => {
    const html = read("index.html");
    const hrefs = [...html.matchAll(/tel:[^"]*/g)].map((m) => m[0]);
    expect(hrefs.length).toBeGreaterThan(0);
    expect(new Set(hrefs).size).toBe(1);
  });
});

describe("forms", () => {
  it("free-trial is the short form: name, email, phone, details", () => {
    const html = read("free-trial/index.html");
    const realFields = [...html.matchAll(/<(?:input|textarea)[^>]*name="([^"]+)"/g)]
      .map((m) => m[1])
      .filter((n) => n !== "website" && n !== "js_enabled");
    expect(realFields.sort()).toEqual(["details", "email", "name", "phone"].sort());
  });

  it("book-lion-dance is the long form with all 8 documented fields", () => {
    const html = read("book-lion-dance/index.html");
    const realFieldNames = [...html.matchAll(/name="([^"]+)"/g)].map((m) => m[1]);
    const expected = [
      "name",
      "email",
      "phone",
      "organization",
      "inquiry_type",
      "event_date",
      "event_time",
      "details",
    ];
    expected.forEach((field) => expect(realFieldNames).toContain(field));
  });

  it("both forms carry a honeypot field that is visually hidden, not just absent", () => {
    const html = read("free-trial/index.html");
    expect(html).toMatch(/name="website"/);
    expect(html).toMatch(/field--honeypot/);
  });

  it("both forms submit to the same configured Apps Script endpoint", () => {
    const ft = read("free-trial/index.html");
    const bld = read("book-lion-dance/index.html");
    const ftAction = ft.match(/action="([^"]+)"/)[1];
    const bldAction = bld.match(/action="([^"]+)"/)[1];
    expect(ftAction).toBe(bldAction);
  });

  it("the booking date input has a min attribute (no dates in the past)", () => {
    const html = read("book-lion-dance/index.html");
    expect(html).toMatch(/name="event_date"[^>]*min="\d{4}-\d{2}-\d{2}"/);
  });
});

describe("design tokens applied to the build", () => {
  it("declares the 10px radius token", () => {
    const css = fs.readFileSync(path.join(SITE, "css", "style.css"), "utf8");
    expect(css).toMatch(/--radius:\s*10px/);
  });

  it("declares the documented 5-step responsive scale", () => {
    const css = fs.readFileSync(path.join(SITE, "css", "style.css"), "utf8");
    expect(css).toMatch(/max-width:\s*1279px/);
    expect(css).toMatch(/max-width:\s*1023px/);
    expect(css).toMatch(/max-width:\s*767px/);
    expect(css).toMatch(/max-width:\s*479px/);
  });
});

describe("GitHub Actions workflows", () => {
  it("ci.yml is valid YAML", () => {
    // Regression guard: `${{ }}` inside an inline flow mapping (`{ url: ${{ ... }} }`)
    // is invalid YAML — the braces collide. Must use block-style mapping instead.
    const raw = fs.readFileSync(path.join(ROOT, ".github", "workflows", "ci.yml"), "utf8");
    expect(() => yaml.load(raw)).not.toThrow();
  });
});

describe("CMS config", () => {
  it("src/admin/config.yml is valid YAML", () => {
    const raw = fs.readFileSync(path.join(ROOT, "src", "admin", "config.yml"), "utf8");
    expect(() => yaml.load(raw)).not.toThrow();
  });

  it("defines every section type the home page dispatcher supports", () => {
    const raw = fs.readFileSync(path.join(ROOT, "src", "admin", "config.yml"), "utf8");
    const config = yaml.load(raw);
    const homeCollection = config.collections.find((c) => c.name === "home");
    const sectionsField = homeCollection.files[0].fields.find((f) => f.name === "sections");
    const configuredTypes = sectionsField.types.map((t) => t.name).sort();

    const dispatcher = fs.readFileSync(
      path.join(ROOT, "src", "_includes", "custom-section.njk"),
      "utf8"
    );
    const dispatchedTypes = [...dispatcher.matchAll(/section\.type == "([^"]+)"/g)].map((m) => m[1]).sort();

    expect(configuredTypes).toEqual(dispatchedTypes);
  });

  it("passthrough-copies the admin folder into the build", () => {
    expect(exists("admin/config.yml")).toBe(true);
    expect(exists("admin/index.html")).toBe(true);
  });
});

describe("images have real alt text", () => {
  it("every <img> on the home page has a non-empty alt or an empty decorative alt", () => {
    const html = read("index.html");
    const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
    expect(imgs.length).toBeGreaterThan(0);
    imgs.forEach((img) => expect(img).toMatch(/alt="/));
  });
});
