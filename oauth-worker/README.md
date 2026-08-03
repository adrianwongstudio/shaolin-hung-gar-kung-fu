# Decap CMS OAuth proxy — Cloudflare Worker

Source for the GitHub OAuth proxy the CMS at `/admin/` needs to authenticate
editors. Full context in
[`../design.md`](../design.md#2-cloudflare-worker-oauth-proxy-15-min).

**Not deployed as part of this build** — deploy when the site is ready to go
live, after a GitHub OAuth App exists (see `../design.md` step 1).

```bash
npm install                    # installs wrangler locally, no sudo
npm run login                  # authorize wrangler in the browser
npm run secret:client-id       # paste the GitHub OAuth App's Client ID
npm run secret:client-secret   # paste the GitHub OAuth App's Client Secret
npm run deploy
```

After deploying:

1. Copy the printed `https://<name>.<account>.workers.dev` URL.
2. Update the GitHub OAuth App's callback URL to `<that-url>/callback`.
3. Update `src/admin/config.yml` → `backend.base_url` to `<that-url>`.

Do not reuse this Worker across two OAuth Apps — the callback URL is fixed
to one app.
