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

    // Populate with <a><img /></a> items and optional select checkbox
    imagePaths.forEach((src, index) => {
      const $a = jQuery("<a/>", { href: src, "data-index": index, class: "gallery-link" });
      const $img = jQuery("<img/>", {
        src,
        loading: "lazy",
        alt: ""
      });
      const $cb = jQuery("<input/>", {
        type: "checkbox",
        class: "gallery-select-cb",
        "data-index": index,
        "aria-label": "Select image " + (index + 1)
      });
      $a.append($img).append($cb);
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
          <button type="button" class="lightbox-download" aria-label="Download image">Download</button>
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

    function downloadImage(url, filename) {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || url.split("/").pop() || "image.jpg";
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    function downloadCurrentImage() {
      const url = imagePaths[currentIndex];
      if (!url) return;
      const filename = url.split("/").pop() || "image.jpg";
      fetch(url, { mode: "cors" })
        .then((r) => (r.ok ? r.blob() : Promise.reject(new Error("Fetch failed"))))
        .then((blob) => {
          const objUrl = URL.createObjectURL(blob);
          downloadImage(objUrl, filename);
          URL.revokeObjectURL(objUrl);
        })
        .catch(() => {
          downloadImage(url, filename);
        });
    }

    // Select mode state and toolbar
    let selectMode = false;
    const toolbar = document.createElement("div");
    toolbar.className = "gallery-toolbar";
    toolbar.innerHTML = `
      <label class="gallery-toolbar-toggle">
        <input type="checkbox" id="gallery-select-mode" aria-label="Select images" />
        <span>Select images</span>
      </label>
      <button type="button" class="gallery-download-selected" disabled aria-label="Download selected">
        Download selected
      </button>
    `;
    root.parentElement.insertBefore(toolbar, root);

    const selectModeCb = toolbar.querySelector("#gallery-select-mode");
    const downloadSelectedBtn = toolbar.querySelector(".gallery-download-selected");

    function updateDownloadSelectedState() {
      const checked = root.querySelectorAll(".gallery-select-cb:checked");
      downloadSelectedBtn.disabled = checked.length === 0;
      downloadSelectedBtn.textContent = checked.length
        ? "Download selected (" + checked.length + ")"
        : "Download selected";
    }

    selectModeCb.addEventListener("change", () => {
      selectMode = selectModeCb.checked;
      root.classList.toggle("select-mode", selectMode);
      if (!selectMode) {
        root.querySelectorAll(".gallery-select-cb:checked").forEach((cb) => (cb.checked = false));
        updateDownloadSelectedState();
      }
    });

    downloadSelectedBtn.addEventListener("click", () => {
      root.querySelectorAll(".gallery-select-cb:checked").forEach((cb) => {
        const idx = parseInt(cb.getAttribute("data-index") || "0", 10);
        const url = imagePaths[idx];
        if (url) {
          const filename = url.split("/").pop() || "image-" + idx + ".jpg";
          fetch(url, { mode: "cors" })
            .then((r) => (r.ok ? r.blob() : Promise.reject(new Error("Fetch failed"))))
            .then((blob) => {
              const objUrl = URL.createObjectURL(blob);
              downloadImage(objUrl, filename);
              URL.revokeObjectURL(objUrl);
            })
            .catch(() => downloadImage(url, filename));
        }
      });
    });

    root.addEventListener("change", (e) => {
      if (e.target.classList.contains("gallery-select-cb")) updateDownloadSelectedState();
    });

    // Delegate clicks from thumbs: in select mode toggle checkbox, else open lightbox
    root.addEventListener("click", (e) => {
      if (e.target.classList.contains("gallery-select-cb")) {
        e.stopPropagation();
        e.preventDefault();
        updateDownloadSelectedState();
        return;
      }
      const anchor = e.target.closest("a.gallery-link");
      if (!anchor || !root.contains(anchor)) return;
      e.preventDefault();
      if (selectMode) {
        const cb = anchor.querySelector(".gallery-select-cb");
        if (cb) {
          cb.checked = !cb.checked;
          updateDownloadSelectedState();
        }
        return;
      }
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
      } else if (e.target.matches(".lightbox-download") || e.target.closest(".lightbox-download")) {
        downloadCurrentImage();
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

