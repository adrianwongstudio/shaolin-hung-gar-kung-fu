# Blog pagination + category filtering — build spec

Real pagination did not exist in the inherited template. What `design.md`
originally described as pagination was `size: 1` over the *category list* —
that generates one page per category, not paged posts. `blog.njk` rendered
every post on a single page with no page splitting and no pager UI.

This document specifies what to build.

---

## Goals

1. `/blog/` splits into pages of 9 posts.
2. Category and tag filter pages paginate too — a category with 40 posts
   must not render 40 cards on one page.
3. A visible category filter control on `/blog/`, showing active state.
4. One reusable pager partial, used by all three listing templates.
5. Correct SEO and accessibility semantics.

---

## URL scheme

| Page | URL |
|---|---|
| Blog, page 1 | `/blog/` |
| Blog, page 2+ | `/blog/page/2/`, `/blog/page/3/` … |
| Category, page 1 | `/blog/category/lion-dance/` |
| Category, page 2+ | `/blog/category/lion-dance/page/2/` |
| Tag, page 1 | `/blog/tag/beginners/` |
| Tag, page 2+ | `/blog/tag/beginners/page/2/` |

Page 1 never carries `/page/1/`. Two URLs serving identical content is a
duplicate-content problem, and `/page/1/` is the one that adds nothing.

---

## Step 1 — Paginate the main blog listing

`src/blog.njk`:

```njk
---
layout: layout.njk
title: Blog
pagination:
  data: collections.posts
  size: 9
  alias: posts
permalink: "{% if pagination.pageNumber == 0 %}/blog/{% else %}/blog/page/{{ pagination.pageNumber + 1 }}/{% endif %}"
---

{% include "category-filter.njk" %}

<div class="blog-grid">
  <div class="posts">
    {% for post in posts %}
      {% include "post-card.njk" %}
    {% endfor %}
  </div>
  {% include "blog-sidebar.njk" %}
</div>

{% set pager = pagination %}
{% set pagerBase = "/blog/" %}
{% include "pagination.njk" %}
```

`pagination.pageNumber` is **zero-indexed** — page 1 is `0`. Getting this
wrong is the single most common Eleventy pagination bug; it produces an
off-by-one in every page number and an orphaned `/blog/page/1/`.

`collections.posts` must already be sorted newest-first. Eleventy sorts
ascending by date by default, so reverse it in `.eleventy.js`:

```js
eleventyConfig.addCollection("posts", (c) =>
  c.getFilteredByGlob("src/posts/*.md").reverse()
);
```

---

## Step 2 — Nested pagination on filter pages

This is the part that has no equivalent in the original template. The
existing `postsByCategory` collection returns one record per category.
To paginate *within* each category, flatten the data into one record per
`(category, page)` pair before Eleventy sees it.

Add to `.eleventy.js`:

```js
const PER_PAGE = 9;

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function buildPagedCollection(collection, key) {
  const buckets = new Map();
  for (const post of collection.getFilteredByGlob("src/posts/*.md").reverse()) {
    const values = key === "tags"
      ? (post.data.tags || [])
      : [post.data.category].filter(Boolean);
    for (const name of values) {
      if (!buckets.has(name)) buckets.set(name, []);
      buckets.get(name).push(post);
    }
  }

  const records = [];
  for (const [name, posts] of buckets) {
    const pages = chunk(posts, PER_PAGE);
    pages.forEach((pagePosts, i) => {
      records.push({
        name,
        posts: pagePosts,
        pageNumber: i,          // zero-indexed
        totalPages: pages.length,
        totalPosts: posts.length,
      });
    });
  }
  return records;
}

eleventyConfig.addCollection("categoryPages", (c) =>
  buildPagedCollection(c, "category"));
eleventyConfig.addCollection("tagPages", (c) =>
  buildPagedCollection(c, "tags"));
```

Then `src/blog-category.njk`:

```njk
---
layout: layout.njk
pagination:
  data: collections.categoryPages
  size: 1
  alias: cat
permalink: "{% if cat.pageNumber == 0 %}/blog/category/{{ cat.name | slugify }}/{% else %}/blog/category/{{ cat.name | slugify }}/page/{{ cat.pageNumber + 1 }}/{% endif %}"
eleventyComputed:
  title: "{{ cat.name }}"
---

<h1>{{ cat.name }}</h1>
<p class="result-count">{{ cat.totalPosts }} article{{ "s" if cat.totalPosts != 1 }}</p>

{% include "category-filter.njk" %}

<div class="blog-grid">
  <div class="posts">
    {% for post in cat.posts %}
      {% include "post-card.njk" %}
    {% endfor %}
  </div>
  {% include "blog-sidebar.njk" %}
</div>

{% set pager = { pageNumber: cat.pageNumber, totalPages: cat.totalPages } %}
{% set pagerBase = "/blog/category/" + (cat.name | slugify) + "/" %}
{% include "pagination.njk" %}
```

`src/blog-tag.njk` is identical with `tagPages` and `/blog/tag/`.

Categories with zero posts produce no page — the bucket never gets created.
That matches the original behaviour and is correct: an empty filter page is
a dead end.

---

## Step 3 — The pager partial

`src/_includes/pagination.njk`. Expects `pager` (with `pageNumber` and
`totalPages`) and `pagerBase` (a URL ending in `/`).

```njk
{% if pager.totalPages > 1 %}
{% set current = pager.pageNumber + 1 %}
<nav class="pager" aria-label="Pagination">

  {% if current > 1 %}
    <a class="pager__step" rel="prev"
       href="{{ pagerBase if current == 2 else pagerBase + 'page/' + (current - 1) + '/' }}">
      <span aria-hidden="true">&larr;</span> Previous
    </a>
  {% else %}
    <span class="pager__step is-disabled" aria-hidden="true">&larr; Previous</span>
  {% endif %}

  <ol class="pager__list">
    {% for p in range(1, pager.totalPages + 1) %}
      {% set show = p == 1 or p == pager.totalPages or (p >= current - 1 and p <= current + 1) %}
      {% if show %}
        <li>
          {% if p == current %}
            <span class="pager__num is-current" aria-current="page">{{ p }}</span>
          {% else %}
            <a class="pager__num" href="{{ pagerBase if p == 1 else pagerBase + 'page/' + p + '/' }}">{{ p }}</a>
          {% endif %}
        </li>
      {% elif p == 2 or p == pager.totalPages - 1 %}
        <li><span class="pager__gap" aria-hidden="true">&hellip;</span></li>
      {% endif %}
    {% endfor %}
  </ol>

  {% if current < pager.totalPages %}
    <a class="pager__step" rel="next"
       href="{{ pagerBase + 'page/' + (current + 1) + '/' }}">
      Next <span aria-hidden="true">&rarr;</span>
    </a>
  {% endif %}

</nav>
{% endif %}
```

The truncation window shows: first, last, and current ±1, with `…` standing
in for the gaps. A 20-page blog renders `1 … 7 8 9 … 20` rather than twenty
numbers.

---

## Step 4 — Category filter control

`src/_includes/category-filter.njk` — a horizontal chip row above the grid.
The sidebar list stays; this is the scannable control the brief asks for.

```njk
<nav class="cat-filter" aria-label="Filter by category">
  <a class="chip {{ 'is-active' if page.url == '/blog/' or '/blog/page/' in page.url }}"
     href="/blog/">All</a>
  {% for c in collections.categoryPages %}
    {% if c.pageNumber == 0 %}
      {% set slug = c.name | slugify %}
      <a class="chip {{ 'is-active' if ('/blog/category/' + slug + '/') in page.url }}"
         href="/blog/category/{{ slug }}/">
        {{ c.name }} <span class="chip__count">{{ c.totalPosts }}</span>
      </a>
    {% endif %}
  {% endfor %}
</nav>
```

The `pageNumber == 0` guard matters — without it, a category spanning 3
pages renders its chip three times.

Overflows horizontally on mobile with `overflow-x: auto` and
`scroll-snap-type: x proximity`. Do **not** wrap to multiple lines on
narrow screens; a 4-line chip block pushes the actual content below the
fold.

---

## Step 5 — SEO and accessibility

In `layout.njk` `<head>`:

```njk
{% if pagination.href.previous %}<link rel="prev" href="{{ pagination.href.previous }}">{% endif %}
{% if pagination.href.next %}<link rel="next" href="{{ pagination.href.next }}">{% endif %}
<link rel="canonical" href="{{ site.url }}{{ page.url }}">
```

Rules:

- **Canonical points at the current paginated URL**, not back at `/blog/`.
  Canonicalising page 2 to page 1 tells Google the page-2 posts don't
  exist, and they drop out of the index.
- Page 2+ needs a distinct `<title>` — `Blog — Page 2 | Shaolin Hung Gar`.
  Identical titles across pages read as duplicate content.
- `<nav aria-label="Pagination">` — the label is what a screen reader
  announces to distinguish it from the main nav.
- `aria-current="page"` on the active number, which is why it renders as
  `<span>` and not a link. Linking to the page you're on is a dead control.
- Numbers need a **44×44px minimum tap target**. Small numerals with tight
  padding are one of the most-failed mobile accessibility checks.
- Wrap the numbers in `<ol>`, not `<div>` — it's an ordered sequence.

---

## Step 6 — Styling notes

- Pager sits **inside** the `.posts` column, not below the full
  `.blog-grid`. Centred under the whole grid it drifts under the sidebar
  on desktop and looks unmoored.
- Active chip: `--red` background, white text. Inactive: `--bg-soft`
  background, `--ink` text, `--line` border.
- Never signal the active state by colour alone — the active chip also
  gets weight 600. Colour-only state fails WCAG 1.4.1.
- `--gold` is not usable for chip text on cream (≈1.5:1). Gold as a chip
  *background* behind `--ink` is fine.

---

## Testing

Add to `testing.md`:

```bash
npm run build

# Page 1 exists and /blog/page/1/ does NOT
ls _site/blog/index.html
test ! -d _site/blog/page/1 && echo "OK: no orphan page 1"

# Page 2 generated once there are 10+ posts
ls _site/blog/page/2/index.html

# Category pagination
ls -d _site/blog/category/*/page/* 2>/dev/null

# Exactly 9 cards on a full page
grep -c "post-card__body" _site/blog/index.html    # expect 9

# rel=prev / rel=next present on page 2
grep -o 'rel="\(prev\|next\)"' _site/blog/page/2/index.html

# No category chip rendered twice
grep -o 'href="/blog/category/[^"]*"' _site/blog/index.html | sort | uniq -d
# ^ should output nothing
```

Manual checks:

- Click through every page number and both arrows; no 404s.
- Previous is absent or disabled on page 1; Next absent on the last page.
- Applying a category filter resets to page 1 — it must not preserve the
  page number across a filter change and land on an empty page.
- At 375px the chip row scrolls horizontally without pushing page width
  (`document.documentElement.scrollWidth > window.innerWidth` → `false`).
- Tab through the pager: focus order is left-to-right, visible focus ring
  throughout, and the current page is skipped as a target.

---

## Decisions still open

| # | Question | Default if unanswered |
|---|---|---|
| 1 | Posts per page | 9 (3×3 grid on desktop) |
| 2 | Numbered pager, or Previous/Next only | Numbered with truncation |
| 3 | Does the sidebar tag cloud stay, now that chips exist | Keep both — chips filter categories, cloud handles tags |
| 4 | Infinite scroll instead | No — breaks deep linking, back-button, and SEO on a content site |
