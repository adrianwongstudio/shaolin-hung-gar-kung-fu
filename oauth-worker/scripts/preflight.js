#!/usr/bin/env node
/**
 * Preflight for `wrangler deploy` — guarantees we're deploying the OAuth
 * worker, not something else. Every incident where the worker slot got
 * overwritten started with someone running `wrangler deploy` from the
 * wrong directory (repo root) and silently uploading the Eleventy site as
 * a static-assets worker. This script makes that failure loud instead.
 *
 * Checks (all must pass):
 *   1. cwd is the oauth-worker/ directory (basename matches).
 *   2. worker.js exists and contains our OAuth handler signatures
 *      (handleAuth, GITHUB_TOKEN_URL) — proves it's OUR worker file, not
 *      some other JS file that happens to be named worker.js.
 *   3. wrangler.toml exists, and its `main` points at worker.js, and its
 *      `name` matches what's deployed on Cloudflare
 *      (shaolin-decap-oauth-proxy) — prevents a stray wrangler.toml at a
 *      parent directory from being picked up.
 *   4. wrangler.toml does NOT declare `[assets]`, `[site]`, or
 *      `assets = ...` — that's what turns a "worker" into a static-site
 *      hosting slot and is exactly how we've been overwriting the OAuth
 *      code with the Eleventy build.
 *
 * Any failure prints a clear remediation and exits 1 so wrangler never
 * runs.
 */
const fs = require("fs");
const path = require("path");

function fail(msg) {
  console.error("\n[31m✗ oauth-worker deploy preflight failed[0m");
  console.error("  " + msg.replace(/\n/g, "\n  "));
  console.error(
    "\nRun this from the oauth-worker/ directory only:\n" +
      "  cd oauth-worker\n" +
      "  npm run deploy\n"
  );
  process.exit(1);
}

// 1. Working directory
if (path.basename(process.cwd()) !== "oauth-worker") {
  fail(
    "Current directory is '" +
      process.cwd() +
      "'.\nDeploy must run from oauth-worker/, not the repo root."
  );
}

// 2. worker.js sanity
const workerPath = path.join(process.cwd(), "worker.js");
if (!fs.existsSync(workerPath)) {
  fail("worker.js not found in " + process.cwd() + ".");
}
const workerSrc = fs.readFileSync(workerPath, "utf8");
if (!/handleAuth\b/.test(workerSrc) || !/GITHUB_TOKEN_URL\b/.test(workerSrc)) {
  fail(
    "worker.js exists but doesn't look like the OAuth proxy.\n" +
      "Expected identifiers `handleAuth` and `GITHUB_TOKEN_URL` are missing."
  );
}

// 3. wrangler.toml sanity
const tomlPath = path.join(process.cwd(), "wrangler.toml");
if (!fs.existsSync(tomlPath)) {
  fail("wrangler.toml not found in " + process.cwd() + ".");
}
const toml = fs.readFileSync(tomlPath, "utf8");
const nameMatch = toml.match(/^\s*name\s*=\s*"([^"]+)"/m);
const mainMatch = toml.match(/^\s*main\s*=\s*"([^"]+)"/m);
if (!nameMatch || nameMatch[1] !== "shaolin-decap-oauth-proxy") {
  fail(
    'wrangler.toml `name` must be "shaolin-decap-oauth-proxy" (found: ' +
      (nameMatch ? '"' + nameMatch[1] + '"' : "missing") +
      "). Deploying under a different name creates an orphan worker with no secrets."
  );
}
if (!mainMatch || mainMatch[1] !== "worker.js") {
  fail(
    'wrangler.toml `main` must be "worker.js" (found: ' +
      (mainMatch ? '"' + mainMatch[1] + '"' : "missing") +
      ")."
  );
}

// 4. no static-assets bindings
if (/^\s*\[assets\]/m.test(toml) || /^\s*assets\s*=/m.test(toml)) {
  fail(
    "wrangler.toml contains an `[assets]` or `assets = ...` binding.\n" +
      "That turns the worker into a static-site host and would overwrite the OAuth proxy."
  );
}
if (/^\s*\[site\]/m.test(toml)) {
  fail(
    "wrangler.toml contains a `[site]` binding.\n" +
      "That's Workers Sites — will overwrite the OAuth proxy with static content."
  );
}

console.log("✓ oauth-worker deploy preflight OK");
