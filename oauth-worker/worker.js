/**
 * Minimal GitHub OAuth proxy for Decap CMS, deployed as a Cloudflare Worker.
 * See ../design.md#2-cloudflare-worker-oauth-proxy-15-min
 *
 * /auth      → redirects the CMS's "Login with GitHub" button to GitHub
 * /callback  → exchanges the code + client secret for a token, then posts
 *              it back to the CMS popup window via postMessage
 *
 * Secrets (wrangler secret put): GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
 */

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/auth") return handleAuth(url, env);
    if (url.pathname === "/callback") return handleCallback(request, url, env);

    return new Response("Not found", { status: 404 });
  },
};

function handleAuth(url, env) {
  const state = crypto.randomUUID();
  const redirectUri = `${url.origin}/callback`;

  const authorizeUrl = new URL(GITHUB_AUTHORIZE_URL);
  authorizeUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", "repo,user");
  authorizeUrl.searchParams.set("state", state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorizeUrl.toString(),
      // short-lived, used only to check the callback's state param matches
      "Set-Cookie": `oauth_state=${state}; Max-Age=600; Path=/; HttpOnly; Secure; SameSite=Lax`,
    },
  });
}

async function handleCallback(request, url, env) {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = getCookie(request, "oauth_state");

  if (!code || !state || state !== cookieState) {
    return new Response("Invalid OAuth state", { status: 400 });
  }

  const tokenRes = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const tokenJson = await tokenRes.json();

  if (!tokenJson.access_token) {
    return new Response("GitHub token exchange failed", { status: 502 });
  }

  const payload = JSON.stringify({ token: tokenJson.access_token, provider: "github" }).replace(/'/g, "\\'");

  // Decap's popup protocol: wait for the opener to signal it's ready, then
  // post the token; also post immediately in case the message already fired.
  const html = `<!doctype html><html><body>
<script>
  (function () {
    function receiveMessage(e) {
      window.opener.postMessage('authorization:github:success:${payload}', e.origin);
    }
    window.addEventListener('message', receiveMessage, false);
    window.opener.postMessage('authorizing:github', '*');
  })();
</script>
</body></html>`;

  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

function getCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  const match = header.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
  return match ? match[1] : null;
}
