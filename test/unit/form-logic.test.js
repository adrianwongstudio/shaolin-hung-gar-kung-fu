import { describe, it, expect } from "vitest";
const FormLogic = require("../../src/js/form-logic.js");

describe("isHoneypotFilled", () => {
  it("is false for empty, undefined, or whitespace-only values", () => {
    expect(FormLogic.isHoneypotFilled("")).toBe(false);
    expect(FormLogic.isHoneypotFilled(undefined)).toBe(false);
    expect(FormLogic.isHoneypotFilled("   ")).toBe(false);
  });

  it("is true when a bot fills the hidden field", () => {
    expect(FormLogic.isHoneypotFilled("http://spam.example")).toBe(true);
  });
});

describe("isKnownFormType", () => {
  it("accepts the two real form types", () => {
    expect(FormLogic.isKnownFormType("free-trial")).toBe(true);
    expect(FormLogic.isKnownFormType("book-lion-dance")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(FormLogic.isKnownFormType("contact")).toBe(false);
    expect(FormLogic.isKnownFormType("")).toBe(false);
    expect(FormLogic.isKnownFormType(undefined)).toBe(false);
  });
});

describe("buildPayload", () => {
  it("fills every expected key, defaulting missing fields to an empty string", () => {
    const payload = FormLogic.buildPayload({ form_type: "free-trial", name: "Jane", email: "jane@example.com" });

    expect(payload).toEqual({
      form_type: "free-trial",
      name: "Jane",
      email: "jane@example.com",
      phone: "",
      organization: "",
      inquiry_type: "",
      event_date: "",
      event_time: "",
      details: "",
      website: "",
      js_enabled: "1",
    });
  });

  it("always sets js_enabled to 1, regardless of input", () => {
    const payload = FormLogic.buildPayload({ js_enabled: "0" });
    expect(payload.js_enabled).toBe("1");
  });

  it("passes the event_date string through unchanged (no Date conversion)", () => {
    const payload = FormLogic.buildPayload({ event_date: "2026-09-14" });
    expect(payload.event_date).toBe("2026-09-14");
    expect(typeof payload.event_date).toBe("string");
  });
});
