document.addEventListener("DOMContentLoaded", async () => {
  const navbarTarget = document.getElementById("navbar");

  if (navbarTarget) {
    try {
      const response = await fetch("/build-your-perfect-scent/components/navbar.html");
      const html = await response.text();
      navbarTarget.innerHTML = html;
    } catch (error) {
      console.error("Failed to load navbar:", error);
    }
  }

  const year = document.getElementById("year");
  if (year) {
    year.textContent = new Date().getFullYear();
  }

  initHeroSlider();
});

function initHeroSlider() {
  const slider = document.getElementById("heroSlider");
  if (!slider) return;

  const slides = Array.from(slider.querySelectorAll(".slide"));
  const dotsContainer = document.getElementById("sliderDots");
  const prevBtn = document.getElementById("heroPrevBtn");
  const nextBtn = document.getElementById("heroNextBtn");

  if (!slides.length || !dotsContainer) return;

  let currentIndex = slides.findIndex((slide) => slide.classList.contains("active"));
  if (currentIndex < 0) currentIndex = 0;

  let autoplayId = null;

  dotsContainer.innerHTML = "";

  slides.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "slider-dot";
    dot.setAttribute("aria-label", `Go to slide ${index + 1}`);

    if (index === currentIndex) {
      dot.classList.add("active");
    }

    dot.addEventListener("click", () => {
      goToSlide(index);
      restartAutoplay();
    });

    dotsContainer.appendChild(dot);
  });

  const dots = Array.from(dotsContainer.querySelectorAll(".slider-dot"));

  function syncVideoPlayback(indexToShow) {
    slides.forEach((slide, index) => {
      const video = slide.querySelector("video");
      if (!video) return;

      if (index === indexToShow) {
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {});
        }
      } else {
        video.pause();
        try {
          video.currentTime = 0;
        } catch {}
      }
    });
  }

  function goToSlide(index) {
    slides[currentIndex].classList.remove("active");
    dots[currentIndex]?.classList.remove("active");

    currentIndex = (index + slides.length) % slides.length;

    slides[currentIndex].classList.add("active");
    dots[currentIndex]?.classList.add("active");

    syncVideoPlayback(currentIndex);
  }

  function goToNextSlide() {
    goToSlide(currentIndex + 1);
  }

  function goToPrevSlide() {
    goToSlide(currentIndex - 1);
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayId = window.setInterval(goToNextSlide, 4500);
  }

  function stopAutoplay() {
    if (autoplayId) {
      window.clearInterval(autoplayId);
      autoplayId = null;
    }
  }

  function restartAutoplay() {
    startAutoplay();
  }

  prevBtn?.addEventListener("click", () => {
    goToPrevSlide();
    restartAutoplay();
  });

  nextBtn?.addEventListener("click", () => {
    goToNextSlide();
    restartAutoplay();
  });

  slider.addEventListener("mouseenter", stopAutoplay);
  slider.addEventListener("mouseleave", startAutoplay);
  slider.addEventListener("focusin", stopAutoplay);
  slider.addEventListener("focusout", startAutoplay);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAutoplay();
    } else {
      startAutoplay();
      syncVideoPlayback(currentIndex);
    }
  });

  goToSlide(currentIndex);
  startAutoplay();
}