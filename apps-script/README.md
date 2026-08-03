# Apps Script form handler — deploy steps

Source for the shared `/free-trial/` + `/book-lion-dance/` form endpoint.
Full context in [`../design.md`](../design.md#3-google-apps-script-web-app--form-handler-20-min).

**Not deployed as part of this build** — these are the source files to paste
into the Apps Script editor when the site is ready to go live.

1. Create a Google Sheet named `Shaolin Hung Gar — Enquiries`, with tabs
   named exactly `free-trial`, `book-lion-dance`, and `_errors`. Row 1 of
   each holds column headers matching `SHEET_COLUMNS` in `Code.gs`.
2. In the Sheet: **Extensions → Apps Script**. Paste in `Code.gs` and
   `appsscript.json`.
3. **Project Settings → Script Properties**, add:
   - `SHEET_ID` — the Sheet's ID from its URL
   - `NOTIFY_FREE_TRIAL` — comma-separated recipients for trial signups
   - `NOTIFY_LION_DANCE` — comma-separated recipients for booking enquiries
   - `SITE_URL` — e.g. `https://shaolinhunggarkungfu.com`
4. **Deploy → New deployment → Web app.** Execute as **Me**, who has access
   **Anyone** (not "Anyone with a Google account" — that silently fails for
   logged-out visitors).
5. Authorize the requested scopes (Sheets + send email as you).
6. Copy the `/exec` URL into `src/_data/forms.json` → `endpoint` (or via the
   CMS: Settings → Forms Settings → Apps Script Endpoint).

**Redeploying:** always use *Manage deployments → edit the existing
deployment → Version: New version*. Choosing "New deployment" mints a
different `/exec` URL and silently breaks the live form.
