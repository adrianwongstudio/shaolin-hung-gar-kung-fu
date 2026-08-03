# Shaolin Hung Gar Kung Fu — Website

**Live:** https://shaolinhunggarkungfu.com
**Repo:** `adrianwongstudio/shaolinhunggarkungfu.com`

A small-business marketing site for a Vancouver Hung Gar kung fu school and
lion dance troupe. Deployed free on GitHub Pages, with a friendly CMS at
`/admin/` so non-technical staff can edit everything without touching code.
This same shape is intentionally reusable as a **starter template for other
small-business sites**.

### Pages

| Page | Route | Template | Purpose |
|---|---|---|---|
| Home | `/` | `index.njk` | Block-composed landing page, driven by `home.json` |
| Kung Fu | `/kung-fu/` | `kung-fu.njk` | Classes, lineage, styles, schedule, pricing |
| Lion Dance | `/lion-dance/` | `lion-dance.njk` | Performance offering, gallery, past events |
| Blog | `/blog/` | `blog.njk` | Paginated listing with category + tag filters |
| About | `/about/` | `about.njk` | School history, sifu bio, lineage, values |
| Free Trial Class | `/free-trial/` | `free-trial.njk` | Short-form conversion page — kung fu signup |
| Book Lion Dance | `/book-lion-dance/` | `book-lion-dance.njk` | Long-form booking enquiry — events |
| Gallery | `/gallery/` | `gallery.njk` | Filterable photo grid with lightbox |

Both forms post to the same Google Apps Script Web App (see below); they
differ in field count and in the `form_type` value they submit.

All eight pages exist as frames in the
[Figma file](https://www.figma.com/design/3OgVZihfAQVd1DqEIQTZF2/Shaolin-Hung-Gar).

## Stack

- **[Eleventy 3.x](https://www.11ty.dev/)** — static site generator (Nunjucks + Markdown)
- **[Decap CMS](https://decapcms.org/)** — in-browser editor at `/admin/`
- **[GitHub Pages](https://pages.github.com/)** — free hosting via GitHub Actions
- **[Cloudflare Workers](https://workers.cloudflare.com/)** — ~90-line OAuth proxy for CMS auth (free tier)
- **[Google Apps Script Web App](https://developers.google.com/apps-script/guides/web)** — form endpoint. Receives a `fetch()` POST, appends a row to Google Sheets, and emails the enquiry list via `MailApp.sendEmail()`.

Total ongoing cost: **$0**.

> **Quota note:** `MailApp` allows **100 recipients/day** on a consumer Gmail
> account and **1,500/day** on Google Workspace. Each form submission that
> notifies N staff addresses consumes N recipients. Confirm which account
> type owns the script before launch.

## Quick start (local)

```bash
npm install       # once
npm start         # terminal 1 — preview at http://localhost:8080
npm run cms       # terminal 2 — CMS proxy, no login needed locally
```

Then `http://localhost:8080/admin/` opens the CMS with no auth prompt. Edits
write straight to `src/_data/*.json` and `src/posts/*.md`; the dev server
rebuilds automatically.

```bash
npm run build     # produces the finished site in _site/
```

## Testing

```bash
npm test          # unit tests (pure logic) + integration tests (builds the
                   # site, then asserts against _site/ — see test/)
npm run coverage  # same, with a v8 coverage report
```

See [`testing.md`](./testing.md) for the manual playbook (CMS smoke test,
responsive/cross-viewport check, production smoke test after deploy) — the
parts that can't be asserted against a build output.

## Deploy

Every push to `main` triggers `.github/workflows/deploy.yml` — Eleventy
builds, GitHub Actions publishes `_site/` to GitHub Pages. Live in ~90
seconds. Custom domain is set via `src/CNAME` (containing
`shaolinhunggarkungfu.com`) + repo Settings → Pages.

Full setup — including OAuth app, Cloudflare Worker deploy, the Apps Script
Web App, and DNS — is documented in [`design.md`](./design.md).

## Documentation

| Read this | For |
|---|---|
| [`design.md`](./design.md) | How the site works — architecture, content model, CMS design, external services, gotchas. |
| [`testing.md`](./testing.md) | How to verify it still works — manual playbook, regression checklist, debug flowchart. |
| [`CUSTOMIZATION.md`](./CUSTOMIZATION.md) | How to fork this as a template for a new client site — rebrand, retheme, add pages, add section types. |
| [`SETUP-GUIDE.md`](./SETUP-GUIDE.md) | Client-facing editor manual (day-to-day CMS use). |
| [`PAGINATION.md`](./PAGINATION.md) | Blog pagination + category filtering — build spec. |
| [`INCONSISTENCIES.md`](./INCONSISTENCIES.md) | Audit log of conflicts inherited from the template, and their resolutions. |
| [`oauth-worker/README.md`](./oauth-worker/README.md) | Deploying the OAuth proxy Worker. |
| [`apps-script/README.md`](./apps-script/README.md) | Deploying the form-handling Web App. |


## Project layout at a glance

```
src/
├── admin/             ← Decap CMS config + loader
├── _data/             ← site.json, home.json, pages/, categories/, tags/
├── _includes/         ← layout + section renderer + sidebar + pagination
├── css/               ← one stylesheet, color tokens at the top
├── images/            ← logos + uploaded via CMS
├── js/                ← nav.js (sticky + mobile menu), form.js, slider.js
├── posts/             ← blog posts as Markdown
├── index.njk          ← / — home page (loops home.sections)
├── kung-fu.njk        ← /kung-fu/
├── lion-dance.njk     ← /lion-dance/
├── about.njk          ← /about/
├── free-trial.njk     ← /free-trial/       (short form)
├── book-lion-dance.njk ← /book-lion-dance/ (long form)
├── gallery.njk        ← /gallery/
├── blog.njk           ← /blog/ + /blog/page/N/
├── blog-category.njk  ← /blog/category/<slug>/ + /page/N/
├── blog-tag.njk       ← /blog/tag/<slug>/ + /page/N/
├── thanks.njk         ← /thanks/ — shared no-JS form fallback
└── CNAME              ← shaolinhunggarkungfu.com
```

Full layout in [`design.md`](./design.md).

## License

MIT — see [`LICENSE`](./LICENSE). Reuse the code freely for other projects.
