(function () {
  var forms = document.querySelectorAll(".js-form");
  if (!forms.length) return;

  forms.forEach(function (form) {
    var jsFlag = form.querySelector('input[name="js_enabled"]');
    if (jsFlag) jsFlag.value = "1";

    var statusEl = form.querySelector(".form-status");
    var submitBtn = form.querySelector(".form-submit");
    var endpoint = form.getAttribute("action");
    var formType = form.getAttribute("data-form-type");

    function setStatus(kind, message) {
      if (!statusEl) return;
      statusEl.textContent = message;
      statusEl.className = "form-status is-visible form-status--" + kind;
      statusEl.setAttribute("role", kind === "error" ? "alert" : "status");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var data = new FormData(form);

      // Honeypot: bots fill hidden fields. Pretend success, submit nothing.
      if (window.FormLogic.isHoneypotFilled(data.get("website"))) {
        setStatus("success", "Thanks — we'll be in touch soon.");
        form.reset();
        return;
      }

      if (!form.reportValidity()) return;

      var fields = {};
      data.forEach(function (value, key) {
        fields[key] = value;
      });
      fields.form_type = formType;
      var payload = window.FormLogic.buildPayload(fields);

      if (submitBtn) submitBtn.setAttribute("disabled", "disabled");
      setStatus("success", "Sending…");
      if (statusEl) statusEl.className = "form-status is-visible";

      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain" }, // avoids a CORS preflight Apps Script can't answer
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          return res.json();
        })
        .then(function (json) {
          if (!json || !json.ok) throw new Error("Form submission failed");
          setStatus("success", "Thanks — we've received your submission and will be in touch soon.");
          form.reset();
          if (window.history && window.history.pushState) {
            window.history.pushState({}, "", form.getAttribute("data-thanks-url") || "/thanks/");
          }
          form.dispatchEvent(new CustomEvent("form:submitted", { detail: { formType: formType } }));
        })
        .catch(function () {
          setStatus(
            "error",
            "Something went wrong sending your message. Please call " +
              (form.getAttribute("data-phone") || "us") +
              " or try again."
          );
        })
        .finally(function () {
          if (submitBtn) submitBtn.removeAttribute("disabled");
        });
    });
  });
})();
