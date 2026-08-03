# Testing procedures

How to check the site actually works — before pushing, after pushing, and
when something looks off. There are no automated tests wired in; this is
the manual playbook. See the end for what could be automated later.

Pair this with [design.md](design.md), which documents *how the site works*.
This doc documents *how to prove it still works*.

---

## Table of contents

1. [Ground rules](#ground-rules)
2. [Local build verification](#local-build-verification)
3. [Local dev server smoke test](#local-dev-server-smoke-test)
4. [CMS testing (local, no login)](#cms-testing-local-no-login)
5. [Content testing patterns](#content-testing-patterns)
6. [Responsive / cross-viewport check](#responsive--cross-viewport-check)
7. [Production smoke test after deploy](#production-smoke-test-after-deploy)
8. [Regression checklist](#regression-checklist)
9. [Debugging when something is wrong](#debugging-when-something-is-wrong)
10. [What could be automated](#what-could-be-automated)

---

## Ground rules

- **Every change gets a local build before push.** `npm run build` catches
  90% of what's going to break in Actions. Two-second turnaround, do it.
- **Test with representative content, not empty stubs.** Add a temporary
  tag / section / member to see the real render, then revert before commit.
- **The blog listing and one blog post is the minimum surface to verify
  after any template change** — those are the touched-most templates.
- **Never test on the live domain first.** Test locally, then push, then
  check the deployed site.

---

## Local build verification

Fastest check after any change to `src/**`, `.eleventy.js`, or the CMS
config:

```bash
rm -rf _site && npm run build
```

**What "success" looks like:**

- Exit code 0
- Final line: `[11ty] Copied N files / Wrote M files in Xs (vY.Y.Y)`
- No `[11ty]` lines with `Error` in them (warnings are usually fine — read
  them anyway)

**Then eyeball the output structure:**

```bash
ls -la _site/                              # root: index.html, 404.html, CNAME, .nojekyll, admin/, css/, images/, blog/
ls _site/blog/                             # index.html + one folder per post + category/ + tag/
ls _site/blog/category/ _site/blog/tag/    # one folder per in-use category/tag
```

**Quick grep sanity checks:**

```bash
# No Netlify residue anywhere in the build
grep -r "identity.netlify\|data-netlify\|git-gateway" _site/ 2>&1 | grep -v node_modules

# No WP hot-linked images
grep -c "shaolinhunggarkungfu.com/wp-content" _site/**/*.html _site/*.html 2>/dev/null | grep -v ":0$"

# Both forms carry the real Apps Script endpoint (fetch() — no action attr)
grep -o 'script.google.com/macros/s/[^"]*' _site/free-trial/index.html _site/book-lion-dance/index.html

# Neither form still points at a third-party service
grep -rn "formspree" _site/ && echo "FAIL: formspree residue" || echo "OK"

# Pagination generated, with no orphan page 1
ls _site/blog/page/2/index.html
test ! -d _site/blog/page/1 && echo "OK: no orphan /blog/page/1/"

# All 8 pages built
for p in "" kung-fu lion-dance blog about free-trial book-lion-dance gallery; do
  test -f "_site/$p/index.html" && echo "OK  /$p/" || echo "MISSING  /$p/"
done

# tel: link derives from site.phone (matches displayed number)
grep -o 'tel:[^"]*' _site/index.html | head -1

# CNAME landed correctly at the root
cat _site/CNAME

# .nojekyll present at root (empty file, so byte size 0)
ls -la _site/.nojekyll
```

If any of those look off, don't push. Fix locally first.

---

## Local dev server smoke test

For layout / visual / interaction changes:

```bash
npm start                    # eleventy --serve on http://localhost:8080
```

Open `http://localhost:8080/` and click every page:

- **`/`** — home renders, hero cycles between slides after ~6s, feature
  cards visible, services, about, team, CTA, latest 3 posts, footer
- **`/blog/`** — listing with all posts + right sidebar (Categories,
  Tags cloud)
- **`/blog/<any-post-slug>/`** — the article, category badge at top, tag
  chips below the body (if the post has any), "Back to all articles" link
- **`/blog/category/<any-slug>/`** — filter page, only the matching posts
- **`/blog/tag/<any-slug>/`** — filter page, only tagged posts
- **`/kung-fu/`**, **`/lion-dance/`**, **`/about/`**, **`/gallery/`** —
  static pages render; gallery filter chips and lightbox work
- **`/free-trial/`** — short form renders (name, email, phone, details)
- **`/book-lion-dance/`** — long form renders (adds organization, type of
  inquiry, event date, time)
- **`/thanks/`** — reached by typing the URL directly (fine)
- **`/definitely-not-a-page`** — reaches the styled 404 (via Eleventy
  serving `_site/404.html` on unknown URLs)

**Click every link at least once** on the home page and blog listing:
category badges → category filter page, tag chips → tag filter page,
"View All Articles" → `/blog/`, footer nav → each page, "Free Trial Class"
→ `/free-trial/`, "Book Lion Dance" → `/book-lion-dance/`.

---

## CMS testing (local, no login)

Two-terminal setup:

```bash
npm start                    # terminal 1
npm run cms                  # terminal 2 — decap-server on :8081
```

Open `http://localhost:8080/admin/` in a browser. **No login prompt should
appear** — the local proxy bypasses OAuth. If you see a "Login with GitHub"
button locally, `npm run cms` isn't running or the port is blocked.

**Full CMS smoke test (~5 min):**

1. **Home Page → Home Page Content** — the Page Sections list should show
   all current sections collapsed with meaningful summaries (e.g. "team —
   Meet the Instructors"). Drag one section to a
   different position → save → the change appears in `src/_data/home.json`
   on disk immediately (git status shows it modified) → the running dev
   server rebuilds → the front-end reflects the reorder.
2. **Add a section** — click "Add Section", pick any type, fill required
   fields, publish. Verify it renders on `/`. Then delete it, verify it's
   gone.
3. **Categories** — add a category (e.g. "Community Events"). It should
   appear as a file `src/_data/categories/community-events.yml` and show
   up in the Category dropdown on the Blog Posts form (and the Gallery
   Photos form). Delete it and confirm it disappears from the dropdown.
4. **Tags** — same pattern.
5. **Blog Posts → New Blog Post** — fill title, date, category, add tags
   (both existing + newly-added), upload a featured image, add body,
   publish. Verify:
   - New markdown file appears in `src/posts/`
   - Post shows on `/blog/`
   - Category badge + tag chips link to filter pages
   - Uploaded image loads (should be at `/images/<uploaded-name>`)
6. **Site Settings** — change the phone number by one digit. Verify:
   - `site.json` on disk updates
   - The `tel:` link on `/` uses the new number (topbar + footer)
   - The displayed number matches the `tel:` — critical, because these
     used to drift apart (see [regression: phone tel: bug](#regression-checklist))
   - Revert the change.

**If the CMS UI won't load** — check browser console. Common errors:

- `TypeError: crypto.randomUUID is not a function` → you're on `http://`,
  need `https://` (secure context). On localhost this works because
  localhost is considered secure.
- Error loading config → YAML syntax error in `src/admin/config.yml`.
  Run `node -e "require('js-yaml').load(require('fs').readFileSync('src/admin/config.yml','utf8'))"`
  to find the parse error.

---

## Content testing patterns

**Pattern 1 — Verify a template change with real-shaped data**

If you change how sections render, add a temporary section to `home.json`
that exercises the change, verify, then revert.

Example: adding a new field to `two_column`? Insert a two-column block
with the new field populated in `src/_data/home.json`, `npm start`, look
at the home page, remove the block before committing.

**Pattern 2 — Verify tag/category pages with representative variety**

The tag cloud sizing tiers only look right when there's variance in post
counts. To verify the heatmap sizing:

```yaml
# In one post's frontmatter:
tags:
  - hung-gar     # already on several posts — will read as the largest chip
  - beginners    # a couple of posts
  - competition  # fewest posts
```

Then check `/blog/` sidebar — `hung-gar` should be visibly larger than
`competition`. Revert the tags before committing (unless they're real).

**Pattern 3 — Verify build output without touching the browser**

For headless verification (in CI or a script):

```bash
# All 3 posts still in the collection
grep -oE 'href="/blog/[^"]+"' _site/blog/index.html | sort -u

# Number of post cards on the listing (each card = 3 matches of "post-card"
# for the article + img wrapper + body wrapper — divide as needed)
grep -c "post-card__body" _site/blog/index.html

# Section order on home
awk '/<section /{n++; print n, $0}' _site/index.html
```

---

## Responsive / cross-viewport check

The site has one breakpoint at **900px**. Test at:

- **1280+px** — desktop layout, 2-column blog grid, sidebar visible on
  the right
- **768–900px** — tablet-ish, still desktop layout barely
- **≤900px** — mobile: blog grid collapses to 1 column, sidebar drops
  below posts, nav becomes a hamburger toggle
- **375px (iPhone SE-ish)** — narrow mobile, everything single-column,
  no horizontal scroll

Chrome DevTools device mode (`Cmd + Shift + M`) is enough for a first pass.
Test the hamburger menu opens and closes, nav links work when tapped.

**Date picker check** (`/book-lion-dance/`), once per change touching the
form or the vendored component:

- Keyboard only, no mouse: Tab to the field, `Enter`/`Space` opens the
  calendar, arrow keys move by day, `PageUp`/`PageDown` by month, `Enter`
  selects, `Esc` closes and returns focus to the field.
- Screen reader (VoiceOver on macOS is enough for a first pass): the
  selected date and the month change are both announced.
- Selected day is `--red` with white text — never gold on white.
- Day cells measure ≥44×44px at 375px viewport.
- Past dates are disabled, and `min` is *today*, not a stale build date.
- Disable JavaScript entirely: the field falls back to a working input
  and the form still submits.
- At 375px the popover stays inside the viewport — it must not push page
  width or clip off-screen.

**Quick horizontal-overflow check** — the #1 mobile bug source:

```js
// Paste in browser console at 375px viewport
document.documentElement.scrollWidth > window.innerWidth
// Should be `false` on every page
```

---

## Production smoke test after deploy

Every push to `main` triggers an Actions run. Wait for the green check
(~90 seconds), then:

**Immediate checks (~2 min):**

1. **Actions ran cleanly** — https://github.com/adrianwongstudio/shaolinhunggarkungfu.com/actions
   → most recent run → green check. No red X on the "build" or "deploy" jobs.
2. **`https://shaolinhunggarkungfu.com/`** loads over HTTPS, page is
   styled (not raw unstyled HTML — the classic "cache serving old 404 for
   CSS" symptom).
3. **`https://shaolinhunggarkungfu.com/blog/`** — sidebar visible, all
   posts listed, category counts correct.
4. **`https://shaolinhunggarkungfu.com/blog/<a-real-post-slug>/`** — the
   post loads with layout intact.
5. **`https://shaolinhunggarkungfu.com/definitely-not-a-page`** — styled
   404 (not GitHub's generic default).

**Once per new build with a template change:**

6. Home page — every section renders. Screenshot and eyeball against the
   previous state if you did a layout change.
7. Free Trial form — submit a test message. Should show the inline
   success state (or redirect to `/thanks/` with JavaScript disabled),
   and you should get a staff notification + sender confirmation email
   within a minute.
8. Book Lion Dance form — same check, plus confirm the event date lands
   on the correct day in the Sheet (see the "Booking dates land one day
   off" regression below).

**Once per new build touching admin/config.yml or the CMS:**

9. `https://shaolinhunggarkungfu.com/admin/` — Login with GitHub works,
   sidebar shows all collections, opening a blog post loads its fields
   correctly.

**Browser cache traps** — if you see something old:

- **Hard reload** in the browser (`Cmd + Shift + R`)
- Or open in an **incognito window** — no cache, no service workers,
  definitive test of what the server is actually returning
- `curl -sI https://shaolinhunggarkungfu.com/css/style.css` — check
  the `last-modified` header to confirm what's really on the CDN

---

## Regression checklist

Bugs we've hit before. If you touched adjacent code, re-verify these:

### Phone `tel:` link matches displayed number
- **What broke:** `tel:+17789070790` (old number) was hardcoded in 3 places
  while the visible number was updated via `site.phone`. Clicks dialed the
  wrong number.
- **How to verify:** On any page, hover the phone link, confirm the URL
  matches the number you see. `grep 'tel:' src/_includes/layout.njk`
  — every match should use `{{ site.phone | telHref }}`, not a
  hardcoded number.

### `tags` frontmatter doesn't leak "posts"
- **What broke:** Eleventy uses `tags:` for collection membership. Adding
  user tags to a post used to make "posts" appear as a visible tag chip.
- **How to verify:** Add a temporary tag to a post, `npm run build`, check
  `_site/blog/index.html` — chips should only show your tag, not "posts".
  Also confirm `src/posts/posts.json` does NOT contain `"tags": ["posts"]`.

### `_site/` not accidentally committed
- **What broke:** `_site/` was tracked once. Made every commit huge and
  triggered spurious diffs.
- **How to verify:** `git ls-files _site/` should return nothing.
  `_site/` must be in `.gitignore`.

### `.nojekyll` present at repo root
- **What broke:** GitHub Pages ran Jekyll on `.njk` files → build failure.
- **How to verify:** `ls .nojekyll` at repo root (not just `src/.nojekyll`).
  Both should exist.

### Uploaded images resolve on the deployed site
- **What broke:** `src/images/` wasn't in `.eleventy.js` passthrough. CMS
  uploads showed up in git but 404'd in production.
- **How to verify:** `grep passthrough .eleventy.js` — should include
  `addPassthroughCopy("src/images")`. After uploading via CMS,
  `_site/images/<file>` should exist after build.

### HTTPS enforced on the domain
- **What broke:** `http://` requests to `/admin/` failed with
  `crypto.randomUUID is not a function`.
- **How to verify:** `curl -sI http://shaolinhunggarkungfu.com/` — should
  return a `301` redirect to `https://`. GitHub Pages does this
  automatically when "Enforce HTTPS" is checked. If it's not, the setting
  isn't on.

### Hot-linked images aren't crept back in
- **What broke:** Someone (WordPress, an editor pasting HTML) could
  reintroduce absolute WP URLs that 404.
- **How to verify:** `grep -r "wp-content" src/` → should be empty.

### Pages source is "GitHub Actions", not "Deploy from a branch"
- **What broke:** Setting a custom domain in the UI can flip this back.
- **How to verify:** repo Settings → Pages → Source should say
  "GitHub Actions". If it says "Deploy from a branch", switch it back.
  Jekyll doesn't run either way thanks to `.nojekyll`, but the wrong
  workflow deploys nothing.

### CNAME file matches the domain
- **What broke:** GitHub UI wrote a CNAME at the repo root that conflicted
  with `src/CNAME`.
- **How to verify:** Only one CNAME file should exist — `src/CNAME`. If
  a root `CNAME` appears, delete it (GH UI likely re-added it; also check
  Settings → Pages → Custom domain).

---

## Debugging when something is wrong

**Symptom: Site looks unstyled**
- Almost always browser cache. Try incognito.
- `curl -sI https://<domain>/css/style.css` — expect 200 + `content-type: text/css`.
- Check DevTools Network tab for the CSS request — 404 means the path is
  wrong (subdirectory-prefix issue on project sites).

**Symptom: CMS shows "Error loading config"**
- YAML parse error. Validate with `node -e "require('js-yaml').load(require('fs').readFileSync('src/admin/config.yml','utf8'))"`.
- Or type/schema mismatch — a Decap-specific error message usually appears
  in the browser console.

**Symptom: CMS shows "Server not found: replace_me_..."**
- `base_url` in `src/admin/config.yml` is still a placeholder. Fill in the
  real Cloudflare Worker URL.

**Symptom: A blog post doesn't appear on `/blog/`**
- Check the post has a `date:` in the frontmatter. Missing date → excluded
  from `collections.posts`.
- Check the file is under `src/posts/*.md` (not a subdirectory).

**Symptom: A filter page 404s but the category/tag exists**
- The filter page is only generated when at least one post uses that
  category/tag. Empty categories from `src/_data/categories/` don't
  produce pages.

**Symptom: Actions build failed on GitHub but works locally**
- Node version mismatch — CI uses Node 22. `node -v` locally.
- Case-sensitivity — macOS is case-insensitive, Linux runners aren't.
  If a template says `include "Layout.njk"` but the file is `layout.njk`,
  it works on Mac and fails on Ubuntu.
- Missing dep — `npm ci` in CI is stricter than `npm install`. If it
  fails, check `package-lock.json` is committed and matches `package.json`.

**Symptom: Booking date submits as the wrong day**
- Something is converting Duet's value into a `Date` before sending. Duet
  emits `YYYY-MM-DD` already — submit the string verbatim. Any `new Date()`
  round-trip reintroduces the timezone shift.

**Symptom: Date picker doesn't appear, field is a plain input**
- Expected behaviour if the module hasn't loaded. Confirm the form still
  submits in that state — that's the designed fallback, not a bug.
- If it never upgrades: check the console for a module load error, and
  confirm `src/js/vendor/duet/` was copied through by
  `addPassthroughCopy` in `.eleventy.js`.

**Symptom: `min` date lets users book in the past**
- The `min` attribute is hardcoded rather than injected at build time.
  It must come from an Eleventy shortcode evaluating at build.

**Symptom: Form submit fails with a CORS error in the console**
- The `fetch()` is sending `Content-Type: application/json`. That triggers
  a preflight `OPTIONS` request, which Apps Script does not answer. Send
  `text/plain` and `JSON.parse(e.postData.contents)` server-side.
- Do **not** "fix" this with `mode: 'no-cors'` — the response becomes
  opaque and you lose all success/error handling.

**Symptom: Form returns 401/403, or redirects to a Google login page**
- The deployment's access level is "Anyone with a Google account" instead
  of **Anyone**. Manage deployments → edit → Who has access → Anyone.

**Symptom: Form worked yesterday, broken today, nothing changed in the site**
- Someone redeployed the script via "New deployment", which mints a fresh
  `/exec` URL. The old one stops working. Always use *Manage deployments →
  edit existing → Version: New version*, or update
  `src/_data/forms.json` with the new URL.

**Symptom: Row lands in the Sheet but no email arrives**
- `MailApp` quota exhausted — 100 recipients/day on consumer Gmail, 1,500
  on Workspace. Check *Executions* in the Apps Script editor for
  `Service invoked too many times`.
- Check spam folder — mail sends from the script owner's address.
- Recipient list in Script Properties is empty or malformed. It must be
  comma-separated with no trailing comma.

**Symptom: Email arrives but no row in the Sheet**
- `SHEET_ID` property wrong, or the tab name doesn't match `form_type`.
  Tabs must be exactly `free-trial` and `book-lion-dance`.

**Symptom: Booking dates land one day off**
- A `Date` object is being passed instead of a `YYYY-MM-DD` string, and
  the script's timezone is shifting it. Send the raw string.

**Symptom: Spam submissions getting through**
- The honeypot is only hidden with CSS and not validated in `doPost`.
  Bots fill hidden fields. Reject server-side when `website` is non-empty.

---

## What's automated, and what's still a reasonable next step

**Built** — `npm test` (see [`README.md`](./README.md#testing)) runs on
every `pull_request` via `.github/workflows/pr-check.yml`:

- Unit tests for the pure logic (`src/_lib/*`, `src/js/form-logic.js`) —
  pagination chunking, filters, honeypot/form-type validation.
- Integration tests that build the site and assert against `_site/`: all
  8 pages exist, pagination has no orphan page 1, `rel=prev`/`rel=next`
  and `aria-current` are present, both forms have the right fields and
  share one endpoint, the CMS config is valid YAML and covers every
  section type the template dispatcher supports, images carry `alt`, and
  the deploy workflow YAML itself parses (a real bug — `${{ }}` inside an
  inline flow mapping is invalid YAML — was caught this way).
- `npm run coverage` reports v8 coverage; kept above a threshold in
  `vitest.config.js` so it can't silently regress.

This covers most of what a Playwright smoke test or an HTML validator
would catch, without needing a browser in CI. Not built, and still a
reasonable next step if the site gets more active or another editor
joins:

- **Link checker** — `npx linkinator _site/ --recurse` as a CI step to
  catch broken internal links (e.g. a deleted category still referenced
  by a post).
- **Lighthouse budget** — `npx lighthouse https://<domain>/ --output json`
  with thresholds on Performance / Accessibility / SEO. Runs in CI on a
  schedule; alerts if scores regress.
- **Playwright visual/interaction smoke test** — a real browser opening
  `/`, `/blog/`, `/gallery/`, both forms; checks the mobile nav overlay,
  hero slider, and lightbox actually work, not just that the markup for
  them exists. The current test suite can't see rendered layout or run
  JavaScript, so this is the gap it doesn't cover.
- **Form endpoint monitor** — POST a test payload (flagged `is_test: true`
  so the script skips the notification email) to the Apps Script URL daily
  and alert if the response isn't `{ok:true}`. Catches the
  redeploy-changed-the-URL failure before a real customer hits it. Only
  relevant once the Apps Script Web App is actually deployed.

Each of those adds 15-30 minutes of setup and pays off if the site
becomes something people can accidentally break. For a 1-editor
brochure site, the manual playbook above is enough.
