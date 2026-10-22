/*
 * Ad configuration — the only file you need to edit to turn ads on.
 *
 * 1. Replace publisherId with your AdSense publisher ID (ca-pub-...).
 *    Also put the same ID in /ads.txt.
 * 2. In AdSense, create a display ad unit for each slot below and paste
 *    its data-ad-slot number into `slot`.
 * 3. Set `enabled: false` on any placement you don't want.
 *
 * Until publisherId is a real ID, every placement shows a labelled
 * placeholder box so you can see the layout.
 */
window.AD_CONFIG = {
  publisherId: "ca-pub-XXXXXXXXXXXXXXXX",

  // Standard AdSense display units, placed inline in the page.
  slots: {
    "top-banner":    { enabled: true, slot: "", size: "728 × 90 · 320 × 100 on mobile" },
    "left-rail":     { enabled: true, slot: "", size: "160 × 600" },
    "right-rail":    { enabled: true, slot: "", size: "300 × 600" },
    "tile-1":        { enabled: true, slot: "", size: "300 × 250" },
    "tile-2":        { enabled: true, slot: "", size: "300 × 250" },
    "tile-3":        { enabled: true, slot: "", size: "300 × 250" },
    "tile-4":        { enabled: true, slot: "", size: "300 × 250" },
    "bottom-banner": { enabled: true, slot: "", size: "728 × 90 · 320 × 100 on mobile" }
  },

  /*
   * Bottom-right video ad and full-screen popup.
   *
   * AdSense does not allow its ad units inside floating boxes or custom
   * popups, so these two placements are for ads you sell directly or for
   * a video ad network's tag. For Google's own full-screen ads, turn on
   * "Vignette ads" under Auto ads in your AdSense account instead.
   *
   * mode:
   *   "placeholder" – show a sample box (only while publisherId is not set)
   *   "direct"      – show your own creative (video file or image + link)
   *   "html"        – paste a third-party ad tag into `html`
   *   "off"         – hide the placement
   */
  video: {
    mode: "placeholder",
    src: "",          // e.g. "/media/sponsor.mp4" (muted, loops)
    poster: "",       // optional still image
    clickUrl: "",     // where a click goes
    html: "",
    showAfterSeconds: 8
  },

  interstitial: {
    mode: "placeholder",
    image: "",        // e.g. "/media/sponsor-640x480.jpg"
    alt: "",
    clickUrl: "",
    html: "",
    // Shown at most once per visit, after this many calculations or
    // this many seconds on the page, whichever comes first.
    afterCalculations: 3,
    afterSeconds: 30
  }
};
