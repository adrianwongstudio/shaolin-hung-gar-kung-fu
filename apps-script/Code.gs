/**
 * Form handler for both /free-trial/ and /book-lion-dance/.
 * Deploy as a Web App: Execute as "Me", Who has access "Anyone".
 * See ../design.md#3-google-apps-script-web-app--form-handler-20-min
 *
 * Script Properties required:
 *   SHEET_ID            — the enquiries Google Sheet's ID
 *   NOTIFY_FREE_TRIAL    — comma-separated staff recipients for trial signups
 *   NOTIFY_LION_DANCE    — comma-separated staff recipients for booking enquiries
 *   SITE_URL             — e.g. https://shaolinhunggarkungfu.com (used for the no-JS redirect)
 */

var KNOWN_FORM_TYPES = ["free-trial", "book-lion-dance"];

var SHEET_COLUMNS = {
  "free-trial": ["timestamp", "name", "email", "phone", "details"],
  "book-lion-dance": [
    "timestamp",
    "name",
    "email",
    "phone",
    "organization",
    "inquiry_type",
    "event_date",
    "event_time",
    "details",
  ],
};

function doPost(e) {
  try {
    var data = parseRequest(e);
    var result = handleSubmission(data);
    return respond(data, result);
  } catch (err) {
    logError_(err, e);
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "server_error" })).setMimeType(
      ContentService.MimeType.JSON
    );
  }
}

/** Accepts both the JS-enhanced fetch() body (JSON, Content-Type: text/plain)
 *  and a plain browser form POST (application/x-www-form-urlencoded) so the
 *  form still works with JavaScript disabled. */
function parseRequest(e) {
  if (e.postData && e.postData.type === "text/plain" && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (err) {
      // fall through to e.parameter
    }
  }
  return e.parameter || {};
}

function handleSubmission(data) {
  if (data.website) {
    // Honeypot: bots fill hidden fields. Reject silently — no row, no email.
    return { ok: true, honeypot: true };
  }

  if (KNOWN_FORM_TYPES.indexOf(data.form_type) === -1) {
    return { ok: false, error: "unknown_form_type" };
  }

  appendRow_(data);
  notify_(data);
  return { ok: true };
}

function appendRow_(data) {
  var sheetId = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
  var sheet = SpreadsheetApp.openById(sheetId).getSheetByName(data.form_type);
  if (!sheet) throw new Error("No sheet tab named " + data.form_type);

  var columns = SHEET_COLUMNS[data.form_type];
  var row = columns.map(function (col) {
    if (col === "timestamp") return new Date();
    // event_date must stay the exact YYYY-MM-DD string the browser sent —
    // never wrap it in `new Date()` here, or the sheet's timezone shifts it
    // to the wrong day.
    return data[col] || "";
  });
  sheet.appendRow(row);
}

function notify_(data) {
  var props = PropertiesService.getScriptProperties();
  var recipientsKey = data.form_type === "free-trial" ? "NOTIFY_FREE_TRIAL" : "NOTIFY_LION_DANCE";
  var recipients = (props.getProperty(recipientsKey) || "").trim();

  if (recipients) {
    MailApp.sendEmail({
      to: recipients,
      subject: "New " + data.form_type + " enquiry — " + (data.name || "unknown"),
      body: Object.keys(data)
        .filter(function (k) {
          return k !== "website" && k !== "js_enabled";
        })
        .map(function (k) {
          return k + ": " + data[k];
        })
        .join("\n"),
    });
  }

  if (data.email) {
    MailApp.sendEmail({
      to: data.email,
      subject: "Thanks for reaching out — Shaolin Hung Gar Kung Fu",
      body: "Hi " + (data.name || "") + ",\n\nWe've received your submission and will be in touch soon.\n\n— Shaolin Hung Gar Kung Fu",
    });
  }
}

/** JS-enhanced submissions (js_enabled: "1") get a JSON response the fetch()
 *  call can read. A plain no-JS form POST gets an HTML page that redirects
 *  to /thanks/, since Apps Script web apps cannot issue a real 302. */
function respond(data, result) {
  if (data.js_enabled === "1") {
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }

  var siteUrl = PropertiesService.getScriptProperties().getProperty("SITE_URL") || "";
  var target = result.ok ? siteUrl + "/thanks/" : siteUrl + "/" + (data.form_type || "") + "/";
  return HtmlService.createHtmlOutput(
    '<meta http-equiv="refresh" content="0;url=' + target + '">'
  );
}

function logError_(err, e) {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
    var sheet = SpreadsheetApp.openById(sheetId).getSheetByName("_errors");
    if (sheet) {
      sheet.appendRow([new Date(), String(err), e && e.postData ? e.postData.contents : ""]);
    }
  } catch (loggingErr) {
    // Nothing more we can do — avoid throwing from the error handler itself.
  }
}
