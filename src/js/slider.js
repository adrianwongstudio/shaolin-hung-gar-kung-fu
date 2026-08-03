(function () {
  var sliders = document.querySelectorAll(".hero-slider");
  sliders.forEach(function (slider) {
    var track = slider.querySelector(".hero-slider__track");
    var slides = slider.querySelectorAll(".hero-slider__slide");
    var dots = slider.querySelectorAll(".hero-slider__dot");
    if (!track || slides.length < 2) return;

    var index = 0;
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = "translateX(-" + index * 100 + "%)";
      dots.forEach(function (dot, di) {
        dot.classList.toggle("is-active", di === index);
        dot.setAttribute("aria-current", di === index ? "true" : "false");
      });
    }

    dots.forEach(function (dot, di) {
      dot.addEventListener("click", function () {
        goTo(di);
        resetTimer();
      });
    });

    var timer;
    function resetTimer() {
      if (reduceMotion) return;
      clearInterval(timer);
      timer = setInterval(function () {
        goTo(index + 1);
      }, 6000);
    }

    goTo(0);
    resetTimer();
  });
})();
