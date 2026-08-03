(function () {
  var grid = document.getElementById("gallery-grid");
  var filterNav = document.getElementById("gallery-filter");
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightbox-img");
  var closeBtn = document.getElementById("lightbox-close");
  if (!grid || !lightbox) return;

  var lastFocused = null;

  function openLightbox(link) {
    lastFocused = document.activeElement;
    lightboxImg.src = link.getAttribute("data-full");
    lightboxImg.alt = link.getAttribute("data-alt") || "";
    lightbox.classList.add("is-open");
    closeBtn.focus();
    document.addEventListener("keydown", onKeydown);
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightboxImg.src = "";
    document.removeEventListener("keydown", onKeydown);
    if (lastFocused) lastFocused.focus();
  }

  function onKeydown(e) {
    if (e.key === "Escape") closeLightbox();
  }

  grid.addEventListener("click", function (e) {
    var link = e.target.closest(".gallery-grid__item");
    if (!link) return;
    e.preventDefault();
    openLightbox(link);
  });

  closeBtn.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  if (filterNav) {
    filterNav.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-filter]");
      if (!btn) return;
      filterNav.querySelectorAll(".chip").forEach(function (c) {
        c.classList.toggle("is-active", c === btn);
      });
      var filter = btn.getAttribute("data-filter");
      grid.querySelectorAll(".gallery-grid__item").forEach(function (item) {
        var match = filter === "all" || item.getAttribute("data-category") === filter;
        item.style.display = match ? "" : "none";
      });
    });
  }
})();
