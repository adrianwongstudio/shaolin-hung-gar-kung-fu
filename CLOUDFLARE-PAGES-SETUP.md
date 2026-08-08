# Cloudflare Pages — one-time setup

The site is built and served by Cloudflare Pages. GitHub only stores the
code; every push to `main` triggers a Cloudflare Pages build automatically
via Cloudflare's GitHub integration.

This document walks through the one-time dashboard setup. Everything else
(builds on push, custom domain, HTTPS, previews for PRs) is automatic
after this.

## Prerequisites

- The Cloudflare account that owns the OAuth Worker
  (`shaolin-decap-oauth-proxy`).
- Push access to `github.com/adrianwongstudio/shaolin-hung-gar-kung-fu`.

## 1. Create the Pages project

1. Cloudflare dashboard → **Workers & Pages** → **Create application** →
   **Pages** tab → **Connect to Git**.
2. Authorize Cloudflare's GitHub app if prompted (repo-specific access is
   fine — pick just `shaolin-hung-gar-kung-fu`, not "all repositories").
3. Pick the `shaolin-hung-gar-kung-fu` repo.
4. **Project name**: `shaolinhunggarkungfu` — this becomes the default URL
   `shaolinhunggarkungfu.pages.dev`. This value already lives in
   `src/admin/config.yml` as `site_url`, so keep it exact.
5. **Production branch**: `main`.
6. **Build settings**:
   - Framework preset: **Eleventy** (or "None" — either works).
   - Build command: `npm run build`
   - Build output directory: `_site`
   - Root directory: leave empty (default)
7. **Environment variables**: none needed. If Cloudflare's Node default
   is stale, add `NODE_VERSION` = `22`.
8. Click **Save and Deploy**.

The first build takes 60–90 seconds. When it's done, the site is live at
`https://shaolinhunggarkungfu.pages.dev`.

## 2. Verify

```bash
curl -sI https://shaolinhunggarkungfu.pages.dev/ | head -3
curl -sI https://shaolinhunggarkungfu.pages.dev/kung-fu/ | head -3
curl -sI https://shaolinhunggarkungfu.pages.dev/blog/ | head -3
curl -sI https://shaolinhunggarkungfu.pages.dev/admin/ | head -3
```

All should return `HTTP/2 200`. Visit the `.pages.dev` URL in a browser
— CSS, images, nav, and blog should all render.

## 3. Wire the CMS to it

`src/admin/config.yml` already has `site_url:
https://shaolinhunggarkungfu.pages.dev`. That's what the "View Live"
button in Decap uses to build post URLs. No change needed unless the
Cloudflare project name differs from `shaolinhunggarkungfu` — if so,
edit `site_url` to match and commit.

Nothing else in the CMS setup changes. The OAuth Worker at
`shaolin-decap-oauth-proxy.legacy-financial-planning.workers.dev`
still handles login. GitHub OAuth App callback URL still points at
that Worker's `/callback` path.

## 4. Add the custom domain (when ready)

In the Pages project → **Custom domains** → **Set up a custom domain** →
enter `shaolinhunggarkungfu.com`.

If the domain is on Cloudflare (DNS on Cloudflare nameservers):
- Cloudflare adds the CNAME record automatically.
- HTTPS cert issues in ~1 minute (not up to 24h like GitHub).

If the domain is elsewhere:
- Cloudflare tells you which CNAME to add at your DNS provider (usually
  `<project>.pages.dev`).
- HTTPS still issues fast once DNS resolves.

After the domain is live:

1. Cloudflare Pages automatically starts serving at both
   `shaolinhunggarkungfu.com` and `shaolinhunggarkungfu.pages.dev`
   (with optional redirect from `.pages.dev` → custom domain, toggleable
   in Pages settings).
2. Edit `src/admin/config.yml` → uncomment the
   `site_url: https://shaolinhunggarkungfu.com` line, comment the
   `.pages.dev` one. Commit + push.

That's the whole custom-domain flow — no `PATH_PREFIX`, no CNAME file
gating, no rebuild config to flip. What broke the GitHub Pages setup
repeatedly doesn't exist here.

## What was removed from this repo (for reference)

- `.github/workflows/deploy.yml` — GitHub Pages deploy is retired.
- `src/CNAME`, `src/.nojekyll`, root `.nojekyll` — GitHub-Pages-only cargo.
- `PATH_PREFIX` env + `pathPrefix` in `.eleventy.js` — Cloudflare Pages
  serves at `/`, no prefix ever.
- The `configure-pages` / `upload-pages-artifact` / `deploy-pages` action
  chain — Cloudflare Pages builds directly from the repo.

`.github/workflows/ci.yml` remains, running tests on PRs *and* pushes to
main (so CMS commits that break the build get flagged).

## Legacy dashboard: turn off old GitHub Pages

Once Cloudflare Pages is verified working:

- GitHub repo → **Settings → Pages** → **Source: None**. (If the old
  GH Pages deployment is still live, it will keep serving until you turn
  it off here.)

That's it. From now on: git push → Cloudflare builds and deploys, no
manual steps.
