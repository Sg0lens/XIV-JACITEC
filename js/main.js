(function () {
  "use strict";

  /* ---------- Header: solid background after scroll ---------- */
  var header = document.querySelector(".site-header");

  function updateHeaderState() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 40);
  }

  if (header) {
    updateHeaderState();
    window.addEventListener("scroll", updateHeaderState, { passive: true });
  }

  /* ---------- Mobile navigation ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var mainNav = document.querySelector(".main-nav");
  var scrim = document.querySelector(".nav-scrim");

  function closeNav() {
    if (!mainNav) return;
    mainNav.classList.remove("is-open");
    if (scrim) scrim.classList.remove("is-open");
    if (navToggle) {
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
    }
  }

  function openNav() {
    if (!mainNav) return;
    mainNav.classList.add("is-open");
    if (scrim) scrim.classList.add("is-open");
    if (navToggle) {
      navToggle.setAttribute("aria-expanded", "true");
      navToggle.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    }
  }

  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      var isOpen = mainNav.classList.contains("is-open");
      if (isOpen) {
        closeNav();
      } else {
        openNav();
      }
    });

    if (scrim) {
      scrim.addEventListener("click", closeNav);
    }

    mainNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeNav);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) {
        closeNav();
      }
    });
  }

  /* ---------- Hero carousel ---------- */
  var heroImages = document.querySelectorAll(".hero-carousel img");

  if (heroImages.length > 1) {
    var current = 0;
    setInterval(function () {
      heroImages[current].classList.remove("is-active");
      current = (current + 1) % heroImages.length;
      heroImages[current].classList.add("is-active");
    }, 5000);
  }

})();
