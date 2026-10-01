# Saad Hashmani — WordPress Theme

Dark cinematic one-page portfolio. Seven sections sit on top of one looping background video; the visitor steps through them one at a time (scroll, swipe, keyboard, menu or the round scroll button) and each step plays a video transition. Includes a ventures carousel, a playbook wheel, a 3D podcast ring, testimonial columns and a chat-style contact form, with an optional GSAP motion layer.

**Version 3.0.0** — the new UI from the design build (`saadhashmani-theme-clone`), converted to WordPress with every word and image editable in the admin.

## Requirements

- WordPress 6.3+ (deferred script loading), PHP 7.4+
- Optional: [LiteSpeed Cache](https://wordpress.org/plugins/litespeed-cache/) or any full-page cache (the theme is cache-safe, see [Performance](#performance))
- Optional: [Fluent Forms](https://wordpress.org/plugins/fluentform/) to receive contact submissions as entries
- Optional: a Google reCAPTCHA v3 key pair

## Installation

1. Copy or clone the theme into `wp-content/themes/` and activate it in **Appearance > Themes**.
2. Go to **Saad Hashmani > Theme Options > Demo Media Importer** and click **Import Demo Media**. It downloads the demo images and videos from the [demo media repo](https://github.com/AbdulHannanGit/saadhashmani-demo-media) and fills every media field. Files already in the Media Library are reused.
3. Edit content in **Saad Hashmani > Sections** and **Contact Details**.

The theme ships no media: everything lives in the Media Library and settings store attachment IDs.

### Upgrading from 2.x

Settings are migrated automatically the first time WordPress loads the new version (a copy of the old settings is kept in the `sh_settings_backup_v2` option):

- Your own text, colours and media stay. Values still equal to the old defaults switch to the new ones (Zodiak font, warm text colours, new headings).
- The old background video is cleared: the new design uses a different clip layout. Run the Demo Media Importer (or upload your own export) to set the new one.
- Playbook items with a Reel ID become **Reels**; the text-only principles are replaced by the new list.
- Partner logos move from the first venture to the shared **Partners** list.
- Video testimonials get a separate cover image (copied from the avatar).

## Theme settings

All settings live in the `sh_settings` option. Defaults are in `inc/defaults.php`; saved values are merged over them (groups merge key by key, lists such as repeaters are replaced as saved, so a deleted row stays deleted). Every field in the admin has an ⓘ tooltip.

### Theme Options

| Setting | Default | What it does |
|---|---|---|
| Logo | demo logo | Header, menu and footer logo |
| **GSAP motion on desktop** | On | Section arrival animations: eyebrows dial in, the hero name rises letter by letter, numbers count up, the Ventures and Podcast titles wipe open, the Playbook heading comes into focus, the contact form opens from its centre. Screens wider than 768px |
| **GSAP motion on mobile** | Off | The same on screens 768px and narrower |
| Animations | On | Master switch. Off behaves like a visitor who asked for reduced motion: no video transitions, no cursor, plain fades |
| Custom cursor | On | Lens cursor on mouse devices wider than 768px |
| Preloader | On | Intro with the name scramble. Choose what it waits for: logo, hero still, background video, first gallery thumbnails |
| Video quality (desktop / mobile) | 720p / 480p | Which background video file is loaded |
| Menu labels | Home … Contact | The seven menu entries |
| Colours (9) | warm dark palette | `bg`, `bg_raised`, `bg_inset`, `tx`, `tx_muted`, `tx_faint`, `glow`, `line`, `line_strong`; output as CSS variables |
| Fontshare stylesheet URL | Zodiak + General Sans | Skipped when both self-hosted fonts are set |
| Extra stylesheet URL | empty | Any additional font stylesheet |
| Self-hosted heading / body font | — | WOFF2 files from the Media Library, registered as Zodiak / General Sans |
| SEO: title, meta description, share image | from the design | Front page `<title>`, description, Open Graph/Twitter image |
| Demo Media Importer | demo manifest | See [Demo media](#demo-media) |

GSAP is never enqueued by PHP: `app.js` downloads it only when it is switched on for the visitor's device, so a cached page works for both phones and desktops. Visitors (or you, when testing) can force it with `?gsap=1` / `?gsap=0`.

### Sections

| Sub-tab | Fields |
|---|---|
| **Hero** | Eyebrow, first/last name, preloader ring text, scroll ring text, hero still, background video 480p/720p/1080p (Media Library or external URL), clip lengths |
| **The Record** | Eyebrow, heading, stats, timeline milestones (years, title, tag, portrait image, story shown in the popup) |
| **Ventures** | Per venture: logo, eyebrow, title, description, button label + link (`#` scrolls to Contact), 4 stats, gallery. Shared **Partners** logo list with per-logo height |
| **The Playbook** | Eyebrow, heading, **Reels** (title, 9:16 cover, Instagram Reel ID), **Principles** (text pool), number of locked topics shown (picked at random per visit) |
| **The Podcast** | Eyebrow, episodes (title, show, one-line description, YouTube ID, 3:4 card, 16:9 player poster) |
| **The Receipts** | Eyebrow, heading, three stats per filter (All, Google, Instagram, Facebook, TikTok, X), filter button labels, left and right testimonial columns (platform, stars, quote, name, role, avatar, optional 16:9 photo, optional YouTube ID for a video review) |
| **Contact** | Eyebrow, heading + faint accent, description, enquiry types, default type |

#### Background video and clip lengths

One MP4 holds every clip in order: `s0 t0 s1 t1 … s6 t6` (`s` = a section's loop, `t` = the transition to the next section, `t6` = Contact back to the hero). At rest a section's loop plays and restarts; stepping down plays the transition forward; stepping up cuts straight to the previous loop. The **Clip lengths** field lists the 14 durations in seconds. Change it only when the video is re-exported with different timings. Re-encoding with a short keyframe interval (e.g. `ffmpeg -g 15`) makes loop restarts instant.

### Contact Details

Email, location, social links (X, Facebook, Instagram, TikTok, LinkedIn; empty ones are hidden), where submissions go (email to the site admin, or Fluent Forms entries), reCAPTCHA v3 keys.

### Master JSON

View, download, load or paste the whole settings object. Saving replaces everything (values are sanitised against the schema).

## How the site works

- **Navigation**: wheel/trackpad, swipe, `↓ PageDown Space` / `↑ PageUp`, `Home` / `End`, the menu, or the scroll button. Past Contact, the button spins and returns to the hero. `Esc` closes the menu and lightboxes.
- **Hero**: name, eyebrow and scroll ring over the video.
- **The Record**: stats and a draggable timeline; a milestone opens a popup with photo and story.
- **Ventures**: four slides with prev/next and numbered dots (swipe on phones), gallery strip with a lightbox, partner marquee.
- **The Playbook**: a wheel of topics. Reels open an Instagram embed; locked topics show a lock. On phones only touches inside the wheel turn it.
- **The Podcast**: 3D ring of episodes, prev/play/next, progress bar, speed toggle, YouTube lightbox.
- **The Receipts**: two auto-scrolling, draggable testimonial columns (merged into one row on phones), platform filters that also switch the stats.
- **Contact**: chat-style form (name → email → message), enquiry type, optional image/PDF attachment, footer with social links.
- **URL options**: `?quality=480|720|1080`, `?preloader=0`, `?gsap=1|0`, `?cursor=1`.

## Contact form

Submissions post to `admin-ajax.php` (`action=sh_contact`) and are:

1. validated (name, valid email, message) and, if keys are set, checked with reCAPTCHA v3 (score ≥ 0.5);
2. stored in `{prefix}sh_submissions` (date, time, type, name, email, message, attachment URL);
3. emailed to the site admin (Reply-To set to the sender) or added to the chosen Fluent Forms form.

Attachments (images, PDF, Office documents, text; max 10 MB) go through WordPress's upload checks into `uploads/sh-submissions/` with randomised names, an `index.php` and an `.htaccess` that blocks script execution. The nonce is checked for logged-in users only: logged-out nonces are shared by every visitor and expire inside cached pages, which would silently drop messages.

## SEO

- One `<h1>` (the name), a heading per section, `<main>`, `<header>`, `<nav>`, `<section>`/`<article>`/`<footer>` landmarks, `aria-labelledby` on sections.
- All content is server-rendered; Playbook topics, built by JavaScript for the wheel, are also printed in a visually hidden list.
- Every image has `alt` text (names, titles; imported media get alt text from the manifest).
- `<title>`, meta description, canonical, Open Graph and Twitter tags, `theme-color`.
- JSON-LD `Person` (job title, image, email, locality, social `sameAs`, ventures as `founder` of `Organization`s) and `WebSite`.
- The theme's tags switch off automatically when Yoast, Rank Math, AIOSEO, SEOPress or The SEO Framework is active.

## Performance

- No React/Babel runtime, design-system bundle or Lenis: the page engine is a single deferred script (`js/app.min.js`, 90 KB, 25 KB gzipped). Readable sources are served when `SCRIPT_DEBUG` is on.
- GSAP (self-hosted in `js/vendor/`, ~91 KB) is downloaded only when enabled for the device.
- Block-library CSS and global styles are not loaded on the front page; emoji, oEmbed, REST and shortlink head tags are removed.
- Hero still preloaded with high priority; fonts preconnected (or self-hosted); everything below the hero lazy-loaded with `decoding="async"`.
- Cropped image sizes: `sh-card` 400×400, `sh-timeline` 512×640, `sh-podcast` 544×700, `sh-reel` 360×640. Run "Regenerate Thumbnails" for media uploaded before activating the theme.
- Phone-specific CSS (`css/mobile.css`) is only applied at ≤768px; 480p video on phones by default.
- No server-side device detection, so full-page caching is safe.

## File structure

```
saadhashmani-theme/
├── style.css               Theme header, design tokens, shared styles
├── functions.php           Bootstrap (loads inc/)
├── header.php / footer.php Document shell
├── front-page.php          One-page layout: renders template-parts/ in order
├── index.php               Fallback for posts, archives, 404
├── template-parts/
│   ├── site-header.php     Background stage, header, full-screen menu
│   ├── hero.php            Hero title, scroll ring, preloader
│   ├── section-journey.php The Record (stats, timeline, milestone popup)
│   ├── section-ventures.php
│   ├── section-playbook.php
│   ├── section-podcast.php
│   ├── section-receipts.php
│   ├── testimonial-card.php
│   ├── section-contact.php Chat form and footer
│   └── overlays.php        Cursor, gallery lightbox
├── inc/
│   ├── defaults.php        Settings schema and default content
│   ├── helpers.php         sh_get(), media helpers, template + JS data
│   ├── migrate.php         2.x → 3.x settings migration
│   ├── setup.php           Theme supports, image sizes, head cleanup
│   ├── enqueue.php         Styles, fonts, colours, app script
│   ├── seo.php             Meta tags and JSON-LD
│   ├── contact.php         Contact form handler
│   ├── demo-import.php     Demo media importer
│   ├── theme-settings.php  Admin page and save handler
│   ├── admin-fields.php    Admin field renderers
│   └── tab-*.php           Admin tabs
├── css/  mobile.css, admin.css
└── js/   app.js (+ .min), gsap-motion.js (+ .min), admin.js (+ .min), vendor/ (GSAP 3.13)
```

The markup in `template-parts/` keeps the design build's inline styles exactly (in `property: value;` form): `css/mobile.css` and `js/gsap-motion.js` select elements by that style text, so edit those strings with care.

## Demo media

The importer reads `manifest.json` from the [demo media repo](https://github.com/AbdulHannanGit/saadhashmani-demo-media):

```json
{
  "base_url": "https://raw.githubusercontent.com/AbdulHannanGit/saadhashmani-demo-media/main/",
  "files": [{ "key": "images-logo", "path": "images/logo.webp", "title": "Saad Hashmani logo", "alt": "Saad Hashmani", "sha1": "…", "bytes": 102713 }],
  "settings_map": { "options.logo": "images-logo" }
}
```

- Files are processed in small batches. A file is **skipped** when the Media Library already has it: first by the source path recorded on a previous import, then by SHA-1 of the file contents, which also catches media uploaded by hand or by the 2.x importer, without confusing different files that share a name.
- Downloads are checked against `sha1`; Git LFS pointer files are rejected (keep demo media out of LFS).
- `settings_map` then points each media setting at its attachment. Text settings are not touched.

## License

All Rights Reserved. This theme is proprietary to Saad Hashmani. GSAP is included under the GreenSock [Standard "No Charge" License](https://gsap.com/standard-license).
