# Shaolin Hung Gar Kung Fu — Website Setup & Editing Guide

This is your new website: eight pages (Home, Kung Fu, Lion Dance, Gallery,
Blog, About, Free Trial Class, Book Lion Dance), free hosting on GitHub,
and a simple admin screen your team uses to edit everything — no code
required.

It's built as a small static site (using a tool called Eleventy) with the
**Decap CMS** editor wired in. You don't need to understand any of that to
run it — just follow the steps below.

---

## What you have

An eight-page website:

- **Home** — hero slider, offers, latest blog posts. Every section can be
  reordered, added to, or removed.
- **Kung Fu** — classes, lineage, schedule, and membership info.
- **Lion Dance** — what the troupe offers, performance types, past events.
- **Gallery** — a filterable photo grid with a lightbox viewer.
- **Blog** — listing page + individual posts. Categories and tags let you
  organize posts; filter pages generate automatically at
  `/blog/category/<name>/` and `/blog/tag/<name>/`.
- **About** — the school's history, sifu bio, and values.
- **Free Trial Class** — a short signup form for a free first class.
- **Book Lion Dance** — a longer enquiry form for booking a performance.

Plus a private **admin screen** at `yoursite.com/admin/` where your team
edits everything.

**Hosting is free** — the site runs on GitHub Pages, both forms post to a
Google Apps Script Web App (enquiries land in a Google Sheet and are
emailed to staff), and the admin login uses your GitHub account. No
monthly bills.

---

## Part 1 — Logging in

1. Open `https://shaolinhunggarkungfu.com/admin/` in your browser
2. Click **Login with GitHub**
3. If you're not already signed into GitHub, sign in with your GitHub
   account
4. First time only: click **Authorize** on the GitHub screen — this lets
   the CMS save your edits
5. You're in the editor

**Important**: use `https://` not `http://` — the login needs a secure
connection. If you go to `http://yoursite.com/admin/` you'll see a
`crypto.randomUUID` error. Just add the `s`.

**Only people with access to the GitHub repo can log in.** Random visitors
who click "Login with GitHub" can complete sign-in but won't be able to
save any changes — GitHub blocks them. To add another editor, see
[Part 8](#part-8--adding-another-editor).

---

## Part 2 — Adding a blog post

1. From the admin sidebar, click **Blog Posts**
2. Click **+ New Blog Post** (top right)
3. Fill in the fields:
   - **Title** — the post's headline
   - **Date** — today, or whatever date should show on the post
   - **Category** — pick one from the dropdown. To add a new category
     first, see [Part 3](#part-3--managing-categories-and-tags).
   - **Tags** — pick any number, or none. Same "add new one first" flow
     as categories.
   - **Featured Image** — click, upload. Recommended: 1200×750 or larger
     for a sharp result. Shown at the top of the post and on the blog card.
   - **Image Focus** — pick which part of the image stays visible when
     it's cropped (top / center / bottom). "top" is safest for photos of
     people.
   - **Excerpt** — one or two sentences shown on the blog listing card
   - **Author Bio** — optional, shown at the bottom of the post
   - **Body** — the article itself. Formatting toolbar for headings,
     bold, links, lists, images
4. Click **Publish** (top right)
5. Wait ~1 minute — the site rebuilds automatically. Refresh the front
   end (`/blog/`) to see the post live.

**To edit a post**: Blog Posts → click it → change what you need →
Publish. Same 1-minute wait to see it live.

**To delete a post**: open it → **Delete Blog Post** button (bottom left).

---

## Part 3 — Managing categories and tags

**Categories** are broad groupings (Kung Fu, Lion Dance, Events, Student
Stories, etc.). Each post has exactly one category.

**Tags** are specific keywords (hung-gar, forms, competition, beginners,
chinese-new-year, etc.). Each post can have any number of tags, or none.

Both are lists you manage yourself — the dropdowns on the Blog Post form
pull from them.

**Adding a category:**

1. Admin sidebar → **Categories**
2. **+ New Category**
3. **Name** field — type it (e.g. "Student Stories")
4. **Publish**

The new category is available in the Blog Post form's Category dropdown
the next time you open a post. It's also available for tagging Gallery
photos (see [Part 6](#part-6--uploading-images)).

**Adding a tag** — same flow, in the **Tags** section.

**Renaming a category or tag** — open it in the Categories or Tags list,
change the Name, publish. But: existing posts still reference the OLD
name in their files, so you'd need to open each post using that category
and re-pick it from the dropdown. Easier to keep the name and just add
new ones for new concepts.

**Deleting a category or tag** — open it → **Delete**. Any post that
still references the deleted category will show a broken reference until
you edit the post and pick a different one.

---

## Part 4 — Editing the home page

The home page is built from **sections**, each of which you can add,
remove, or drag to reorder.

1. Admin sidebar → **Home Page → Home Page Content**
2. Under **Page Sections**, you'll see the current sections collapsed —
   e.g. "hero_slider — …", "team — Meet the Instructors". Click any to
   expand.
3. **To reorder**: drag the `═` handle at the top of a section to a new
   spot in the list
4. **To delete**: click the `✕` on a section (it's removed on save)
5. **To add**: click **Add Section** (top right of the list), pick a type
   from the dropdown

Section types available:

| Type | What it looks like |
|---|---|
| Hero Slider | Full-width rotating banner at the top, with a background image per slide |
| Consultation Banner | Gold band with a short message + button |
| Feature Cards | Up to 3 tiles with icons (a 4th card repeats the first icon — keep it to 3) |
| Services | 3-column list with icons and an optional link per card |
| Service Cards | Like Services but without icons |
| About | Two-column text + a stat panel (e.g. "3 — Pillars: Discipline, Community, Tradition") |
| Team | Grid of instructor cards (photo, name, role, bio) |
| Latest Blog Posts | Shows the 3 newest posts automatically — nothing to configure but the heading |
| Tile Grid | Generic 3-tile row, images optional |
| Two Column | Text + optional image, side by side; choose which side the image sits on |
| Call To Action Band | Full-width banner — background is **red**, **gold**, **soft**, or **plain** |
| Rich Text | Free-form paragraph (with formatting) |
| Testimonial | Large italic quote with attribution |
| Video Embed | Embeds a YouTube/Vimeo video, with an optional caption |

**Publish** to save. Site rebuilds in ~1 minute.

**Tip**: sections you're building can be collapsed (click the arrow) so
the list stays manageable. Each section shows a summary of what it
contains when collapsed.

---

## Part 5 — Editing site info (phone, email, logo, etc.)

Admin sidebar → **Settings → Site Settings**

Fields:
- Business Name, Tagline, Description (used in the footer and page `<meta>` tags)
- Phone, Email, Secondary Email (leave blank if none)
- Address
- Logo (upload)
- Site URL — the live domain; only change this if the domain changes

Any change here updates the site everywhere the value is used — header,
footer, both forms, etc. — automatically. The phone number you enter here
also becomes the tappable phone link, so you only ever need to update it
in one place.

There's a second file in the same **Settings** section, **Forms
Settings**, with the dropdown options for the Book Lion Dance form
(Type of Inquiry, Time) and the Apps Script endpoint URL. Leave the
endpoint alone unless your web helper tells you to change it.

---

## Part 6 — Uploading images

The CMS handles image uploads for you. Anywhere there's an "Image" field:

1. Click the field (or the current image thumbnail if there is one)
2. Either **Upload** a new file or **Choose from Media Library** to pick
   one you've already uploaded
3. The image lives at `/images/<name>` and is available across the site

**Gallery photos** are managed separately from the home page: Admin
sidebar → **Gallery → Gallery Photos**. Each entry has a Category (pick
from the same list as blog categories), a Photo, and Alt Text (a short
description for visitors using a screen reader — always fill this in).

Recommended sizes:
- **Logo**: at least 400×200 (or SVG for perfect scaling)
- **Team photos**: at least 600×600 (square or portrait)
- **Blog featured images**: at least 1200×750
- **Hero slider images**: at least 1600×900, landscape, with room at the
  bottom for the overlaid heading text
- **Gallery photos**: at least 1000×1000

Very small images will look pixelated when scaled up. Bigger is better —
the site downsizes for display but can't upsize.

---

## Part 7 — The two forms (Free Trial Class & Book Lion Dance)

There are two separate forms, for two separate conversion goals:

- **`/free-trial/`** — short (name, email, phone, what they're interested
  in). For people who want to try a class.
- **`/book-lion-dance/`** — longer (adds organization, type of inquiry,
  event date, time, and details). For people booking a performance.

Both post to the same Apps Script Web App behind the scenes. When someone
submits:

1. A row is added to the enquiries Google Sheet (a separate tab per form).
2. Staff get an email notification.
3. The sender gets a confirmation email.

**Nothing to configure day-to-day** — the dropdown options on the Book
Lion Dance form (Type of Inquiry, Time) live in **Settings → Forms
Settings** if they ever need to change (see [Part 5](#part-5--editing-site-info-phone-email-logo-etc)).

**Note for your web helper:** these forms won't actually send anything
until the Apps Script Web App is deployed and its URL is set in Forms
Settings — see `apps-script/README.md` and `design.md`.

---

## Part 8 — Adding another editor

To let another team member edit the site:

1. They need a **GitHub account** (free — sign up at github.com)
2. Send their GitHub username to whoever owns the site's repo
3. Repo owner adds them: GitHub → the repo → **Settings** → **Collaborators**
   → **Add people** → type their username
4. They accept the invite (email + GitHub notification)
5. They visit `yoursite.com/admin/`, click **Login with GitHub**, authorize,
   and they're in

Their edits will show up in the git history under their own name, so you
can see who changed what.

---

## Part 9 — Publishing (what happens when you click Publish)

Under the hood, publishing a change writes to a file on GitHub, which
triggers an automatic rebuild of the site. The whole thing takes about
90 seconds:

- 0s — you click **Publish**
- 5s — the CMS saves your change to GitHub
- 10s — GitHub starts a build job
- 60s — build completes, publishes to the live site
- 90s — your change is visible when you refresh the front-end

**If a change doesn't appear after 90 seconds** — refresh with cache
bypassed (`Cmd + Shift + R` on Mac, `Ctrl + Shift + R` on Windows). Your
browser is probably showing an old cached version.

---

## Part 10 — Common problems and fixes

**"crypto.randomUUID is not a function" when I try to log in**
→ You went to `http://` — need `https://`. Change the URL and reload.

**Login popup shows "Server not found"**
→ Talk to your web helper. The CMS's OAuth proxy might be down or
misconfigured. Not something you can fix on your side.

**Uploaded image doesn't appear in the post**
→ Make sure you actually clicked **Publish** on the post after inserting
the image. Uploading and inserting are separate steps.

**The site looks unstyled — like plain black text on white**
→ Browser cache. Open in a private/incognito window to confirm; if it
looks right there, hard-reload your main browser to clear the stale
cache.

**Category dropdown doesn't show my new category**
→ Reload the CMS admin page (`Cmd + R`). New categories don't always
appear in an already-open Blog Post form until you refresh.

**Delete button is missing on a section**
→ You're viewing the section in collapsed form. Click the arrow to
expand; the `✕` is at the top-right of the expanded section.

**Someone submitted a form but I never got an email**
→ Not something you can fix from the CMS — this is on the Apps Script
side (recipient list, daily send quota, or deployment). Talk to your web
helper; see `apps-script/README.md`'s troubleshooting notes in
`testing.md`.

---

Full developer docs:
- [`README.md`](./README.md) — stack overview, testing
- [`design.md`](./design.md) — architecture reference
- [`testing.md`](./testing.md) — verification playbook
- [`CUSTOMIZATION.md`](./CUSTOMIZATION.md) — customization guide
- [`PAGINATION.md`](./PAGINATION.md) — blog pagination build spec
- [`INCONSISTENCIES.md`](./INCONSISTENCIES.md) — decisions made while building this site

---

Questions? Ask your web helper.
