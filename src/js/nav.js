(function () {
  var header = document.getElementById("site-header");
  var toggle = document.getElementById("nav-toggle");
  var overlay = document.getElementById("nav-overlay");
  var closeBtn = document.getElementById("nav-overlay-close");

  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 4);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (!toggle || !overlay) return;

  var lastFocused = null;

  function getFocusable() {
    return Array.prototype.slice.call(
      overlay.querySelectorAll('a[href], button:not([disabled])')
    );
  }

  function openMenu() {
    lastFocused = document.activeElement;
    overlay.hidden = false;
    requestAnimationFrame(function () {
      overlay.classList.add("is-open");
    });
    document.body.classList.add("nav-open");
    toggle.setAttribute("aria-expanded", "true");
    var focusable = getFocusable();
    if (focusable.length) focusable[0].focus();
    document.addEventListener("keydown", onKeydown);
  }

  function closeMenu() {
    overlay.classList.remove("is-open");
    document.body.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
    document.removeEventListener("keydown", onKeydown);
    setTimeout(function () {
      overlay.hidden = true;
    }, 250);
    if (lastFocused) lastFocused.focus();
  }

  function onKeydown(e) {
    if (e.key === "Escape") {
      closeMenu();
      return;
    }
    if (e.key !== "Tab") return;
    var focusable = getFocusable();
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  toggle.addEventListener("click", openMenu);
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);
  overlay.querySelectorAll("nav a").forEach(function (a) {
    a.addEventListener("click", closeMenu);
  });
})();
