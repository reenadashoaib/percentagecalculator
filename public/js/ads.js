/*
 * Renders every [data-ad] placement from AD_CONFIG, plus the bottom-right
 * video ad and the full-screen interstitial. Nothing in here needs editing.
 */
(function () {
  "use strict";

  var cfg = window.AD_CONFIG || { slots: {} };
  var live = /^ca-pub-\d{10,}$/.test(cfg.publisherId || "");

  function storageGet(key) {
    try {
      return window.sessionStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch (e) {
      /* private mode: frequency cap falls back to this page view */
    }
  }

  function placeholder(name, size) {
    var div = document.createElement("div");
    div.className = "ad-placeholder";
    div.innerHTML = "<strong></strong><span></span>";
    div.firstChild.textContent = name;
    div.lastChild.textContent = size || "";
    return div;
  }

  if (live) {
    var script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src =
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" +
      encodeURIComponent(cfg.publisherId);
    document.head.appendChild(script);
  }

  // ---------- Inline display slots ----------

  document.querySelectorAll("[data-ad]").forEach(function (el) {
    var key = el.getAttribute("data-ad");
    var slot = cfg.slots[key];
    var box = el.querySelector(".ad-box");

    if (!slot || slot.enabled === false || (live && !slot.slot)) {
      el.remove();
      return;
    }

    if (!live) {
      box.appendChild(placeholder(el.getAttribute("data-ad-name") || key, slot.size));
      return;
    }

    var ins = document.createElement("ins");
    ins.className = "adsbygoogle";
    ins.setAttribute("data-ad-client", cfg.publisherId);
    ins.setAttribute("data-ad-slot", slot.slot);
    box.appendChild(ins);
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  });

  // ---------- Direct-sold creative helpers ----------

  function linkWrap(child, url) {
    if (!url) return child;
    var a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "sponsored noopener";
    a.appendChild(child);
    return a;
  }

  function fillHtml(box, html) {
    // Scripts inserted with innerHTML don't run, so recreate them.
    box.innerHTML = html;
    box.querySelectorAll("script").forEach(function (old) {
      var s = document.createElement("script");
      Array.prototype.forEach.call(old.attributes, function (attr) {
        s.setAttribute(attr.name, attr.value);
      });
      s.text = old.text;
      old.replaceWith(s);
    });
  }

  function resolveMode(mode) {
    if (mode === "placeholder") return live ? "off" : "placeholder";
    return mode || "off";
  }

  // ---------- Bottom-right video ad ----------

  (function () {
    var v = cfg.video || {};
    var mode = resolveMode(v.mode);
    var el = document.getElementById("ad-video");
    if (!el) return;
    if (mode === "off" || storageGet("ad-video-closed")) {
      el.remove();
      return;
    }

    var box = el.querySelector(".ad-box");
    if (mode === "placeholder") {
      box.appendChild(placeholder("Video ad", "320 × 180"));
    } else if (mode === "direct" && v.src) {
      var video = document.createElement("video");
      video.src = v.src;
      if (v.poster) video.poster = v.poster;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.autoplay = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      video.controls = true;
      box.appendChild(linkWrap(video, v.clickUrl));
    } else if (mode === "html" && v.html) {
      fillHtml(box, v.html);
    } else {
      el.remove();
      return;
    }

    el.hidden = false;
    // On phones the box would cover the calculator, so also wait until
    // the reader has scrolled past it.
    var calc = document.getElementById("calculator");
    var narrow = window.matchMedia("(max-width: 760px)").matches;
    var timeUp = false;
    function reveal() {
      if (!timeUp) return;
      if (narrow && calc && calc.getBoundingClientRect().bottom > 0) return;
      el.classList.add("is-visible");
      window.removeEventListener("scroll", reveal);
    }
    window.addEventListener("scroll", reveal, { passive: true });
    window.setTimeout(function () {
      timeUp = true;
      reveal();
    }, (v.showAfterSeconds || 0) * 1000);

    el.querySelector(".icon-close").addEventListener("click", function () {
      el.classList.remove("is-visible");
      storageSet("ad-video-closed", "1");
      window.setTimeout(function () {
        el.remove();
      }, 400);
    });
  })();

  // ---------- Full-screen interstitial ----------

  (function () {
    var p = cfg.interstitial || {};
    var mode = resolveMode(p.mode);
    var el = document.getElementById("ad-interstitial");
    if (!el) return;
    if (mode === "off" || storageGet("ad-interstitial-shown")) {
      el.remove();
      return;
    }

    var box = el.querySelector(".ad-box");
    if (mode === "placeholder") {
      box.appendChild(placeholder("Full-screen ad", "640 × 480 · 336 × 280 on mobile"));
    } else if (mode === "direct" && p.image) {
      var img = document.createElement("img");
      img.src = p.image;
      img.alt = p.alt || "Advertisement";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "contain";
      box.appendChild(linkWrap(img, p.clickUrl));
    } else if (mode === "html" && p.html) {
      fillHtml(box, p.html);
    } else {
      el.remove();
      return;
    }

    var shown = false;
    var lastFocus = null;
    var skip = el.querySelector(".ad-interstitial-skip");

    function close() {
      el.hidden = true;
      document.removeEventListener("keydown", onKey);
      if (lastFocus) lastFocus.focus();
    }

    function onKey(e) {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        // Keep focus inside the dialog.
        var focusables = el.querySelectorAll("button, a[href], video, iframe");
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    function show() {
      if (shown) return;
      shown = true;
      storageSet("ad-interstitial-shown", "1");
      lastFocus = document.activeElement;
      el.hidden = false;
      skip.focus();
      document.addEventListener("keydown", onKey);
    }

    skip.addEventListener("click", close);
    el.addEventListener("click", function (e) {
      if (e.target === el) close();
    });

    var count = 0;
    document.addEventListener("calc:done", function () {
      count += 1;
      if (count >= (p.afterCalculations || 3)) show();
    });
    if (p.afterSeconds) window.setTimeout(show, p.afterSeconds * 1000);
  })();
})();
