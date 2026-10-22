# Percentage Calculator

A static percentage calculator website with ad placements, ready to host on Cloudflare. Plain HTML, CSS and JavaScript — no build step.

Six calculators on one page: X% of Y, X is what % of Y, percent change, add or remove a percentage, discounts, and finding the original number. Each shows the formula it used.

## Files

```
public/                 ← everything that gets deployed
  index.html            calculator + guide + FAQ
  about.html, contact.html, privacy.html, terms.html, 404.html
  css/style.css
  js/ads-config.js      ← edit this to turn ads on
  js/ads.js             renders the ad slots (no need to edit)
  js/calculator.js
  ads.txt, robots.txt, sitemap.xml, _headers, favicon.svg
wrangler.jsonc          Cloudflare deploy settings
```

## Preview locally

```sh
cd public && python3 -m http.server 8080
```

Open http://localhost:8080. Until you add your AdSense ID, every ad spot shows a labelled grey box with its size.

## Before you go live

1. **Domain.** Replace `https://example.com` with your domain in `public/index.html`, the other `.html` pages, `public/robots.txt` and `public/sitemap.xml`.
2. **Contact email.** Replace `hello@example.com` in `contact.html`, `privacy.html` and `terms.html`.
3. **Publisher ID.** Put your `ca-pub-…` ID in `public/js/ads-config.js`, and the same ID (as `pub-…`) in `public/ads.txt`.
4. **Ad units.** In AdSense, create a display ad unit for each slot and paste its slot number into `ads-config.js`. A slot with no number is hidden once ads are live.
5. **Consent.** AdSense requires a consent message for visitors in the EEA, UK and Switzerland. Turn it on in AdSense under **Privacy & messaging**.

## Ad placements

| Placement | Size | Where |
|---|---|---|
| Top banner | 728×90 (320×100 on phones) | Below the header, every page |
| Vertical banners | 160×600 left, 300×600 right | Side rails, sticky; left one only on wide screens, both hidden on phones |
| Tile ads | 4 × 300×250 | Two rows in the article; one tile per row on phones |
| Bottom banner | 728×90 (320×100 on phones) | Above the footer |
| Video ad | 320×180 | Floating, bottom right, closable; on phones waits until you scroll past the calculator |
| Full-screen ad | 640×480 (336×280 on phones) | Once per visit, after 3 calculations or 30 seconds; closes immediately, with Esc, or by clicking outside |

### Important: the video and full-screen spots

AdSense **doesn't allow** its ad units inside floating boxes or custom pop-ups, and doing so can get your account suspended. So these two spots are built for:

- **ads you sell directly** — set `mode: "direct"` and point to your sponsor's video or image, or
- **another ad network's tag** (for example an outstream video network) — set `mode: "html"` and paste the tag.

To get Google's own full-screen and sticky ads, turn on **Auto ads → Vignette ads** and **Anchor ads** in your AdSense account. Google places those itself; no code changes are needed.

The full-screen spot never makes people wait for a countdown. Countdown pop-ups break the Better Ads Standards, and Chrome blocks every ad on sites that use them.

### On the number of ads

AdSense reviewers reject sites where ads outweigh the content. If approval is slow, switch off a few tiles (`enabled: false`) until you're approved, then turn them back on.

## Deploy to Cloudflare

**From the dashboard (easiest):** Workers & Pages → Create → connect this GitHub repository. Leave the build command empty and set the output/assets directory to `public`. Every push redeploys.

**From the command line:**

```sh
npx wrangler login
npx wrangler deploy
```

`wrangler.jsonc` serves the `public/` folder and shows `404.html` for missing pages. `public/_headers` sets security headers and short cache times so changes to `ads-config.js` reach visitors within minutes.
