# Inconsistency audit — inherited docs vs. Shaolin Hung Gar Kung Fu brief

**Date:** 2026-08-02 (revised same day after client decisions + Figma access)
**Scope:** `README.md`, `design.md`, `CUSTOMIZATION.md`, `testing.md`, `SETUP-GUIDE.md`, plus the current contents of `src/`.
**Design source:** [Figma — Shaolin Hung Gar](https://www.figma.com/design/3OgVZihfAQVd1DqEIQTZF2/Shaolin-Hung-Gar)

## Status at a glance

| ID | Item | Status |
|---|---|---|
| BLOCKER-1 | Two incompatible tech stacks | ✅ Resolved — Eleventy |
| BLOCKER-2 | Codebase not in this folder | 🔴 Open |
| BLOCKER-3 | Figma unavailable | ✅ Resolved — file read |
| HIGH-1 | Three answers on form submission | ✅ Resolved — Apps Script, all docs updated |
| HIGH-2 | Two colour palettes | ✅ Resolved — red/gold/cream |
| HIGH-3 | Nav doesn't match page list | ✅ Resolved — 8 pages, two forms |
| HIGH-4 | Pagination specified but missing | ✅ Spec written — `PAGINATION.md` |
| HIGH-5 | Sticky nav / mobile menu unspecified | ✅ Resolved — `design.md` |
| HIGH-6 | Gallery page in Figma, absent from docs | ✅ Resolved — added as 8th page |
| MEDIUM-1 | §External services skipped 3 | ✅ Resolved — renumbered 1–4 |
| MEDIUM-2 | Stale client references | ✅ Resolved — domain + repo swapped |
| MEDIUM-3 | Repro checklist skipped step 7 | ✅ Resolved |
| MEDIUM-4 | No radius token | ✅ Resolved — `--radius: 10px` |
| MEDIUM-5 | One breakpoint | ✅ Resolved — 5-step scale |
| MEDIUM-6 | Form field conflicts | ✅ Resolved — two forms, one endpoint |
| LOW-1 | HTTPS under-documented | ✅ Resolved |
| LOW-2 | README duplicate page list | ✅ Resolved |
| LOW-3 | `feature_cards` icons cycle | 🟡 Open — needs a CMS icon picker |
| LOW-4 | No a11y/perf baseline | 🟡 Open — targets proposed, not agreed |
| **NEW-1** | **Figma placeholders are stock food photography** | 🔴 **Open — see below** |
| **NEW-2** | Figma date picker widget unbuildable with native input | ✅ Resolved — Duet Date Picker, see `design.md` |

---

## NEW-1 — Every image in the Figma file is a stock placeholder

**Severity: HIGH.** All eight frames use stock food photography and a
generic portrait as placeholder imagery. There is no kung fu, lion dance,
or school photography anywhere in the design, and `src/images/` contains
only the five logo files.

This matters more than it looks. A martial arts and lion dance site is
sold almost entirely on imagery — motion, colour, crowds, costume. Layout
decisions made against placeholder food photos will not survive contact
with real content:

- Hero slides need **landscape action shots with headroom** for the
  overlaid heading. A tightly-cropped photo leaves nowhere for text.
- Lion dance photography is dominated by red and gold — the same two
  brand colours. Overlaid gold text on a gold lion head disappears. Hero
  overlays will need a scrim.
- The Gallery grid's aspect ratio should be chosen from real photos. If
  most usable shots are portrait (common for performance photography),
  a landscape-biased grid crops the subject's head off.

**Needed before build:** a real photo library, with per-image intent
(hero / card / gallery / team), and alt text. Until then, treat all
image-dependent spacing in the Figma file as provisional.

---
**Purpose:** These five docs were written for a *different* client site (Legacy Financial Planning). They are being repurposed as the spec for Shaolin Hung Gar Kung Fu. This file lists every conflict found, so each can be resolved deliberately rather than silently inherited.

Nothing has been deleted from any existing doc. This is a findings log only.

---

## Severity key

| Level | Meaning |
|---|---|
| **BLOCKER** | Must be resolved before any code is written; the answer changes the architecture. |
| **HIGH** | Will ship a broken or wrong-branded site if missed. |
| **MEDIUM** | Confusing for the next developer; wastes time but is recoverable. |
| **LOW** | Cosmetic / housekeeping. |

---

## BLOCKER-1 — Two incompatible tech stacks

**Where:** New brief §1 vs. new brief §2, and all five docs.

The brief names a target stack of *Next.js 14, Tailwind CSS, TypeScript, Shadcn UI, Framer Motion*. Requirement §2 of the same brief then says *"Eleventy HTML form sends a standard JavaScript `fetch()` request."* The inherited docs describe Eleventy 3.x + Nunjucks throughout.

These are mutually exclusive. Next.js and Eleventy are different runtimes with different templating, different CMS integration, and different hosting stories.

**Knock-on effects if Next.js were chosen:**

- Decap CMS assumes a file-based git workflow and is awkward under Next.js; the CMS layer would likely need replacing (Sanity, Contentlayer, or plain MDX).
- The GitHub Pages deploy workflow in `design.md` would need `next build && next export`, and `next/image` would have to be disabled or swapped for a custom loader (no image optimisation server on Pages).
- Roughly 80% of `design.md`, `CUSTOMIZATION.md`, and `testing.md` would become invalid.

**RESOLVED — 2026-08-02:** Stay on **Eleventy 3.x**. Tailwind CSS may be layered in as the styling system; Framer Motion is replaced with CSS transitions plus a small vanilla-JS interaction layer (or Motion One if a JS animation library is genuinely needed). TypeScript and Shadcn UI are dropped — they have no meaningful role in an Eleventy/Nunjucks build.

**Still open:** confirm whether Tailwind replaces `src/css/style.css` entirely, or sits alongside the existing CSS-custom-property token block. Recommendation: Tailwind with the brand tokens defined in `tailwind.config.js` `theme.extend`, so there is exactly one source of truth for colour.

---

## BLOCKER-2 — The code described in these docs is not in this folder

**Where:** filesystem vs. `design.md` §Repository layout.

`design.md` documents a full repo: `.eleventy.js`, `package.json`, `.github/workflows/deploy.yml`, `src/_data/`, `src/_includes/`, `src/*.njk`, `oauth-worker/`.

What actually exists in this folder:

```
.git/
README.md
design.md
CUSTOMIZATION.md
testing.md
SETUP-GUIDE.md
src/
└── images/
    ├── shaolin-hung-kuen.svg
    ├── shaolin-hung-kuen-2000px.png
    ├── shaolin-hung-kuen-traced-2000px.png
    ├── slhk-association-full.svg
    └── slhk-association-full-3000px.png
```

No build config, no templates, no data files, no `package.json`, no Worker. The `src/` directory contains only five logo assets.

**Implication:** this is a greenfield build, not a modification of an existing site. The docs are a *blueprint to build from*, not documentation *of what is here*. Every "how to verify" step in `testing.md` currently has nothing to run against.

**Decision needed:** Are the referenced files (a) coming from the `legacy-financial-planning-test` repo to be copied in, (b) to be scaffolded fresh from the blueprint, or (c) already living in a separate repo not connected to this folder?

---

## BLOCKER-3 — Figma design source is unavailable

**Where:** New brief preamble.

The brief asks to *"improve on the design and responsiveness of the website design in Figma."* No Figma file URL, node ID, or exported frame is present in this folder, and the Figma connector is not currently authorized.

**Consequence:** any component spec written now is derived from the written brief and the stated reference site (`vancouverliondance.com`), not from the actual design. Spacing, type scale, and exact layout decisions will need reconciling against the Figma file once it is readable.

**Action:** authorize the Figma connector, or export the key frames as PNG into `src/images/design-refs/`.

---

## HIGH-1 — Three conflicting answers on how the contact form submits

| Source | Says |
|---|---|
| `README.md` L20 | Formspree, free tier, 50 submissions/month |
| `design.md` L81 (architecture diagram) | `browser ──POST──▶ email and google drive` |
| `design.md` §External services | Section 3 is missing entirely; only orphaned Formspree hidden-input instructions survive |
| `CUSTOMIZATION.md` §Ship checklist | "`src/contact.njk` `action=` points at the new Formspree form" |
| `testing.md` §Debugging | An entire Formspree troubleshooting block |
| New brief §2 | Google Apps Script Web App → Sheets + `MailApp.sendEmail()` |

**Resolution:** the brief wins — Google Apps Script Web App. Formspree is removed from the architecture.

**Every place that must change:**

1. `README.md` L20 — the stack table row.
2. `README.md` L22 — "Total ongoing cost: $0" remains true (Apps Script is free within quota), but note the quota: consumer Gmail accounts get **100 `MailApp` recipients/day**; Workspace accounts get 1,500.
3. `design.md` architecture diagram — replace the form line with the Apps Script hop.
4. `design.md` §External services — write a real **section 3** covering Apps Script deployment, and delete or rewrite the orphaned Formspree hidden-input paragraph.
5. `CUSTOMIZATION.md` §External services — swap the "Formspree form" bullet.
6. `CUSTOMIZATION.md` §Ship checklist — the two `contact.njk` lines.
7. `testing.md` §Debugging — replace the Formspree failure modes with Apps Script ones (CORS, redirect-follow, quota, `doPost` deployment scope).
8. `testing.md` §Local build verification — the `grep -oE 'action="[^"]*"'` check no longer applies; a `fetch()`-based form has no `action` attribute.
9. `testing.md` §What could be automated — "Formspree submission monitor" bullet.

**Architectural notes the docs do not yet cover, and must:**

- Apps Script Web Apps do **not** return CORS headers on a normal `fetch()` POST. Either post as `Content-Type: text/plain` (a CORS "simple request", which avoids the preflight) and parse the body as JSON server-side, or use `mode: 'no-cors'` and accept that you cannot read the response. The first option is strongly preferred — it lets you show real success/error states.
- The Web App must be deployed with **Execute as: Me** and **Who has access: Anyone**. "Anyone with a Google account" will silently fail for logged-out visitors.
- Every redeploy of the script produces a **new `/exec` URL** unless you use "Manage deployments → edit existing deployment". Pinning the deployment is essential or the live form breaks on every script edit.
- Spam protection is no longer handled by a third party. The honeypot field must be validated **server-side inside `doPost`**, not just hidden with CSS.
- The recipient email list should live in Script Properties, not hardcoded in the script body.

---

## HIGH-2 — Two different colour palettes inside the same document

**Where:** `CUSTOMIZATION.md`.

The "5-minute rebrand" table (L41–42) says:

```
Primary color (navy)   →  --navy: #0e2a47;   (style.css line 8)
Accent color (gold)    →  --gold: #e0a52e;   (style.css line 10)
```

The "Colors, fonts, logo" section 50 lines later (L94–106) says:

```css
--red:      #c82229;
--red-dark: #a61b21;
--gold:     #ffc800;
--gold-dark:#e6b400;
--ink:      #000000;
--muted:    #4a4a4a;
--line:     #e5dfd5;
--bg-cream: #f7f4ee;
--bg-soft:  #ede7dc;
```

The gold value differs (`#e0a52e` vs `#ffc800`), and the primary is navy in one place and red in the other. The `--navy` reference is also cited by line number, which is fragile.

**Resolution:** the red/gold/cream block is correct for Shaolin Hung Gar Kung Fu and is confirmed as the chosen direction. The navy/gold rows in the 5-minute table are stale from the financial-planning original and must be corrected. `design.md` §Content model also references a `cta_band` `"style": "navy"` value — that enum needs renaming (`red` / `gold` / `soft` / `plain`) or the navy style needs redefining as the deep-ink variant.

---

## HIGH-3 — Nav does not match the stated page list

**Where:** `README.md` L4–11 and L79–85 vs. `CUSTOMIZATION.md` §Nav.

`README.md` lists seven pages: Home, Kung Fu, Lion Dance, Blog, About, Free Trial Class, Book Lion Dance.

`CUSTOMIZATION.md` §Nav says nav links are hardcoded to `/`, `/blog/`, `/contact/` — three links.

`design.md` §Repository layout lists only `index.njk`, `blog.njk`, `blog-category.njk`, `blog-tag.njk`, `contact.njk`, `contact-thanks.njk`, `404.njk`. There is no `kung-fu.njk`, `lion-dance.njk`, `about.njk`, `free-trial.njk`, or `book-lion-dance.njk`.

Five of the seven pages have no template, no nav entry, no footer entry, and no CMS collection.

**Also unresolved:** the relationship between `/contact/`, "Free Trial Class", and "Book Lion Dance". The brief describes **one** form with an Inquiry Type dropdown (Corporate Event / Grand Opening / Wedding / Other) — those options are all lion-dance bookings and none of them is a free trial class. So either:

- **(a)** There are two distinct forms — a short trial-class signup and a longer lion-dance booking form — and the dropdown belongs only to the latter; or
- **(b)** There is one form, and the Inquiry Type dropdown is missing a "Free Trial Class" / "Kung Fu Classes" option.

The brief's field list does not resolve this. Option (a) is the better conversion path — a free trial signup should be 3 fields, not 8 — but it needs confirming. Note also that `README.md` L4–11 duplicates the same page list again at L79–85, which is redundant.

---

## HIGH-4 — Blog pagination is specified but does not exist

**Where:** New brief §6 vs. `design.md` §Auto-generated filter pages.

The brief requires *"filters for categories and pagination."*

Category and tag *filters* do exist — `postsByCategory` / `postsByTag` collections drive `/blog/category/<slug>/` and `/blog/tag/<slug>/`.

But there is **no pagination anywhere**. The `pagination:` blocks shown in `design.md` use `size: 1` over the *category list*, which generates one page per category — it is not paginating posts. `blog.njk` renders every post in a single listing with no page splitting, and there is no "Next / Previous" UI, no page-number component, and no `/blog/page/2/` route.

**What must be built:**

1. Paginate `blog.njk` itself (`pagination: { data: collections.posts, size: 9 }`) with a `/blog/` → `/blog/page/2/` permalink scheme.
2. Nest pagination inside the category and tag filter pages — currently a category with 40 posts renders all 40 on one page.
3. A reusable `pagination.njk` partial: Previous / Next, numbered pages with ellipsis truncation, `aria-current="page"` on the active number, and `rel="prev"` / `rel="next"` in `<head>` for SEO.
4. A visible **category filter control** on `/blog/` — the brief says "filters," and a sidebar list of links is arguably a filter, but a horizontal chip row that reflects the active state is the modern pattern and is what the reference site implies.

---

## HIGH-5 — Sticky navigation and mobile menu are unspecified

**Where:** New brief §1 vs. all docs.

The brief requires a nav bar that *follows the window as the user scrolls on desktop*, with a *menu on mobile*. `CUSTOMIZATION.md` §Nav describes a static header. `testing.md` §Responsive mentions "nav becomes a hamburger toggle" at ≤900px — so a hamburger exists in the original — but no doc describes sticky behaviour, scroll state, or the mobile menu's open/close mechanics.

**Undocumented decisions that need making:**

- Does the header shrink / gain a shadow / change background on scroll, or just pin unchanged?
- Does the dark top bar (phone / email / address) scroll away while only the main header sticks? Recommended: yes — it reclaims ~40px of vertical space.
- Mobile menu: slide-in drawer or full-screen overlay? The reference site uses a full-screen overlay.
- Does `<body>` scroll-lock while the mobile menu is open? It must, or the page scrolls behind the overlay.
- Focus trap and `Esc`-to-close for keyboard and screen-reader users — currently unaddressed anywhere in the docs.
- Sticky headers need `scroll-margin-top` on all anchor targets, or in-page links land underneath the header.

---

## MEDIUM-1 — `design.md` §External services skips section 3

**Where:** `design.md` L399–437.

The numbered checklist runs **1 → 2 → 4**. Section 3 (which was the Formspree setup) has been deleted, but its trailing content was left behind. The result is that this paragraph now appears to belong to section 2 (the Cloudflare Worker):

> *"The form needs two extra hidden inputs: `_next` … and `_gotcha` …"*

Those are Formspree-specific fields and have nothing to do with the OAuth Worker. Reading the doc top-to-bottom, it looks like the Worker requires them.

**Fix:** write a new section 3 for the Apps Script Web App, and move or delete the orphaned paragraph.

---

## MEDIUM-2 — Stale client references throughout

Every reference below belongs to the previous client and must be swapped:

| Reference | Files |
|---|---|
| `legacyfinancialplanning.ca` | `testing.md` (§Production smoke test ×5, §Regression checklist ×2, §Local build verification ×1) |
| `adrianwongstudio/legacy-financial-planning-test` | `testing.md` L252, `CUSTOMIZATION.md` L58, L79 |
| `info@legacyfinancialplanning.ca` | `testing.md` L269–270 |
| `wp-content` / WordPress hot-link greps | `testing.md` L71, L337 |
| "Legacy Financial Planning" in CMS summary example | `testing.md` L140 |
| Category example "Insurance" | `design.md` L196 |
| Category example "Retirement" | `testing.md` L145 |
| Tag examples `home` / `savings` / `family` | `design.md` L213, `testing.md` L192–196 |
| Section example "3 Pillars" | `design.md` L188 |
| Acme Widgets placeholder | `CUSTOMIZATION.md` L143–151 |

The tag and category examples should become martial-arts relevant — e.g. categories *Kung Fu*, *Lion Dance*, *Events*, *Student Stories*; tags *hung-gar*, *forms*, *competition*, *beginners*, *chinese-new-year*.

---

## MEDIUM-3 — `design.md` reproduction checklist skips step 7

**Where:** `design.md` §Reproduction checklist, L550–575.

The list runs **1, 2, 3, 4, 5, 6, 8, 9, 10**. Step 7 is missing. Given the surrounding steps, it was probably the form-service setup — same deletion as MEDIUM-1.

---

## MEDIUM-4 — Image corner radius is a new global requirement with no token

**Where:** New brief §4.

*"All images and sliders need to have round corner on images. Corner radius = 10."*

`CUSTOMIZATION.md` references a `var(--radius)` token in two CSS examples, but its value is never stated in any doc, and there is no indication that it is currently applied to images or slider frames.

**Needs specifying:**

- `--radius: 10px` declared once in the token block.
- Applied to: hero slider frames, feature card images, service card images, team member photos, blog post cards, blog post featured images, gallery items, and any `two_column` section image.
- Slider frames need `overflow: hidden` alongside the radius, or the slides square off the corners at the container edge.
- Safari has a long-standing bug where a rounded parent does not clip a transformed child. If the slider animates with `transform: translateX()`, the child slides will overflow the rounded corner. Fix: `isolation: isolate` on the frame, or radius the individual slide rather than the frame.
- Decide whether the radius scales down on mobile. Recommendation: no — keep 10px everywhere so it reads as a deliberate system value rather than a proportional effect.

---

## MEDIUM-5 — One breakpoint is not enough for the stated goals

**Where:** `CUSTOMIZATION.md` §Changing the mobile breakpoint, `testing.md` §Responsive.

Both docs state there is exactly **one breakpoint, at 900px**, collapsing multi-column grids straight to a single column.

The brief asks for *"better mobile layout"* and *"a different layout for mobile"* modelled on `vancouverliondance.com`. A single 900px breakpoint means a 3-column card grid jumps from 3 → 1 with nothing in between; at 700px that leaves cards absurdly wide, and at 480px the same rules produce cramped type.

**Recommended scale**, to be documented before any CSS is written:

| Token | Width | Layout intent |
|---|---|---|
| `sm` | ≤ 479px | Single column, compact type, stacked CTAs |
| `md` | 480 – 767px | Single column, comfortable type, side-by-side CTAs |
| `lg` | 768 – 1023px | 2-column grids, blog sidebar drops below content |
| `xl` | 1024 – 1279px | 3-column grids, sidebar returns |
| `2xl` | ≥ 1280px | Full desktop, max content width capped |

If Tailwind is adopted, use its default scale rather than inventing one, and note that Tailwind is mobile-first (`min-width`) while the existing CSS is desktop-first (`max-width`). Mixing the two directions in one stylesheet is a reliable source of specificity bugs — pick one.

---

## MEDIUM-6 — Form field spec conflicts with the existing contact page

**Where:** New brief §3 vs. `design.md` §Repository layout.

The brief specifies eight fields: Name, Email, Type of Inquiry (dropdown), Event Date (date picker), Time (dropdown), Organization, Details.

The inherited `contact.njk` is undocumented as to its fields, but `contact-thanks.njk` exists as a **separate redirect page** — which is a Formspree pattern (`_next`). With `fetch()`, there is no redirect; success is handled inline.

**Open questions:**

- Keep `/contact/thanks/` as a real page, or replace it with an inline success state? Inline is better for conversion (no page load, form context preserved on error) but you lose a clean analytics conversion URL. A hybrid works: render success inline **and** push a `history.pushState` / analytics event.
- Which fields are required? Event Date and Time are meaningless for a general enquiry but essential for a booking — so they should conditionally show/require based on the Inquiry Type selection.
- "Time (dropdown)" — what values? Discrete slots (9:00, 9:30 …) or coarse bands (Morning / Afternoon / Evening)? Bands convert better for an initial enquiry; slots imply a real availability system that does not exist here.
- Native `<input type="date">` renders very differently across browsers and is poor on desktop Safari and Firefox. Either accept the inconsistency or add a lightweight JS date picker — which contradicts the "faster loading" goal. Recommendation: accept native, style what is styleable, and set `min` to today's date.
- Timezone: dates submitted as `YYYY-MM-DD` strings avoid UTC-shift bugs when written to Sheets. Do not send a `Date` object.

---

## LOW-1 — HTTPS requirement is already satisfied but under-documented

**Where:** New brief §5 vs. `design.md` §Known gotchas 1, `testing.md` §Regression.

The brief lists *"HTTPS compatible"* as a requirement. This is already handled — GitHub Pages issues a Let's Encrypt certificate automatically and `design.md` documents that Decap CMS *requires* a secure context because of `crypto.randomUUID`.

Not currently documented, and worth adding:

- The Apps Script Web App endpoint is HTTPS-only, so no mixed-content risk from the form.
- A `Strict-Transport-Security` header cannot be set on GitHub Pages (no header control). If HSTS matters, the site needs to sit behind Cloudflare.
- Every embedded asset — map iframe, fonts, any future video embed — must be `https://`, or the browser blocks it as mixed content on an otherwise-secure page.

---

## LOW-2 — README duplicates its own page list

`README.md` lists the seven pages at L4–11 and again, verbatim and unformatted, at L79–85. The second copy sits oddly between the project-layout code block and the "Full layout in design.md" line, and appears to be a paste artifact.

---

## LOW-3 — `feature_cards` icons are hardcoded and cycle after 3

**Where:** `design.md` §Content model, section-type table.

> `feature_cards` — 3 icon tiles (icons hardcoded in template, cycle after 3)

An editor adding a fourth feature card silently gets the first icon again. This is a latent support ticket. Either expose an icon picker in the CMS (a `select` widget over a named icon set), or document the 3-card limit as a hard constraint in `SETUP-GUIDE.md` so the editor is not surprised.

---

## LOW-4 — No accessibility or performance baseline is defined

The brief asks for *"faster loading"* and *"readability"*, but no doc states a target. `testing.md` mentions Lighthouse only under "what could be automated."

**Suggested targets**, to be agreed and then written into `testing.md`:

- Lighthouse Performance ≥ 90 on mobile, Accessibility ≥ 95, SEO ≥ 95.
- LCP < 2.5s on a simulated 4G connection.
- CLS < 0.1 — the hero slider is the main risk here; reserve its height with `aspect-ratio` so it does not shift on load.
- All body text at WCAG AA contrast (4.5:1) minimum. **Flag:** `--gold: #ffc800` on `--white` or `--bg-cream` is roughly 1.5:1 — far below AA. Gold is usable as a *background* behind dark ink, or as a large-format accent, but must never be used for body-size text on a light background.
- Every image gets explicit `width` and `height` attributes, `loading="lazy"` below the fold, and a real `alt` — with the CMS enforcing alt text as a required field.

---

## Summary of decisions still needed

| # | Decision | Blocking? |
|---|---|---|
| 1 | Tailwind replaces `style.css`, or coexists with the token block | Yes — affects every component |
| 2 | Where the actual Eleventy codebase is coming from (BLOCKER-2) | Yes |
| 3 | Figma access — authorize connector or export frames (BLOCKER-3) | Yes |
| 4 | One form or two (free trial vs. lion dance booking) — HIGH-3 | Yes |
| 5 | Time dropdown: discrete slots or coarse bands — MEDIUM-6 | No |
| 6 | Inline success state vs. keeping `/contact/thanks/` — MEDIUM-6 | No |
| 7 | `cta_band` "navy" style renamed or redefined — HIGH-2 | No |
| 8 | Posts per page for blog pagination (suggest 9) — HIGH-4 | No |
| 9 | Google account type for `MailApp` quota (100/day vs 1,500/day) — HIGH-1 | No |
| 10 | Agreed Lighthouse / contrast targets — LOW-4 | No |
