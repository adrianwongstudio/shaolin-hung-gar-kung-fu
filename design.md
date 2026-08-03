# Design & architecture reference

A blueprint for rebuilding this kind of small-business site — static build,
free hosting, editor-friendly CMS, block-based home page, tag/category-aware
blog — on a new domain and repo. Everything here is what we actually shipped;
nothing hypothetical.

## What "this" is

A static marketing site for a small business, with:

- Home page built from **reorderable typed sections** (hero, banner, feature
  cards, services, about, team, CTA, blog list, plus 6 custom types the editor
  can drop in freely)
- **Blog** with categories and tags, both managed by the editor
- **Auto-generated filter pages** at `/blog/category/<slug>/` and
  `/blog/tag/<slug>/`
- **Blog sidebar** with a category list (with counts) and a size-tiered tag
  cloud ("heatmap")
- **CMS at `/admin/`** where non-technical staff manage everything through
  a friendly UI, logging in with GitHub
- **Custom domain** with HTTPS, DNS pointed at GitHub Pages

---

## Stack at a glance

| Concern | Choice |
|---|---|
| Static site generator | **Eleventy 3.x** (Nunjucks templates, Markdown posts) |
| Hosting | **GitHub Pages** via GitHub Actions workflow (no `gh-pages` branch) |
| CMS | **Decap CMS** (fork of Netlify CMS), served from `/admin/` |
| CMS auth | GitHub OAuth backend + tiny **Cloudflare Worker** as OAuth proxy |
| Node runtime (CI) | Node 22 (LTS) on `ubuntu-latest` |
| Local dev CMS | `decap-server` proxy (no auth needed locally) |

Nothing here needs a database, a Node server, or a paid tier.

---

## Deployment architecture

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                       (custom domain)                        │
└──────────────────────────────────────────────────────────────┘
                              │  DNS: A records
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                     GitHub Pages                             │
│              serves _site/ artifact from                     │
│              the last successful Actions run                 │
└──────────────────────────────────────────────────────────────┘
                              ▲
                              │  actions/deploy-pages
┌──────────────────────────────────────────────────────────────┐
│                    GitHub Actions                            │
│       npm ci → npm run build → upload-pages-artifact         │
│               (triggered on push to main)                    │
└──────────────────────────────────────────────────────────────┘
                              ▲
                              │  push
┌──────────────────────────────────────────────────────────────┐
│         GitHub repo main branch  ◀───────┐                   │
└──────────────────────────────────────────────────────────────┘
                              ▲            │  commits
                              │            │
                    editor's browser ─────────┐
                       Decap CMS UI at /admin/│
                              │            │
                              │  OAuth     │
                              ▼            │
┌──────────────────────────────────────────────────────────────┐
│           Cloudflare Worker (OAuth proxy)                    │
│      /auth  → redirect to GitHub OAuth                       │
│      /callback  → exchange code + client_secret → token      │
└──────────────────────────────────────────────────────────────┘

Forms (/free-trial/ and /book-lion-dance/):

  browser
    │  fetch() POST, Content-Type: text/plain
    ▼
┌──────────────────────────────────────────────────────────────┐
│         Google Apps Script Web App  (doPost)                 │
│   1. parse JSON body        4. MailApp.sendEmail() → staff   │
│   2. validate honeypot      5. MailApp.sendEmail() → sender  │
│   3. appendRow() → Sheet       (confirmation copy)           │
└──────────────────────────────────────────────────────────────┘
    │                    │
    ▼                    ▼
 Google Sheet        email and google drive
 (one tab per        (notification list, from
  form_type)          Script Properties)
```

**Why `Content-Type: text/plain`:** Apps Script Web Apps do not respond to
CORS preflight `OPTIONS` requests. Posting `application/json` triggers a
preflight, which fails, and the browser blocks the request. `text/plain` is
a CORS-*simple* request — no preflight — so the POST goes through. The
script does `JSON.parse(e.postData.contents)` on the other side. The
alternative, `mode: 'no-cors'`, "works" but makes the response opaque, so
you cannot distinguish success from failure — do not use it.

---

## Repository layout

```
.
├── .github/workflows/deploy.yml       ← Actions: build + Pages deploy
├── .eleventy.js                       ← Eleventy config
├── .gitignore
├── .nojekyll                          ← empty; belt-and-suspenders
├── package.json / package-lock.json
├── src/
│   ├── .nojekyll                      ← copied to _site/.nojekyll
│   ├── CNAME                          ← shaolinhunggarkungfu.com
│   ├── 404.njk                        ← permalink: /404.html
│   ├── index.njk                      ← / — loops home.sections
│   ├── kung-fu.njk                    ← /kung-fu/
│   ├── lion-dance.njk                 ← /lion-dance/
│   ├── about.njk                      ← /about/
│   ├── free-trial.njk                 ← /free-trial/ — short conversion form
│   ├── book-lion-dance.njk            ← /book-lion-dance/ — long booking form
│   ├── gallery.njk                    ← /gallery/ — filterable grid + lightbox
│   ├── thanks.njk                     ← /thanks/ — no-JS fallback target
│   ├── blog.njk                       ← /blog/ + /blog/page/N/
│   ├── blog-category.njk              ← /blog/category/<slug>/ + /page/N/
│   ├── blog-tag.njk                   ← /blog/tag/<slug>/ + /page/N/
│   ├── admin/
│   │   ├── config.yml                 ← Decap CMS config (all collections)
│   │   └── index.html                 ← Decap CMS loader
│   ├── _data/
│   │   ├── site.json                  ← company info (name, phone, logo, …)
│   │   ├── home.json                  ← home page: { sections: […] }
│   │   ├── pages/                     ← one JSON per editable static page
│   │   │   ├── kung-fu.json           ←   { sections: […] }
│   │   │   ├── lion-dance.json
│   │   │   └── about.json
│   │   ├── forms.json                 ← Apps Script URL, inquiry types, time bands
│   │   ├── categories/*.yml           ← one file per category (managed by CMS)
│   │   └── tags/*.yml                 ← one file per tag (managed by CMS)
│   ├── _includes/
│   │   ├── layout.njk                 ← site chrome (nav, footer, scripts)
│   │   ├── post.njk                   ← individual blog post layout
│   │   ├── custom-section.njk         ← renders any typed section block
│   │   ├── blog-sidebar.njk           ← Categories + Tags widgets
│   │   ├── pagination.njk             ← reusable pager (see PAGINATION.md)
│   │   └── category-filter.njk        ← horizontal chip row, active state
│   ├── css/style.css
│   ├── js/
│   │   ├── nav.js                     ← sticky header + mobile overlay menu
│   │   ├── slider.js                  ← hero slider
│   │   └── form.js                    ← fetch() submit + inline states
│   ├── images/                        ← logos + uploaded via CMS
│   └── posts/
│       ├── posts.json                 ← default frontmatter for posts
│       └── YYYY-MM-DD-slug.md
├── oauth-worker/                      ← Cloudflare Worker source (see below)
│   ├── package.json
│   ├── worker.js
│   ├── wrangler.toml
│   └── README.md
└── apps-script/                       ← form handler, deployed to Google
    ├── Code.gs                        ← doPost: validate → Sheet → MailApp
    ├── appsscript.json                ← manifest (timezone, scopes)
    └── README.md                      ← deploy steps + Script Properties
```

**The two forms share one endpoint.** `/free-trial/` submits 4 fields;
`/book-lion-dance/` submits 8. Both include `form_type`, which the script
uses to pick the destination Sheet tab, the notification recipient list,
and the confirmation email template. Keeping one Web App means one
deployment URL to maintain and one quota to watch.

Eleventy is configured with `dir.input = "src"` — everything outside `src/`
is untouched by the build (except `_site/` for output).

---

## Content model

### `src/_data/site.json` — global site info

```json
{
  "name": "…",
  "tagline": "…",
  "description": "…",
  "phone": "+1 (778) …",
  "email": "info@…",
  "email_secondary": "",
  "address": "…",
  "logo": "/images/uploaded-logo.png"
}
```

Used everywhere via `{{ site.foo }}` in templates.

### `src/_data/home.json` — home page as ordered blocks

```json
{
  "sections": [
    { "type": "hero_slider",         "slides": [...] },
    { "type": "consultation_banner", "text": "…", "button_label": "…", ... },
    { "type": "feature_cards",       "cards": [...] },
    { "type": "services",            "heading": "…", "cards": [...] },
    { "type": "about",               "heading": "…", "text": "…", "stat_number": "3", ... },
    { "type": "team",                "heading": "…", "members": [...] },
    { "type": "cta_band",            "heading": "…", "style": "red" },
    { "type": "testimonial",         "quote": "…", "author_name": "…" },
    { "type": "blog_list",           "heading": "…" }
  ]
}
```

The template just loops the array and dispatches to a partial per `type`.
Editors reorder / add / delete sections; nothing else changes.

**Available `type` values** (each with its own fields — see
`src/admin/config.yml` for the definitive schema):

| Type | Purpose |
|---|---|
| `hero_slider` | Rotating hero with background image, eyebrow, heading, CTA |
| `consultation_banner` | Gold band with text + CTA |
| `feature_cards` | 3 icon tiles (icons hardcoded in template, cycle after 3) |
| `services` | 3-column service cards with icons |
| `about` | Two-column: text + stat panel (e.g. "3 Pillars") |
| `team` | Grid of member cards (photo, name, role, bio) |
| `blog_list` | Latest 3 posts from `collections.posts` |
| `tile_grid` | Generic 3-tile grid, no icons |
| `two_column` | Text + optional image, image side left/right |
| `cta_band` | Full-width call-to-action band (red/gold/soft/plain — the original template's `navy` value is renamed `red` for this site) |
| `rich_text` | Free markdown block |
| `service_cards` | Like `services` but no icons |
| `testimonial` | Big italic quote + attribution |

### `src/_data/categories/*.yml` and `src/_data/tags/*.yml`

One tiny file per category or tag, e.g. `insurance.yml`:

```yaml
name: "Insurance"
```

Editors create and delete these via the CMS's "Categories" / "Tags" sections.
Blog posts pick from them via the CMS's `relation` widget.

### Blog post frontmatter

```yaml
---
title: My post
date: 2025-05-30
category: Insurance          # matches a name in _data/categories/
tags:                        # each matches a name in _data/tags/
  - home
  - savings
image: "/images/foo.jpg"
image_position: center
excerpt: One-liner shown on the blog card.
---

Post body in Markdown.
```

Categories and tags are stored as their string names (not slugs) — the URL
slugs are computed at render time via `| slugify`.

---

## CMS (Decap) design

See `src/admin/config.yml` for the full definition. Structure:

```
backend: github            ← via OAuth proxy (see below)
local_backend: true        ← ignored on live site; enables local dev CMS
media_folder: "src/images"
public_folder: "/images"

collections:
  ─ Blog Posts   (folder-based, src/posts/*.md)
  ─ Categories   (folder-based, src/_data/categories/*.yml)
  ─ Tags         (folder-based, src/_data/tags/*.yml)
  ─ Home Page    (file-based, edits src/_data/home.json)
  ─ Site Settings (file-based, edits src/_data/site.json)
```

**Key techniques worth reusing:**

- **Typed list for home page sections** — `widget: list` with `types:` gives
  editors an "Add Section" dropdown of block types. Every type has its own
  fields, a `summary:` for the collapsed row, and drag-to-reorder built in.
- **`collapsed: true` + `minimize_collapsed: true`** on long lists so the
  UI stays scannable.
- **Relation widgets for category/tag pickers** — `widget: relation` pointing
  at the categories/tags collections. New categories added by the editor
  appear in the picker immediately.
- **Data-driven select vs static enum** — folder-based collections (Categories,
  Tags) are the pattern that lets editors add options without touching the
  config file. Static `select` widgets are fine when the list truly won't
  change (e.g. image focus point: top/center/bottom).
- **Hint text on every non-obvious field** — a one-liner under each field
  saves the editor a support ticket. E.g. "Upload at least 600×600 for a
  sharp result."

---

## Templates & rendering

### The core loop (`src/index.njk`)

```njk
---
layout: layout.njk
title: Home
permalink: /
---

{% for section in home.sections %}
  {% include "custom-section.njk" %}
{% endfor %}
```

That's the whole home page template. All rendering logic lives in
`src/_includes/custom-section.njk`, which is a big `{% if section.type == "…" %}
… {% elif … %}` dispatch.

### Blog listing (`src/blog.njk` + `blog-sidebar.njk`)

Two-column `.blog-grid`:
- Left: `.posts` grid of post cards
- Right: `<aside class="blog-sidebar">` include with Categories widget +
  Tag cloud widget

Category badges and tag chips are `<a>`s linking to filter pages.

### Auto-generated filter pages

Pagination-based. `.eleventy.js` adds two collections that group posts:

```js
eleventyConfig.addCollection("postsByCategory", (c) => {
  const buckets = new Map();
  for (const post of c.getFilteredByGlob("src/posts/*.md")) {
    const name = post.data.category;
    if (!name) continue;
    if (!buckets.has(name)) buckets.set(name, []);
    buckets.get(name).push(post);
  }
  return Array.from(buckets, ([name, posts]) => ({ name, posts }));
});
// Same shape for postsByTag, looping post.data.tags || [].
```

Then `src/blog-category.njk` and `src/blog-tag.njk` paginate over those:

```njk
---
pagination:
  data: collections.postsByCategory
  size: 1
  alias: cat
permalink: "/blog/category/{{ cat.name | slugify }}/"
---
```

One page per record. Only categories/tags with ≥1 post produce a page —
unused categories from `src/_data/categories/` are skipped.

### The Tag heatmap

In `src/_includes/blog-sidebar.njk`, tag chips are sized in three tiers
(`sm` / `md` / `lg`) based on `tag.posts.length / maxPostCount`:

```njk
{% set _tagMax = 1 %}
{% for t in _tags %}{% if t.posts.length > _tagMax %}{% set _tagMax = t.posts.length %}{% endif %}{% endfor %}

{% for tag in _tags %}
  {% set _ratio = tag.posts.length / _tagMax %}
  {% set _tier = 'lg' if _ratio >= 0.66 else ('md' if _ratio >= 0.33 else 'sm') %}
  <a class="chip chip--{{ _tier }}" href="…">{{ tag.name }}</a>
{% endfor %}
```

Three tiers is enough visual variety; continuous font-size lerping looks noisy.

---

## Build pipeline

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push: { branches: [main] }
  workflow_dispatch:
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: false }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v5
        with: { enablement: true }      ← auto-enables Pages on first run
      - uses: actions/upload-pages-artifact@v3
        with: { path: _site }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: ${{ steps.deployment.outputs.page_url }} }
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

`enablement: true` on `configure-pages` means the first build auto-turns on
Pages with Source = GitHub Actions. No manual UI toggle required.

### Two deploy modes — one env var

Sites go through two stages: **test on the GitHub project URL first, cut
over to the custom domain once DNS is ready.** The two shapes look
different enough to break silently, so both are gated on a single env
var, `PATH_PREFIX`, and everything downstream keys off it.

| Mode | `PATH_PREFIX` | Site URL | Absolute asset URLs in HTML | `src/CNAME` in `_site/` |
|---|---|---|---|---|
| **Project-site testing** | `/<repo>/` | `<user>.github.io/<repo>/` | `/<repo>/css/style.css` | *not copied* |
| **Custom domain** | *unset* | `example.com` | `/css/style.css` | copied |

`.eleventy.js` does the wiring in one place — both the URL prefix
Eleventy emits and whether the CNAME file passes through:

```js
// pathPrefix — Eleventy prepends this to every URL emitted by the `| url`
// filter (which every template uses for internal links). Leave "/" default
// for custom-domain sites.
pathPrefix: process.env.PATH_PREFIX || "/",

// Ship CNAME only when building for a custom-domain deploy (PATH_PREFIX
// unset). Under a project-site deploy (github.io/<repo>/), a CNAME file
// causes GitHub Pages to redirect the github.io URL to the not-yet-
// configured custom domain — everything appears dead.
if (!process.env.PATH_PREFIX || process.env.PATH_PREFIX === "/") {
  eleventyConfig.addPassthroughCopy("src/CNAME");
}
```

The workflow simply sets or omits the env var:

```yaml
      # Project-site testing (github.io/<repo>/):
      - run: npm run build
        env:
          PATH_PREFIX: /repo-name/

      # Custom-domain go-live: delete the env: block, that's it.
      - run: npm run build
```

**Cutting over from project-site testing to custom domain:**

1. Point DNS at GitHub Pages (see §4 DNS + custom domain below), wait for
   propagation.
2. Set the domain in **repo Settings → Pages → Custom domain**, wait for
   the green check and HTTPS provisioning (up to 24h).
3. Delete the `env: PATH_PREFIX` block from `deploy.yml`. Push. Done.

**Cutting back to project-site testing (rare, e.g. moving to another
domain):**

1. In **repo Settings → Pages → Custom domain**, click **Remove**. This
   is the sticky bit — GitHub keeps the setting even after CNAME stops
   shipping, until you clear it manually.
2. Re-add `env: PATH_PREFIX: /repo-name/` under `npm run build`. Push.

Without the `PATH_PREFIX` prefix, absolute asset paths (`/css/style.css`,
`/images/logo.png`) 404 on the project URL because they resolve to the
domain root instead of `<user>.github.io/<repo>/`. This is the "page
renders as unstyled HTML with broken images" symptom.

Without the CNAME gating, a CNAME file left in the deployed artifact
during project-site testing tells GitHub Pages to set the custom domain
and redirect the github.io URL to a domain whose DNS isn't ready yet —
same visible symptom, different cause.

---

## External services — the setup checklist

### 1. GitHub OAuth App (~5 min)

- GitHub Settings → Developer settings → OAuth Apps → **New**
- Homepage URL: your site URL
- Authorization callback URL: placeholder for now
  (`https://placeholder.example.com/callback`) — update after step 2
- Copy Client ID; generate + copy Client Secret

### 2. Cloudflare Worker OAuth proxy (~15 min)

Ready-to-deploy source lives in `oauth-worker/`. From that folder:

```bash
npm install                    # installs wrangler locally (no sudo)
npm run login                  # authorize wrangler in the browser
npm run secret:client-id       # paste Client ID at the prompt
npm run secret:client-secret   # paste Client Secret at the prompt
npm run deploy
```

- Copy the printed URL, e.g. `https://<name>.<account>.workers.dev`
- Go back to the GitHub OAuth App and update the callback URL to
  `https://<that-url>/callback`
- Update `src/admin/config.yml` `backend.base_url` to `https://<that-url>`
- **Do NOT reuse the same Worker across two OAuth apps** — the callback URL
  is fixed. One OAuth app + one Worker per site, unless you deliberately
  share (see notes on secret rotation coupling below).

The Worker is ~90 lines: `/auth` redirects to GitHub OAuth, `/callback`
exchanges the code + secret for a token, posts the token to the opener
window. See `oauth-worker/worker.js`.

### 3. Google Apps Script Web App — form handler (~20 min)

Source lives in `apps-script/`. This replaces the third-party form service
entirely: one script receives both forms, writes to a Sheet, and emails.

**Setup:**

1. Create a Google Sheet named `Shaolin Hung Gar — Enquiries`. Add two
   tabs: `free-trial` and `book-lion-dance`. Row 1 of each holds the
   column headers, matching the field names the form submits.
2. In the Sheet: **Extensions → Apps Script**. Paste `apps-script/Code.gs`.
3. **Project Settings → Script Properties** — add:
   - `NOTIFY_FREE_TRIAL` — comma-separated recipients for trial signups
   - `NOTIFY_LION_DANCE` — comma-separated recipients for booking enquiries
   - `SHEET_ID` — the Sheet's ID from its URL
   Recipients live here, not in the script body, so staff changes don't
   require a redeploy.
4. **Deploy → New deployment → Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
   ⚠️ "Anyone with a Google account" silently fails for logged-out
   visitors — it must be **Anyone**.
5. Authorize the scopes when prompted (Sheets + Send email as you).
6. Copy the `/exec` URL into `src/_data/forms.json` as `endpoint`.

**Redeploying:** always use **Manage deployments → edit the existing
deployment → Version: New version**. Choosing "New deployment" mints a
*different* `/exec` URL and silently breaks the live form.

**What the form sends** — a `fetch()` POST, `Content-Type: text/plain`,
body is `JSON.stringify()` of:

```js
{
  form_type: "free-trial" | "book-lion-dance",
  name: "", email: "", organization: "",
  inquiry_type: "",            // book-lion-dance only
  event_date: "2026-09-14",    // YYYY-MM-DD string, never a Date object
  event_time: "",              // time band, not a precise slot
  details: "",
  website: ""                  // honeypot — must be empty
}
```

**Server-side rules (`doPost`):**

- Reject if `website` is non-empty — that's the honeypot, and it must be
  checked here, not just hidden with CSS.
- Reject if `form_type` isn't one of the two known values.
- Send dates as `YYYY-MM-DD` **strings**. Passing a `Date` shifts by the
  script's timezone and lands bookings on the wrong day.
- Return `ContentService.createTextOutput(JSON.stringify({ok:true}))`
  with MIME type `JSON` so the browser can read a real result.
- Wrap the whole handler in try/catch and log failures to a `_errors`
  tab — a thrown exception returns an HTML error page the front end
  can't parse.

**Quota:** `MailApp` allows 100 recipients/day on consumer Gmail, 1,500
on Workspace. Each submission notifying 3 staff + 1 confirmation to the
sender costs 4.

### 4. DNS + custom domain (~15 min + up to 24h for TLS cert)

This step is the second half of the project-site → custom-domain cutover
described in [Two deploy modes](#two-deploy-modes--one-env-var). While
`PATH_PREFIX` is still set on the build, the site keeps living at the
github.io URL and this step is a no-op.

- `src/CNAME` already exists in the template (single line, no protocol,
  e.g. `example.com`) and passes through automatically when `PATH_PREFIX`
  is unset. Nothing to add.
- Repo → Settings → Pages → **Custom domain** → enter the domain → **Save**
- DNS at your registrar:
  - Apex: four A records → `185.199.108.153`, `185.199.109.153`,
    `185.199.110.153`, `185.199.111.153`
  - `www`: CNAME → `<user>.github.io`
- Wait for GitHub's DNS check to pass
- Enable **Enforce HTTPS** once the cert issues (up to an hour, sometimes
  longer)
- Delete the `env: PATH_PREFIX` block from `.github/workflows/deploy.yml`.
  Push. `.eleventy.js` starts shipping the CNAME on the next build and
  the github.io URL redirects to the custom domain.
- **Only ONE repo can claim a given custom domain** at a time — if you
  transfer, clear the setting on the losing repo first

---

## Local development

Two-terminal workflow:

```bash
npm install       # once
npm start         # terminal 1: Eleventy dev server on :8080
npm run cms       # terminal 2: Decap proxy on :8081, no login needed locally
```

Then `http://localhost:8080/admin/` opens the CMS with no auth prompt —
Decap auto-detects the local proxy and reads/writes directly to your git
working tree. Save in the CMS → files change on disk → Eleventy rebuilds →
browser refreshes.

The `local_backend: true` line in `admin/config.yml` is what enables this.
It's ignored on the deployed site (GitHub OAuth still handles auth there).

---

## Known gotchas (things we hit while building this)

### 1. `crypto.randomUUID is not a function` in the CMS
The Decap admin JS uses `crypto.randomUUID`, which browsers only expose in
**secure contexts (HTTPS or localhost)**. If you visit `http://<domain>/admin/`
the CMS fails to init. Fix: enforce HTTPS on the GitHub Pages custom domain,
or always use `https://` when visiting `/admin/`.

### 2. `tags` is a reserved Eleventy keyword
Eleventy uses `tags:` frontmatter to build collections
(`{% for post in collections.posts %}`). If you also use `tags:` for
user-facing content tagging (as we did), the two collide — Eleventy's
internal collection identifier leaks into the visible tag list.

Fix: **build the `posts` collection from a glob** in `.eleventy.js`
(`collection.getFilteredByGlob("src/posts/*.md")`) and drop the
`tags: ["posts"]` line from `src/posts/posts.json`. Now `tags:` is 100%
user-facing.

### 3. Jekyll runs by default on GitHub Pages
Setting a custom domain via the Pages UI has a known quirk where **Source can
flip back to "Deploy from a branch"** — which triggers Jekyll on the raw
source. Jekyll tries to parse `.njk` as Liquid and dies on `{% set %}`.

Two mitigations, apply both:
- Add `.nojekyll` at the **repo root** (not just in `src/`) — even if Jekyll
  is invoked, it exits immediately
- Verify Pages Source is set to **GitHub Actions**, not "Deploy from a branch"

### 4. Project-site subdirectory paths (and CNAME cross-talk)
GitHub Pages serves a repo at `<user>.github.io/<repo>/` if there's no
custom domain. Absolute paths like `/css/style.css` in your HTML then 404
because they resolve to the domain root — the page renders as unstyled
HTML with broken images.

Compounding trap: if `src/CNAME` also ships to `_site/` during that same
project-site testing phase, GitHub Pages sees it and redirects the
github.io URL to the domain named in the file — a domain whose DNS
usually isn't ready yet during testing. The user sees a dead page and
can't tell which failure mode they're hitting.

Fix: both are gated on the same `PATH_PREFIX` env var — set it during
testing, unset it after the custom domain goes live. See
[Two deploy modes — one env var](#two-deploy-modes--one-env-var) for the
`.eleventy.js` wiring and the cutover checklist.

### 5. macOS `npm install -g` permission errors
`npm install -g wrangler` fails with `EACCES` on default macOS setups (npm's
global prefix is root-owned `/usr/local/lib/node_modules`). Don't use `sudo`.

Fix: install wrangler locally as a devDependency in `oauth-worker/`, expose
it via npm scripts (`npm run login`, `npm run deploy`, etc.). No global
install needed.

### 6. Never paste OAuth secrets into files
`wrangler secret put OAUTH_CLIENT_SECRET` **prompts** for the value at the
terminal — it doesn't take it as an argument. Editing a config file with
the raw secret is the wrong pattern; the secret lives only in Cloudflare's
encrypted store. `.gitignore` these anyway as belt-and-suspenders:

```
.env
.env.*
.dev.vars      # wrangler local secrets
.wrangler/     # wrangler state cache
*.pem
*.key
```

### 7. Hot-linked assets are fragile
If your images point at some other domain (a WordPress host, a CDN you
don't control), one DNS change or hosting cancellation breaks every
reference. Always **commit images into `src/images/`** rather than
hot-linking.

### 8. Only one repo can claim a custom domain
The custom-domain field in Pages Settings writes a `CNAME` file to the
repo. If two repos both have that CNAME, only one wins. **Clear the domain
from the losing repo before setting it on the new one**, or accept a brief
404 window during handoff.

### 9. Pages Source silently reverts from "GitHub Actions" to "Deploy from a branch"
The Pages configuration has a `build_type` field: `workflow` (this template's
setup — Actions builds and uploads the artifact) or `legacy` (deploy directly
from a repo branch). Changing an *unrelated* Pages setting via the UI —
notably clearing a custom domain — can silently flip `build_type` back to
`legacy`. When that happens, workflow runs still succeed (the artifact
uploads fine), but Pages serves the wrong thing: legacy mode reads from the
`main` branch root, which has no `index.html` at the top level, so the site
returns a 404 across the board.

The dead giveaway: `gh api "repos/<owner>/<repo>/pages"` shows
`"build_type": "legacy"` when it should be `"workflow"`.

Fix immediately: `gh api -X PUT "repos/<owner>/<repo>/pages" -f
"build_type=workflow"` — then re-trigger the workflow so the artifact goes
live under the new mode. Prevention: the deploy workflow now includes a
"Force Pages source to workflow mode" step that PUTs `build_type=workflow`
on every run, self-healing this silently if it ever flips again.

### 10. `/admin/` "Server Not Found" on the hosted site
The template ships with `backend.base_url:
https://replace_me_with_your_oauth_worker.workers.dev` in
`src/admin/config.yml` as a placeholder. Until you deploy the Cloudflare
Worker (§2 of External services above) and update that value to the
Worker's real URL, hitting the hosted `/admin/` fails at the "Login with
GitHub" step with a "Server Not Found" browser error trying to reach the
placeholder host.

This is a **hosted-only** failure — local `npm run cms` uses
`local_backend: true` and doesn't touch the OAuth Worker at all, so the
CMS works locally on Day 1. That gap between local-works and
hosted-doesn't is what makes this confusing the first time. Fix by
finishing the Worker deploy and pasting the printed
`<name>.<account>.workers.dev` URL into `backend.base_url`.

---

## Reproduction checklist for a new site

For someone spinning up a fresh copy of this stack:

1. **Clone this repo to a new folder, wipe `.git`, `git init`, push to a
   new GitHub repo.** Or fork on GitHub if history isn't sensitive.
2. **Rename**: `src/_data/site.json` (all fields), `src/CNAME` (or delete
   if no custom domain), `oauth-worker/wrangler.toml` (unique Worker
   `name:`).
3. **Register a new GitHub OAuth App** for the new repo — placeholder
   callback URL for now.
4. **Deploy the Worker** from `oauth-worker/`:
   `npm install && npm run login && npm run secret:client-id && npm run
   secret:client-secret && npm run deploy`. Note the Worker URL.
5. **Update GitHub OAuth App** callback URL → `<worker>/callback`.
6. **Update `src/admin/config.yml`**:
   - `backend.repo: adrianwongstudio/shaolinhunggarkungfu.com`
   - `backend.base_url: https://<worker>`
7. **Deploy the Apps Script Web App** (§3 above): create the Sheet with
   `free-trial` and `book-lion-dance` tabs, paste `apps-script/Code.gs`,
   set Script Properties, deploy as Web app with access = **Anyone**, then
   put the `/exec` URL into `src/_data/forms.json`.
8. **DNS + domain**: A records to GH Pages IPs, add domain in Settings →
   Pages → Custom domain.
9. **Wipe placeholder content**: seed `src/_data/home.json` with the
   sections the new site needs, replace posts in `src/posts/`, upload real
   images via the CMS.
10. **First push to `main`** triggers the Actions workflow, Pages
    auto-enables, site publishes. Enable "Enforce HTTPS" once the cert
    provisions.

Time from empty new repo to live site: **~1.5–2 hours**, most of that
waiting on TLS provisioning.

---

## Shaolin Hung Gar — additions to the original blueprint

Everything above describes the inherited template. This section covers what
is new or changed for this build. Design source:
[Figma — Shaolin Hung Gar](https://www.figma.com/design/3OgVZihfAQVd1DqEIQTZF2/Shaolin-Hung-Gar).

### Design tokens

```css
:root {
  --red:       #c82229;   /* primary brand / calligraphy red */
  --red-dark:  #a61b21;   /* hover state for red elements */
  --gold:      #ffc800;   /* CTA button background */
  --gold-dark: #e6b400;   /* hover state for gold buttons */
  --ink:       #000000;   /* main text & menu links */
  --muted:     #4a4a4a;   /* secondary text */
  --line:      #e5dfd5;   /* borders & dividers */
  --bg-cream:  #f7f4ee;   /* main website background */
  --bg-soft:   #ede7dc;   /* subtle section background */
  --white:     #ffffff;

  --radius:    10px;      /* ALL images, sliders, cards — see below */
}
```

**Contrast constraint:** `--gold` on `--white` or `--bg-cream` measures
roughly **1.5:1**, far below the WCAG AA minimum of 4.5:1. Gold is a
*background* colour behind `--ink` text, or a large-format accent. It must
never be used for body-size text on a light surface. `--red` on
`--bg-cream` measures ~5.6:1 and is safe for text.

### Corner radius — global rule

`--radius: 10px` applies to every image and slider surface: hero slides,
feature and service card images, team photos, blog cards, blog featured
images, gallery tiles, and `two_column` section images. It does **not**
scale down on mobile — a fixed value reads as a system decision rather
than a proportional effect.

Two implementation traps:

- Slider frames need `overflow: hidden` alongside the radius, or slides
  square off the corners at the container edge.
- Safari does not clip a `transform`ed child against a rounded parent. If
  the slider animates with `translateX()`, slides will bleed past the
  corner. Fix with `isolation: isolate` on the frame, or apply the radius
  to each slide rather than the frame.

### Responsive scale

The original template had a single 900px breakpoint, collapsing 3-column
grids straight to 1. That is replaced with a five-step scale:

| Token | Width | Layout intent |
|---|---|---|
| `sm` | ≤ 479px | Single column, compact type, stacked CTAs |
| `md` | 480–767px | Single column, comfortable type, inline CTAs |
| `lg` | 768–1023px | 2-column grids, blog sidebar drops below content |
| `xl` | 1024–1279px | 3-column grids, sidebar returns to the right |
| `2xl` | ≥ 1280px | Full desktop, content width capped |

Pick one direction and hold it. The existing CSS is desktop-first
(`max-width`); if Tailwind is introduced it is mobile-first (`min-width`).
Mixing both in one stylesheet is a reliable source of specificity bugs.

### Sticky header + mobile menu

Desktop (≥1024px): the dark top bar (phone / email / address) scrolls away
normally; the main header pins to the top with `position: sticky`. On
scroll past 80px it gains a shadow and reduces vertical padding. Use an
`IntersectionObserver` on a sentinel element rather than a scroll listener
— it avoids layout thrash on every frame.

Mobile (<1024px): hamburger opens a full-screen overlay (matching the
reference pattern at vancouverliondance.com). Requirements:

- `<body>` gets `overflow: hidden` while open, or the page scrolls behind
  the overlay
- Focus trap inside the overlay; `Esc` closes it
- Focus returns to the hamburger button on close
- Button carries `aria-expanded` and `aria-controls`
- `prefers-reduced-motion` disables the slide transition

Sticky headers also require `scroll-margin-top` on every in-page anchor
target, or jump links land underneath the header.

### Blog pagination

Real post pagination did not exist in the template — the `pagination:`
blocks in the original only generated one page per category. Full build
spec is in [`PAGINATION.md`](./PAGINATION.md). Summary:

- `/blog/` paginates at 9 posts per page → `/blog/page/2/`, `/page/3/`…
- Category and tag filter pages nest pagination inside them
- Shared `_includes/pagination.njk` partial renders the pager
- `rel="prev"` / `rel="next"` in `<head>`; canonical points at the
  paginated URL, not `/blog/`

### Forms

Two forms, one Apps Script endpoint (§3 of External services above).

**`/free-trial/`** — 4 fields: Name, Email, Phone, Preferred Class Time.
Deliberately short; a trial signup that asks 8 questions converts badly.

**`/book-lion-dance/`** — 8 fields: Name, Email, Type of Inquiry
(Corporate Event / Grand Opening / Wedding / Other), Event Date, Time,
Organization, Details.

Notes:

- Event Date and Time are required only on the booking form.
- "Time" is a band (Morning / Afternoon / Evening / Flexible), not a
  precise slot. Discrete slots imply a real availability system that
  does not exist.
- Success is an **inline** state, not a redirect. `/thanks/` remains as a
  no-JS `<form action>` fallback target only.

### Date picker — decision

**Chosen: [Duet Date Picker](https://github.com/duetds/date-picker)**,
vendored into `src/js/vendor/duet/`.

The Figma booking frame shows a styled calendar widget. A bare
`<input type="date">` cannot produce it — the native calendar dropdown is
rendered by the browser and is almost entirely unstyleable, and it looks
different in every browser. Desktop Firefox and Safari are notably weaker
than Chrome. So the design as drawn requires a custom picker.

**Why Duet over the alternatives:**

| Option | Verdict |
|---|---|
| **Duet Date Picker** | ✅ Chosen. Web component — no framework needed, which matters on an Eleventy/Nunjucks site. Built specifically against WCAG 2.1. ~10kb gzipped, zero dependencies. Themed entirely through CSS custom properties, so it inherits `--red` / `--gold` / `--radius` directly. |
| Flatpickr | Most popular and very styleable, but its accessibility is genuinely weak — long-standing screen-reader and keyboard-navigation gaps. Rejected on that basis alone. |
| Vanilla JS Datepicker | Solid zero-dependency option with accessible markup, and a reasonable fallback if Duet is ruled out. Theming is more manual. |
| WCAG-Pikaday | A fork of Pikaday created specifically to close Pikaday's WCAG gaps. Lightweight, but a fork of an older codebase. |
| Build our own | No. An accessible date grid needs roving tabindex, correct grid semantics, live-region announcements on month change, and screen-reader testing across three browsers. This is days of work to land worse than an audited component. |
| Native only | Loses the Figma design and is inconsistent across desktop browsers. |

**The decisive property — it degrades to a native input.** Duet renders
*over* a real `<input>`. If the script fails, is blocked, or hasn't loaded
yet, the field is still a working date input and the form still submits.
That satisfies the faster-loading goal: the script is `type="module"` +
`defer`, costs nothing on the critical path, and the form is functional
before it arrives.

**Maintenance risk, stated honestly.** Duet's upstream repo has been quiet
for some time, and "is this still maintained?" has been asked publicly.
The mitigation is that this matters much less than usual here: it is a
self-contained Web Component with **no dependency tree**, built on a
stable platform API. There is nothing to rot — no transitive packages to
patch, no framework version to track. Vendor a pinned copy into
`src/js/vendor/duet/` rather than relying on a CDN, and the component
cannot change underneath the site. If it ever does need replacing, the
native-input fallback means the form keeps working during the swap.

**Implementation requirements:**

```html
<label for="event-date">Event date</label>
<duet-date-picker
  identifier="event-date"
  name="event_date"
  required
  min="2026-08-02"          <!-- today, injected at build time -->
  first-day-of-week="0"     <!-- Sunday, matching the Figma frame -->
></duet-date-picker>
```

- **Value format is `YYYY-MM-DD`** — Duet's `value` is already an ISO date
  string, not a `Date`. Submit it verbatim. This is what avoids the
  timezone-shift bug that lands bookings one day off.
- **`min` = today**, injected at build time via an Eleventy shortcode. A
  hardcoded date silently expires.
- **Theme via CSS custom properties** in `style.css` — map Duet's
  variables onto the brand tokens so the picker inherits `--red` for the
  selected day, `--gold` for focus, and `--radius: 10px` on the popover.
  Do not fork Duet's stylesheet; it makes future updates unmergeable.
- **Selected-day contrast:** the selected date must not be gold-on-white
  (≈1.5:1). Use `--red` background with white text.
- **Tap targets:** day cells need a 44×44px minimum. Duet's defaults are
  smaller — override them.
- **`prefers-reduced-motion`** disables the popover transition.
- Keep the visible `<label>`; placeholder text is not a label.

**Time field.** Stays a plain `<select>` of bands — Morning / Afternoon /
Evening / Flexible. Do not pair the date picker with a time picker; a
precise time slot implies a real availability system that does not exist,
and an enquiry form does not need one.

**Sources:**
[Duet Date Picker repo](https://github.com/duetds/date-picker) ·
[Duet Design System docs](https://www.duetds.com/components/date-picker/) ·
[DigitalA11Y accessible date picker roundup](https://www.digitala11y.com/accessible-date-pickers-roundup/) ·
[Web Axe: Accessible Date Pickers](https://www.webaxe.org/accessible-date-pickers/)

---

## Files worth reading first when opening this codebase

For anyone new to the code, in order:

1. `.eleventy.js` — the whole build config in one 60-line file
2. `src/admin/config.yml` — the CMS schema, i.e. the shape of your content
3. `src/index.njk` — the entire home page (just a loop over sections)
4. `src/_includes/custom-section.njk` — every section type's rendering
5. `src/_includes/layout.njk` — site chrome (nav, footer)
6. `src/css/style.css` — one CSS file; color tokens at the top
7. `.github/workflows/deploy.yml` — the deploy pipeline
8. `oauth-worker/worker.js` — the auth proxy

Everything else is either data (`src/_data/**`, `src/posts/**`, `src/images/**`)
or a small template variation.
