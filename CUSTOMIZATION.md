# Customization — make it yours

This repo doubles as a **template for small-business marketing sites**.
This doc walks a developer through forking it for a new client:
rebrand, retheme, adjust the content model, add pages, extend the
CMS. Assumes you've read [`README.md`](./README.md) and skimmed
[`design.md`](./design.md).

If you're new to the stack, [`design.md`](./design.md) is the map;
this doc is the how-to.

---

## Table of contents

1. [The 5-minute rebrand](#the-5-minute-rebrand)
2. [Fork it — one-time repo setup](#fork-it--one-time-repo-setup)
3. [Colors, fonts, logo](#colors-fonts-logo)
4. [Site info & contact details](#site-info--contact-details)
5. [Home page — reshape the sections](#home-page--reshape-the-sections)
6. [Nav + top bar + footer](#nav--top-bar--footer)
7. [Adding a new page](#adding-a-new-page)
8. [Adding a new section type](#adding-a-new-section-type)
9. [Blog: categories, tags, filter pages](#blog-categories-tags-filter-pages)
10. [Adding a custom field to blog posts](#adding-a-custom-field-to-blog-posts)
11. [Changing the mobile breakpoint](#changing-the-mobile-breakpoint)
12. [External services setup for the new site](#external-services-setup-for-the-new-site)
13. [Ship checklist](#ship-checklist)

---

## The 5-minute rebrand

For the impatient — the fastest path to a visibly different site:

| Change this | In this file |
|---|---|
| Business name, tagline, phone, email, address | `src/_data/site.json` |
| Logo | Upload via CMS → Site Settings → Logo, or drop a file in `src/images/` and set `site.json` `logo:` to `/images/<file>` |
| Primary color (red) | `src/css/style.css` — `--red: #c82229;` |
| Accent color (gold) | `src/css/style.css` — `--gold: #ffc800;` |
| Home page copy | `src/_data/home.json` — edit `sections[]` |
| Blog posts | Delete `src/posts/*.md`, add your own |
| Custom domain | `src/CNAME` (single line, e.g. `example.com`) |

That's the surface-level rebrand. Below is the deeper work.

---

## Fork it — one-time repo setup

For a completely new client (call them `acme-widgets`):

**Option A: fresh git history** (recommended for a new client — no
prior commit messages to explain)

```bash
git clone https://github.com/adrianwongstudio/shaolinhunggarkungfu.com.git acme-widgets
cd acme-widgets
rm -rf .git
git init
git add .
git commit -m "Initial commit from template"
```

Then create an empty new GitHub repo `acme-widgets` (no README/gitignore/LICENSE
— the template already has them), and push:

```bash
git remote add origin https://github.com/<your-user>/acme-widgets.git
git branch -M main
git push -u origin main
```

**Option B: preserve template history** (useful if you want to pull
future template updates via `git merge`)

```bash
git clone https://github.com/adrianwongstudio/shaolinhunggarkungfu.com.git acme-widgets
cd acme-widgets
git remote rename origin template
git remote add origin https://github.com/<your-user>/acme-widgets.git
git push -u origin main
# Later, to pull template updates: `git fetch template && git merge template/main`
```

**After either option**, before the first push:

1. Follow [`CLOUDFLARE-PAGES-SETUP.md`](./CLOUDFLARE-PAGES-SETUP.md) to
   point a new Cloudflare Pages project at the new repo. First build
   runs automatically; site is live at `<project>.pages.dev` in ~60
   seconds. Custom domain gets added later in the same dashboard.
2. `src/CNAME` doesn't exist any more — Cloudflare Pages manages the
   custom domain in-dashboard, not via a repo file. Nothing to do
   here.

---

## Colors, fonts, logo

**Colors** live as CSS custom properties at the top of `src/css/style.css`:

```css
:root {
  --red: #c82229;        ← primary brand / calligraphy red
  --red-dark: #a61b21;   ← hover state for red elements
  --gold: #ffc800;       ← CTA button background
  --gold-dark: #e6b400;  ← hover state for gold buttons
  --ink: #000000;        ← main text & menu links
  --muted: #4a4a4a;      ← secondary text
  --line: #e5dfd5;       ← borders & dividers
  --bg-cream: #f7f4ee;   ← main website background
  --bg-soft: #ede7dc;    ← subtle section background
  --white: #ffffff;
  --radius: 10px;        ← ALL images, sliders, cards
  ...
}
```

**This block is authoritative** for Shaolin Hung Gar Kung Fu. The
"5-minute rebrand" table above points at the same two values.

Change these 5 lines and the whole site retones. Keep the roles the same
(dark primary, one accent) — the layout depends on that contrast.

⚠️ **`--gold` is not an accessible text colour.** `#ffc800` on `--white`
or `--bg-cream` measures ~1.5:1, well under the WCAG AA floor of 4.5:1.
Use gold as a *background* behind `--ink`, or as a large decorative
accent — never for body copy on a light surface. `--red` on `--bg-cream`
measures ~5.6:1 and is safe for text.

**Fonts** — currently system fonts:

```css
--font: Roboto, sans-serif;
--serif: Georgia, "Times New Roman", serif;
```

To use a web font, add a `<link rel="stylesheet">` for it in `src/_includes/layout.njk`'s
`<head>` (right where the stylesheet link lives), then update `--font` /
`--serif`. **Do not use `@import` in CSS** — it blocks render. `<link>` is
faster.

**Logo** — two paths:

- **Via CMS**: Site Settings → Logo → upload. Ends up at
  `/images/<name>` and referenced from `site.json`.
- **Direct**: drop the file into `src/images/`, set `"logo": "/images/<name>"`
  in `src/_data/site.json`.

The logo is rendered in the header at `max-height: 54px` (see `.brand img` in
`style.css`) — sized SVGs or PNGs at 2× (108px tall source) work best.

---

## Site info & contact details

`src/_data/site.json` is the source of truth. Every template pulls from it
via `{{ site.name }}`, `{{ site.phone }}`, etc.

```json
{
  "name": "Acme Widgets",
  "tagline": "Widgets that just work",
  "description": "One-line description used in <meta> and footer.",
  "phone": "+1 (555) 123 4567",
  "email": "hello@acme.com",
  "email_secondary": "",
  "address": "123 Any St, Anytown",
  "logo": "/images/acme-logo.svg"
}
```

**Phone**: the `tel:` link is derived from `site.phone` via
`| replace(' ','')` etc. — it strips spaces, parens, dashes. So displayed
`+1 (555) 123 4567` becomes `tel:+15551234567`. Keep the format human;
the code handles the machine version.

**Secondary email**: leave empty (`""`) and it hides on the contact page.

---

## Home page — reshape the sections

The home page is a list of blocks in `src/_data/home.json`:

```json
{
  "sections": [
    { "type": "hero_slider", "slides": [ ... ] },
    { "type": "consultation_banner", ... },
    { "type": "feature_cards", "cards": [ ... ] },
    ...
  ]
}
```

**Reorder** — swap items in the array.
**Delete** — remove one.
**Add** — insert an object with a `type` from the 13 supported types.

Full list of section types and their fields is in
[`design.md`](./design.md#content-model). Or open Decap CMS locally
(`npm start` + `npm run cms`, `/admin/`) — the "Add Section" dropdown
shows every option with its fields.

**Editors should do most of this via the CMS**, not by hand-editing the
JSON. The CMS validates the shape and prevents typos.

---

## Nav + top bar + footer

All three live in `src/_includes/layout.njk`. Search for these landmarks:

- `<!-- Top bar -->` — the dark strip with phone/email/address. Add/remove
  `<li>` items here.
- `<!-- Header -->` — logo + main nav. For this site the nav carries all
  eight routes: `/`, `/kung-fu/`, `/lion-dance/`, `/gallery/`, `/blog/`,
  `/about/`, `/free-trial/`, `/book-lion-dance/`. The last two render as
  buttons, not plain links — they're the conversion paths. Add more
  `<a href="/some-page/">Label</a>` inside `<nav class="nav" id="nav">`.
  The header is sticky on desktop and collapses to a full-screen overlay
  below 1024px — see [`design.md` → Sticky header + mobile
  menu](./design.md#sticky-header--mobile-menu).
- `<!-- Footer -->` — three columns. Second column is the Quick Links list;
  add matching entries when you add pages.

The `active` class is toggled with `{{ 'active' if page.url == '/some-page/' }}`.
Follow the pattern.

---

## Adding a new page

For a static page like "About Us":

1. Create `src/about.njk`:
   ```njk
   ---
   layout: layout.njk
   title: About Us
   permalink: /about/
   description: What we do and who we are.
   ---

   <section class="page-hero">
     <div class="wrap">
       <span class="eyebrow">About</span>
       <h1>Our Story</h1>
     </div>
   </section>

   <section class="section">
     <div class="wrap">
       <div class="prose">
         <p>Content goes here…</p>
       </div>
     </div>
   </section>
   ```
2. Add `<a href="/about/">About</a>` to `src/_includes/layout.njk`'s
   `<nav class="nav">`.
3. Add the same to the footer's Quick Links list.
4. If the page has content that editors should manage, either:
   - Bake the copy into the template (fine for a rarely-updated page), **or**
   - Add a new files-based collection to `src/admin/config.yml` pointing at
     e.g. `src/_data/about.json` and pull `{{ about.heading }}` in the
     template.

Reuse the existing classes: `.page-hero`, `.section`, `.section--soft`
(alt bg), `.section--ink` (dark bg), `.wrap` (max-width container),
`.prose` (article body styling). See `src/css/style.css`.

---

## Adding a new section type

Say you want a "video embed" section on the home page:

**1. Add the type to `src/admin/config.yml`** — inside the Page Sections
list's `types:` array:

```yaml
- label: "Video Embed"
  name: "video_embed"
  widget: "object"
  summary: "Video — {{fields.heading}}"
  fields:
    - { label: "Heading (optional)", name: "heading", widget: "string", required: false }
    - { label: "Video URL (YouTube or Vimeo embed URL)", name: "url", widget: "string", hint: "Paste the embed URL, not the watch URL. YouTube: https://www.youtube.com/embed/VIDEO_ID" }
    - { label: "Caption (optional)", name: "caption", widget: "text", required: false }
```

**2. Add the render branch to `src/_includes/custom-section.njk`** — add
a new `{% elif %}` at the end of the switch:

```njk
{% elif section.type == "video_embed" %}
<section class="section">
  <div class="wrap">
    {% if section.heading %}<h2 style="text-align:center;">{{ section.heading }}</h2>{% endif %}
    <div class="video-embed">
      <iframe src="{{ section.url }}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    </div>
    {% if section.caption %}<p style="text-align:center; color: var(--muted); margin-top: 16px;">{{ section.caption }}</p>{% endif %}
  </div>
</section>
```

**3. Add CSS to `src/css/style.css`** (near the other custom section
styles, look for `/* Custom sections (editor-added) */`):

```css
.video-embed {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 */
  height: 0;
  border-radius: var(--radius);
  overflow: hidden;
}
.video-embed iframe {
  position: absolute; top: 0; left: 0;
  width: 100%; height: 100%;
  border: 0;
}
```

**4. Test locally** — `npm start` + `npm run cms`, add a Video Embed
section via the CMS, verify it renders. See
[`testing.md`](./testing.md#cms-testing-local-no-login).

Same 4-step pattern for any new type: schema in `config.yml`, render in
`custom-section.njk`, styles in `style.css`, test.

---

## Blog: categories, tags, filter pages

**Categories and tags are managed by editors**, not devs. Editors open
the "Categories" or "Tags" section in the CMS sidebar and add/rename/delete
freely. Each becomes a tiny YAML file in `src/_data/categories/` or
`src/_data/tags/`.

**Filter pages generate automatically.** `.eleventy.js` groups posts into
`postsByCategory` and `postsByTag` collections; `src/blog-category.njk`
and `src/blog-tag.njk` paginate over them at
`/blog/category/<slug>/` and `/blog/tag/<slug>/`.

**The sidebar** — Categories list + Tags heatmap — lives in
`src/_includes/blog-sidebar.njk`. Rendered on `/blog/`, category
filter pages, and tag filter pages.

To change the tag-cloud sizing tiers (currently 3 tiers based on ratio to
max post count), edit the ratio thresholds in `blog-sidebar.njk`:

```njk
{% set _tier = 'lg' if _ratio >= 0.66 else ('md' if _ratio >= 0.33 else 'sm') %}
```

Corresponding font sizes are `.chip--sm/md/lg` in `style.css`.

---

## Adding a custom field to blog posts

Example: add an author bio blurb per post.

**1. Extend the CMS schema in `src/admin/config.yml`** — inside the Blog
Posts collection:

```yaml
- { label: "Author Bio", name: "author_bio", widget: "text", required: false, hint: "One-paragraph bio shown at the bottom of the post." }
```

**2. Render it in `src/_includes/post.njk`** — add before the back link:

```njk
{% if author_bio %}
<div class="author-bio">
  <p><strong>About the author:</strong> {{ author_bio }}</p>
</div>
{% endif %}
```

**3. Style it in `src/css/style.css`:**

```css
.author-bio {
  background: var(--bg-soft);
  padding: 20px;
  border-radius: var(--radius);
  margin: 2em 0;
}
```

**4. Rebuild locally** — `npm run build`. Existing posts without the
field render fine (the `{% if %}` guard skips).

Same pattern for any new post field — CMS field, template render, optional
CSS, test.

---

## Changing the mobile breakpoint

> **Superseded for this site.** The single-breakpoint approach below is
> the inherited template's. Shaolin Hung Gar Kung Fu uses a five-step
> scale (479 / 767 / 1023 / 1279px) — see
> [`design.md` → Responsive scale](./design.md#responsive-scale). The
> section is kept because the reasoning still applies to any site forked
> from the original template.

There's **one breakpoint**, at 900px, in `src/css/style.css`:

```css
@media (max-width: 900px) {
  .features .grid, .services .grid, .posts, .footer .grid, .blog-grid { grid-template-columns: 1fr; }
  ...
}
```

Change `900px` in both `@media` queries (there may be more than one
depending on future additions) and test at the new breakpoint. Verify no
horizontal scroll at 375px viewport — see
[`testing.md`](./testing.md#responsive--cross-viewport-check).

---

## Deploy: Cloudflare Pages (one dashboard flow, no per-mode fiddling)

Cloudflare Pages watches the `main` branch and builds on every push.
GitHub only stores the code; Cloudflare serves the site. Setup is a
one-time dashboard flow — see
[`CLOUDFLARE-PAGES-SETUP.md`](./CLOUDFLARE-PAGES-SETUP.md) for the full
walk-through. Summary:

1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect
   to Git.
2. Pick the new client's repo.
3. Build command `npm run build`, output directory `_site`,
   `NODE_VERSION` `22`.
4. Save and Deploy.

Site is live at `<project>.pages.dev` in ~60 seconds. Custom domain
added in the same dashboard, HTTPS in ~1 minute.

The single in-repo change per new client: `src/admin/config.yml`
`site_url` → the client's `<project>.pages.dev` URL (and later, their
custom domain).

## Legacy: the retired GitHub Pages workflow

Every new client site goes through the same lifecycle: you build and
iterate on the GitHub project URL (fast — no DNS, no cert wait, changes
are live in ~90 seconds), then cut over to the client's real domain once
DNS is ready. This template ships with that switch baked in as a single
env var, `PATH_PREFIX`, so you don't have to remember two independent
places to change or hand-edit URLs.

### How the switch works

`.eleventy.js` reads `process.env.PATH_PREFIX` and does two things with
it in lockstep:

```js
// 1. Every internal URL gets prefixed with it (via the `| url` filter
//    that every template already uses).
pathPrefix: process.env.PATH_PREFIX || "/",

// 2. src/CNAME only ships to _site/ when the prefix is unset.
if (!process.env.PATH_PREFIX || process.env.PATH_PREFIX === "/") {
  eleventyConfig.addPassthroughCopy("src/CNAME");
}
```

That second gate matters: if a CNAME file ships during project-site
testing, GitHub Pages sets the custom domain and redirects the github.io
URL to a domain that isn't ready yet. Without the gate, one env var
would only be doing half the work and you'd have to remember to
comment/uncomment the passthrough by hand.

`.github/workflows/deploy.yml` sets the env var (or doesn't):

```yaml
# Mode 1 — project-site testing (default while you're building):
      - run: npm run build
        env:
          PATH_PREFIX: /acme-widgets/     ← must match the repo name

# Mode 2 — custom domain go-live:
      - run: npm run build                ← delete the env: block entirely
```

### Cutover checklist (project URL → custom domain)

Once DNS is ready for the client's domain:

1. Point DNS at GitHub Pages — apex A records to `185.199.108.153`,
   `185.199.109.153`, `185.199.110.153`, `185.199.111.153`; `www` CNAME
   to `<your-user>.github.io`. Wait for propagation.
2. In **repo Settings → Pages → Custom domain**, enter the domain, save.
   Wait for the green DNS check and HTTPS provisioning (up to 24h).
3. Confirm `src/CNAME` contains the correct domain (one line, no
   protocol, no trailing slash).
4. Delete the `env: PATH_PREFIX` block from `deploy.yml`. Push.

On the next build the CNAME ships, the URL prefix disappears, and
GitHub Pages redirects github.io/`<repo>`/ to the custom domain.

### Reverse checklist (custom domain → project URL)

Rare — usually only when moving a client to a new domain. Do it in this
order or the sticky Pages setting keeps redirecting:

1. In **repo Settings → Pages → Custom domain**, click **Remove**, save.
   This is the load-bearing step — GitHub keeps the custom domain
   configured even after the CNAME file stops shipping, and won't stop
   redirecting until you clear the field.
2. Add `env: PATH_PREFIX: /<repo>/` back to the `npm run build` step.
3. Push.

### Symptoms of a broken switch

- **Unstyled HTML, broken images, blue underlined links** — `PATH_PREFIX`
  isn't set but the site is being served at the project URL. Absolute
  `/css/style.css` paths 404 because they resolve to `<user>.github.io/`
  instead of `<user>.github.io/<repo>/`. Fix: add the env block.
- **github.io URL immediately redirects to a dead custom domain** — a
  CNAME file shipped during project-site testing and Pages picked it up.
  Fix: the gating in `.eleventy.js` prevents this going forward, but
  once the Pages UI setting is set it's sticky. Clear it in Settings →
  Pages → Custom domain → Remove.
- **After going live on the custom domain, some links still point at
  `/<repo>/`** — `PATH_PREFIX` is still in `deploy.yml`. Delete the env
  block and re-deploy.
- **Whole site 404s at the project URL even though the workflow succeeded** —
  Pages Source flipped from "GitHub Actions" to "Deploy from a branch"
  (legacy mode). Clearing a custom domain in the Pages UI can silently
  trigger this. Diagnose with `gh api "repos/<owner>/<repo>/pages"` — if
  `build_type` is `legacy` instead of `workflow`, that's the bug. The
  deploy workflow now self-heals on every run via a "Force Pages source
  to workflow mode" step, so this should only happen once per site (on
  the specific action that flipped it, before the next workflow run
  catches and fixes it).
- **`/admin/` shows "Server Not Found" trying to reach
  `replace_me_with_your_oauth_worker.workers.dev`** — the CMS on the
  *hosted* site is trying to auth against the placeholder OAuth Worker
  URL. Expected until you deploy the Cloudflare Worker (§ "External
  services setup" below) and update `src/admin/config.yml`
  `backend.base_url` to the printed `<name>.<account>.workers.dev` URL.
  Local `npm run cms` sidesteps this — it uses `local_backend: true` so
  no OAuth flow runs, which is why the CMS works locally on Day 1 but
  hosted CMS doesn't until you finish the Worker step.

---

## External services setup for the new site

Every new client site needs its own:

- **GitHub OAuth App** — one per site (callback URLs are fixed per app)
- **Cloudflare Worker** — one per OAuth App. Edit `oauth-worker/wrangler.toml`
  `name:` to something unique (e.g. `decap-oauth-proxy-acme`), then deploy
  from `oauth-worker/`. **Then paste the printed
  `<name>.<account>.workers.dev` URL into `src/admin/config.yml`
  `backend.base_url`**, replacing the
  `replace_me_with_your_oauth_worker.workers.dev` placeholder — until you
  do, the hosted `/admin/` login fails with a "Server Not Found" error.
  Local `npm run cms` isn't affected (it uses `local_backend: true`).
- **Google Apps Script Web App** — one per site. Bound to its own Google
  Sheet, with recipient lists in Script Properties. Deploy with
  *Execute as: Me* and *Who has access: **Anyone***. Full steps in
  [`design.md`](./design.md#3-google-apps-script-web-app--form-handler-20-min).
- **DNS** — if using a custom domain, A records to GitHub Pages IPs, plus
  the domain entered in Settings → Pages.

Full step-by-step for each is in
[`design.md`](./design.md#external-services--the-setup-checklist).

---

## Ship checklist

Before handing a new customized site to a client:

- [ ] `README.md` still accurate for this specific client
- [ ] `src/_data/site.json` filled in with real values, no placeholders
- [ ] `src/_data/home.json` populated with real sections
- [ ] Old template blog posts deleted, real ones written or migrated
- [ ] Cloudflare Pages project created and pointed at the repo (see
      [`CLOUDFLARE-PAGES-SETUP.md`](./CLOUDFLARE-PAGES-SETUP.md)) — build
      command `npm run build`, output `_site`, `NODE_VERSION=22`
- [ ] Custom domain added in Cloudflare Pages dashboard → Custom domains,
      HTTPS provisioned (usually <1 minute)
- [ ] `src/admin/config.yml` `site_url` matches the live URL (the
      `<project>.pages.dev` initially, then the custom domain once live)
- [ ] `src/admin/config.yml` `backend.repo` is exactly `<owner>/<repo-slug>`
      as it appears in the GitHub URL — NOT the target domain. Common trap:
      the template ships with a value that looks like `<owner>/example.com`
      because the original template's repo was named for its domain; if the
      new client's repo uses a project shortname (`acme-widgets`), that's
      the value to use. Getting this wrong fails *after* the OAuth login
      succeeds, with a "Repo not found" toast in `/admin/`.
- [ ] `src/admin/config.yml` `backend.base_url` points at the new OAuth Worker
- [ ] `src/_data/forms.json` `endpoint` points at the new Apps Script `/exec` URL
- [ ] Apps Script deployed with access = **Anyone** (not "Anyone with a Google account")
- [ ] Script Properties set: `SHEET_ID`, `NOTIFY_FREE_TRIAL`, `NOTIFY_LION_DANCE`
- [ ] Both forms tested end-to-end — row lands in the Sheet, staff email arrives, sender gets a confirmation
- [ ] Honeypot rejection verified server-side (submit with `website` filled → no row written)
- [ ] Blog pagination renders and every page number resolves (see [`PAGINATION.md`](./PAGINATION.md))
- [ ] `site.json` `logo` uploaded and rendering
- [ ] Team photos and blog featured images uploaded and rendering (see
      [`testing.md`](./testing.md#regression-checklist) — no hot-linked
      URLs to somewhere you don't control)
- [ ] GitHub Actions build passes on `main`
- [ ] Custom domain resolves and serves the site over HTTPS
- [ ] Contact form submission received by test
- [ ] CMS login works at `<domain>/admin/`
- [ ] Client added as a collaborator on the GitHub repo (if they'll self-edit)

Then hand off with [`SETUP-GUIDE.md`](./SETUP-GUIDE.md) as their editor
manual.
