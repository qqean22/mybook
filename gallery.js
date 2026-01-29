// Use the jQuery Justified Gallery plugin for a Pic-Time style layout.
// IMAGE_PATHS is defined in index.html.
(function () {
  /**
   * Initialize the justified gallery using the jQuery plugin.
   * @param {string} rootId - DOM id for the gallery container.
   * @param {string[]} imagePaths - array of image URLs.
   */
  window.initJustifiedGallery = function (rootId, imagePaths) {
    const root = document.getElementById(rootId);
    if (!root) return;
    if (typeof window.jQuery === "undefined" || !jQuery.fn.justifiedGallery) {
      console.error("jQuery Justified Gallery plugin is not available.");
      return;
    }

    const $root = jQuery(root);
    $root.empty();

    // Populate with <a><img /></a> items from the provided paths
    imagePaths.forEach((src, index) => {
      const $a = jQuery("<a/>", { href: src, "data-index": index });
      const $img = jQuery("<img/>", {
        src,
        loading: "lazy",
        alt: ""
      });
      $a.append($img);
      $root.append($a);
    });

    // Initialize the plugin
    $root.justifiedGallery({
      rowHeight: 260,
      margins: 2,
      lastRow: "nojustify",
      border: 0,
      captions: false,
      waitThumbnailsLoad: true
    });

    // Simple lightbox/slideshow
    let currentIndex = 0;

    function ensureLightbox() {
      let overlay = document.querySelector(".lightbox-overlay");
      if (overlay) return overlay;

      overlay = document.createElement("div");
      overlay.className = "lightbox-overlay";
      overlay.innerHTML = `
        <div class="lightbox-backdrop"></div>
        <div class="lightbox-content" role="dialog" aria-modal="true">
          <button class="lightbox-prev" aria-label="Previous image">&#10094;</button>
          <button class="lightbox-next" aria-label="Next image">&#10095;</button>
          <div class="lightbox-image-wrapper">
            <img class="lightbox-image" alt="" />
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      return overlay;
    }

    function openLightbox(index) {
      const overlay = ensureLightbox();
      const imgEl = overlay.querySelector(".lightbox-image");
      currentIndex = (index + imagePaths.length) % imagePaths.length;
      imgEl.src = imagePaths[currentIndex];
      overlay.classList.add("is-open");
      document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
      const overlay = document.querySelector(".lightbox-overlay");
      if (!overlay) return;
      overlay.classList.remove("is-open");
      document.body.style.overflow = "";
    }

    function showNext(delta) {
      openLightbox(currentIndex + delta);
    }

    // Delegate clicks from thumbs
    root.addEventListener("click", (e) => {
      const anchor = e.target.closest("a");
      if (!anchor || !root.contains(anchor)) return;
      e.preventDefault();
      const index = parseInt(anchor.getAttribute("data-index") || "0", 10);
      openLightbox(index);
    });

    // Global handlers (created once)
    document.addEventListener("click", (e) => {
      const overlay = document.querySelector(".lightbox-overlay");
      if (!overlay || !overlay.classList.contains("is-open")) return;

      if (e.target.matches(".lightbox-backdrop")) {
        closeLightbox();
      } else if (e.target.matches(".lightbox-next") || e.target.closest(".lightbox-next")) {
        showNext(1);
      } else if (e.target.matches(".lightbox-prev") || e.target.closest(".lightbox-prev")) {
        showNext(-1);
      }
    });

    document.addEventListener("keydown", (e) => {
      const overlay = document.querySelector(".lightbox-overlay");
      if (!overlay || !overlay.classList.contains("is-open")) return;

      if (e.key === "Escape") {
        closeLightbox();
      } else if (e.key === "ArrowRight") {
        showNext(1);
      } else if (e.key === "ArrowLeft") {
        showNext(-1);
      }
    });
  };
})();

