# Decap CMS OAuth proxy — Cloudflare Worker

Source for the GitHub OAuth proxy the CMS at `/admin/` needs to authenticate
editors. Full context in
[`../design.md`](../design.md#2-cloudflare-worker-oauth-proxy-15-min).

> ⚠️ **Always run commands from THIS directory (`oauth-worker/`), never from the
> repo root.** Running `wrangler deploy` from repo root has repeatedly deployed
> the built Eleventy site into this Worker's slot, wiping out the OAuth code
> and taking down `/admin/` login. A `predeploy` preflight
> ([`scripts/preflight.js`](scripts/preflight.js)) will refuse to deploy from
> the wrong directory or with a suspect `wrangler.toml`, but only when you use
> `npm run deploy` — bare `wrangler deploy` bypasses it. See design.md
> gotcha #10 for the full recovery playbook.

```bash
cd oauth-worker               # do this first, always
npm install                   # installs wrangler locally, no sudo
npm run login                 # authorize wrangler in the browser
npm run secret:client-id      # paste the GitHub OAuth App's Client ID
npm run secret:client-secret  # paste the GitHub OAuth App's Client Secret
npm run deploy                # runs preflight → wrangler deploy
```

After deploying:

1. Copy the printed `https://<name>.<account>.workers.dev` URL.
2. Update the GitHub OAuth App's callback URL to `<that-url>/callback`.
3. Update `src/admin/config.yml` → `backend.base_url` to `<that-url>`.

Do not reuse this Worker across two OAuth Apps — the callback URL is fixed
to one app.
