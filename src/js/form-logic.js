/**
 * Pure submission-shaping logic shared by src/js/form.js (browser) and the
 * Vitest unit tests. Mirrors the server-side checks in apps-script/Code.gs —
 * keep the two in sync if either changes, since Apps Script can't import
 * this file directly.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.FormLogic = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  var KNOWN_FORM_TYPES = ["free-trial", "book-lion-dance"];

  function isHoneypotFilled(value) {
    return Boolean(value && String(value).trim().length);
  }

  function isKnownFormType(type) {
    return KNOWN_FORM_TYPES.indexOf(type) !== -1;
  }

  /** fields: a plain object (e.g. from FormData.entries()) */
  function buildPayload(fields) {
    return {
      form_type: fields.form_type || "",
      name: fields.name || "",
      email: fields.email || "",
      phone: fields.phone || "",
      organization: fields.organization || "",
      inquiry_type: fields.inquiry_type || "",
      event_date: fields.event_date || "",
      event_time: fields.event_time || "",
      details: fields.details || "",
      website: fields.website || "",
      js_enabled: "1",
    };
  }

  return { KNOWN_FORM_TYPES: KNOWN_FORM_TYPES, isHoneypotFilled: isHoneypotFilled, isKnownFormType: isKnownFormType, buildPayload: buildPayload };
});
