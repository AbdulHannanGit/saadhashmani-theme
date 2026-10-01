# Saad Hashmani — WordPress Theme

Dark cinematic venture portfolio with scroll-driven video, carousels, and interactive animations. A single-page theme built for personal branding, featuring seven fixed-position sections driven by [Lenis](https://lenis.darkroom.engineering/) smooth scroll.

**Current version:** 2.2.0 (`SH_VERSION` in `functions.php`, used for asset cache-busting)

## Requirements

- WordPress 6.0+
- PHP 7.4+
- [LiteSpeed Cache](https://wordpress.org/plugins/litespeed-cache/) (recommended for production caching)
- Optional: [Fluent Forms](https://wordpress.org/plugins/fluentform/) to receive contact submissions as form entries (see [Contact Form](#contact-form))
- Optional: a Google reCAPTCHA v3 key pair for spam protection

## Installation

1. Download or clone this repository into `wp-content/themes/`:
   ```bash
   cd wp-content/themes
   git clone https://github.com/AbdulHannanGit/saadhashmani-theme.git
   ```
2. Activate the theme in **Appearance > Themes**.
3. The theme renders `front-page.php` for the site front page (works with either "Your latest posts" or a static front page under **Settings > Reading**).
4. Upload all media (images, videos, fonts) via the WordPress Media Library, or use the [Demo Media Importer](#demo-media-import).
5. Configure the theme in **Saad Hashmani** (admin sidebar menu, requires the `manage_options` capability).

> **Note:** The theme ships with no bundled media. All images, videos and local fonts are managed through the WordPress Media Library and referenced by attachment ID in the theme settings. The theme enables `.mp4` and `.webm` uploads.

## Theme Settings

All settings live in a single WordPress option, `sh_settings`. Defaults are defined in `inc/defaults.php`; saved values are merged over the defaults, so any field never saved falls back to its default. The admin page (**Saad Hashmani** in the sidebar) has four tabs, and every field has an ⓘ tooltip explaining it.

### 1. Theme Options

| Setting | Key | Default | Description |
|---------|-----|---------|-------------|
| Logo | `options.logo` | — | Site logo used in the header, menu and footer (WebP/PNG, transparent, min 200px height) |
| Custom Cursor | `options.custom_cursor` | On | Lens cursor with scramble text. Only activates on mouse (fine-pointer) devices wider than 768px with reduced motion off |
| Preloader | `options.preloader` | On | Loading screen with name scramble animation. When off, the page loads directly |
| Preloader Assets | `options.preloader_assets.*` | All on | What the preloader waits for: `logo`, `video` (background video — heaviest), `poster`, `gallery` (first venture gallery thumbs) |
| Animations | `options.animations` | On | Master toggle for scroll animations and transitions |
| Video Quality (Desktop) | `options.video_quality` | `720p` | Default background video quality on desktop (`480p` / `720p` / `1080p`) |
| Video Quality (Mobile) | `options.mobile_video_quality` | `480p` | Video quality on screens under 768px (saves bandwidth) |
| Colors (9) | `options.colors.*` | Dark palette | `bg`, `bg_raised`, `bg_inset`, `tx`, `tx_muted`, `tx_faint`, `glow`, `line`, `line_strong` (hex or `rgba()`) |
| Grotesk / Fontshare URL | `options.fonts.grotesk_url` | Cabinet Grotesk + General Sans | Fontshare stylesheet. Skipped when a local heading font is uploaded |
| Google Fonts URL | `options.fonts.google_url` | Anton, Space Grotesk, JetBrains Mono | Google Fonts stylesheet |
| Local Heading Font | `options.fonts.local_heading` | — | `.woff2` from the Media Library; overrides Fontshare for **Cabinet Grotesk** |
| Local Body Font | `options.fonts.local_body` | — | `.woff2` from the Media Library; registered as **General Sans** |
| Demo Media Importer | `options.demo_media_url` | Demo manifest on GitHub | Manifest URL + one-click import (see [Demo Media Import](#demo-media-import)) |

### 2. Sections (7 sub-tabs)

| Sub-tab | Fields |
|---------|--------|
| **Hero** | Eyebrow, first name, last name, preloader ring text, scroll ring text, gate message, poster image, background video at 480p / 720p / 1080p (Media Library upload **or** external URL) |
| **The Record** | Eyebrow, heading, 4 stats (value + label), 8 timeline milestones (year, title, tag, image, description) |
| **Ventures** | 4 ventures, each with: logo, eyebrow, title, description, CTA label, CTA URL, 4 stats, image gallery (multi-select), partner logos (multi-select). A CTA URL of `#` scrolls to the Contact section instead of opening an external link |
| **The Playbook** | Eyebrow, heading, 45 principles. Each principle has a title, description, open/locked toggle, 9:16 thumbnail, and optional Instagram Reel ID for the video popup (24 are open with reels by default; locked ones show a lock icon) |
| **The Podcast** | Eyebrow, 21 episodes (title, source label, description, YouTube ID, main image, carousel thumbnail ~544×700) |
| **The Receipts** | Eyebrow, heading, per-platform stats (`all`, `google`, `instagram`, `facebook`, `tiktok`, `twitter` — 3 stats each), filter button labels, 12 testimonials (6 left + 6 right column: platform, stars 1–5, text, name, role, avatar, optional YouTube ID for a video review) |
| **Contact** | Eyebrow, heading, description, form type options (the dropdown in the chat form) |

### 3. Contact Details

| Setting | Key | Description |
|---------|-----|-------------|
| Email | `contact.email` | Shown in the menu ("Direct line") and in Schema.org data |
| Location | `contact.location` | Shown in the menu ("Based") and used as Schema.org locality |
| Social links | `contact.social.{x,facebook,instagram,tiktok,linkedin}` | Menu, footer and mobile share popup; empty links are hidden. Also used for Schema.org `sameAs` and `twitter:site` |
| Form Plugin | `contact.form_plugin` | `Use built-in chat form` (default), `Fluent Forms`, or `Contact Form 7` |
| Form | `contact.cf7_form_id` | Form to mirror submissions into (the list fills after selecting a plugin and saving) |
| reCAPTCHA Site Key | `contact.recaptcha_site` | reCAPTCHA v3 site key. Leave blank to disable |
| reCAPTCHA Secret Key | `contact.recaptcha_secret` | reCAPTCHA v3 secret. Never sent to the frontend |

### 4. Master JSON Editor

View, edit, download, or upload the entire `sh_settings` object as JSON. Saving this tab **replaces** the whole option, so it is also the way to back up or migrate settings between sites. Settings without a UI field (below) can only be edited here.

### Settings without a UI field

| Key | Description |
|-----|-------------|
| `collage.images` | Array of attachment IDs for the hero collage — columns of small tiles drifting upward behind the hero, masked around the name. Empty by default, which leaves the collage blank. (`collage.count` and `collage.prefix` are legacy values not used by the WordPress build) |

## Website Functionality

The front page is one continuous scroll experience with seven sections. Visitors navigate with the mouse wheel / trackpad, touch, the round scroll arrow, the menu, or the keyboard.

### Global
- **Preloader** — Plays the hero video behind a veil, scrambles the name, and waits for the selected preloader assets before revealing the page.
- **Header** — Logo, "Connect with {first name}" button (scrolls to Contact) and menu toggle; shown or hidden depending on scroll position.
- **Full-screen menu** — Numbered links to all 7 sections, logo, email, location, social links and a contact CTA. `Esc` closes it.
- **Scroll arrow** — Rotating ring-text button: "Scroll to unlock" on the hero, "next section" in between, "scroll to top" on the last section.
- **Background video** — One merged video is time-sliced: each section has a looping segment and each section change plays a transition segment, with canvas crossfades between them. Quality is chosen from the `?quality=` URL parameter, then the visitor's last choice (`localStorage` key `sh_vq`), then the desktop/mobile default.
- **Custom cursor** — Lens + dot that changes shape and label over interactive elements (desktop only).
- **Keyboard** — `↓` / `PageDown` / `Space` next section, `↑` / `PageUp` previous, `Home` first section, `End` last section (ignored while typing). In the gallery lightbox, `←` / `→` browse and `Esc` closes.
- **Reduced motion** — Respects `prefers-reduced-motion`: stops collage and ring animations, removes video crossfade transitions, and disables the custom cursor.
- **Mobile (≤768px)** — `css/mobile.css` provides the responsive layout (stacked content, hidden watermark numbers, image-on-top timeline modal, share-button social popup in the footer).
- **Gate overlay** — The `hero.gate_message` overlay with a "Continue Anyway" button exists in the markup, and dismissal is remembered per browser session (`sessionStorage` key `sh_gate_dismissed`). It ships hidden and nothing in the current CSS/JS reveals it, so it is currently dormant.

### Sections
1. **Hero** — Eyebrow, large first/last name (`<h1>`), optional collage, scroll-to-unlock arrow.
2. **The Record** — Heading, 4 headline stats, and a draggable horizontal timeline. Clicking a milestone opens a modal with image, year, title, description, tag and a contact CTA.
3. **Ventures** — 4-slide carousel with prev/next and numbered dots. Each slide shows logo, title, stats, description, CTA, a gallery strip (click opens a lightbox) and a partner-logo marquee that pauses on hover.
4. **The Playbook** — Draggable cluster of principle topics. Hovering shows a reel preview; selecting a principle opens a card with the 9:16 cover and an embedded Instagram Reel. Locked principles show a lock. An expand button opens the full view.
5. **The Podcast** — 3D rotating ring of episode cards with prev / play / next controls, progress bar and playback-speed toggle. Play opens a lightbox with the YouTube embed.
6. **The Receipts** — Two auto-scrolling, draggable testimonial columns with platform filter buttons (G / IG / f / TT / X) that also switch the stats row. Video testimonials open a YouTube lightbox.
7. **Contact** — Chat-style form (see below) and a footer with logo and social links.

## Contact Form

The **built-in chat form is always shown** in the Contact section. It asks for name, email and message one step at a time, with a type dropdown (from **Sections > Contact > Form Types**) and an attach button for an image or PDF.

On submit, the browser POSTs to `admin-ajax.php` (`action=sh_contact`, nonce-protected). The server:

1. Validates name, email and message (all required).
2. If a reCAPTCHA secret is set, verifies the v3 token and rejects scores below `0.5`.
3. Stores the submission in the `{prefix}sh_submissions` table (created automatically on first submission): date, time, type, name, email, message.
4. Then, depending on **Contact Details > Form Plugin**:
   - **Fluent Forms** (plugin active and a form selected) — inserts the submission as a Fluent Forms entry (`names`, `email`, `message`, `inquiry_type` fields) and fires `fluentform/submission_inserted` so Fluent Forms notifications and integrations run.
   - **Built-in** or **Contact Form 7** — emails the site admin (`admin_email`) via `wp_mail()`.

The browser also keeps a CSV copy of the visitor's own submissions in `localStorage` (`form.csv`).

**Known limitations**
- The Contact Form 7 option only lists CF7 forms; submissions are not written into CF7 (it behaves like the built-in email option).
- Attachments are sent with the request but are not saved by the server handler.

## File Structure

```
saadhashmani-theme/
├── style.css              # Theme header + design tokens + shared component styles
├── functions.php          # Setup, image sizes, enqueue, contact AJAX, demo import AJAX, WP cleanup
├── header.php             # DOCTYPE, <head>, font preconnects, wp_head()
├── footer.php             # wp_footer(), closing tags
├── front-page.php         # Single-page template (all 7 sections, modals, lightboxes, cursor)
├── index.php              # Fallback template
├── screenshot.png         # Theme screenshot shown in Appearance > Themes
├── css/
│   ├── mobile.css         # Responsive overrides (max-width: 768px)
│   └── admin.css          # Settings page styles
├── js/
│   ├── app.js             # Main app (scroll engine, video, carousels, animations, chat form)
│   └── admin.js           # Settings page (media uploaders, repeaters, JSON editor, demo importer)
├── inc/
│   ├── defaults.php       # Master settings schema with all default values
│   ├── helpers.php        # sh_get(), sh_img(), sh_vid(), sh_resolve_*() functions
│   ├── seo.php            # Meta description, canonical, Open Graph, Twitter Cards, Schema.org JSON-LD
│   ├── theme-settings.php # Admin menu page, save handler, tab router
│   ├── tab-options.php    # Theme Options tab
│   ├── tab-sections.php   # Sections tab (7 sub-tabs with repeaters)
│   ├── tab-contact.php    # Contact Details tab
│   └── tab-json.php       # Master JSON Editor tab
├── assets/
│   └── .gitkeep           # Empty — media served from WP uploads
└── .gitattributes         # Git LFS tracking for *.mp4
```

## Architecture

### Scroll-Driven Sections
The site is a single fixed-position overlay architecture. Seven sections (the hero plus `data-sec2` through `data-sec7`) are stacked at `position: fixed` and revealed/hidden via opacity as the user scrolls through a `1090vh` spacer div. Lenis provides smooth scroll, and a merged background video plays time-sliced segments per section with canvas crossfade transitions.

### Data Flow
```
sh_defaults()          →  Default settings (inc/defaults.php)
       ↓
get_option('sh_settings')  →  Saved overrides (wp_options table)
       ↓
sh_get('dot.path')     →  Merged value (static-cached per request)
       ↓
sh_resolve_*()         →  Attachment IDs → URLs at correct sizes
       ↓
wp_localize_script()   →  window.shTheme (injected into JS; reCAPTCHA secret excluded)
       ↓
front-page.php         →  PHP renders server-side HTML
app.js                 →  JS reads shTheme for client-side behavior
```

### Scripts & Styles
| Handle | Source | Notes |
|--------|--------|-------|
| `sh-fontshare` | Fontshare URL | Only when no local heading font is set |
| `sh-google-fonts` | Google Fonts URL | |
| `sh-local-fonts` | Inline `@font-face` | Only when local fonts are uploaded |
| `sh-style` | `style.css` | |
| `sh-mobile` | `css/mobile.css` | `media="(max-width:768px)"` |
| `lenis` | jsDelivr `lenis@1.1.18` | Footer |
| `google-recaptcha` | Google reCAPTCHA v3 | Only when a site key is set |
| `sh-app` | `js/app.js` | Footer, depends on `lenis` |

### Custom Image Sizes
| Name | Dimensions | Usage |
|------|-----------|-------|
| `sh-card` | 400 x 400 | Gallery thumbs, collage, avatars |
| `sh-timeline` | 512 x 640 | Timeline milestone images |
| `sh-podcast` | 544 x 700 | Podcast episode images and thumbnails |
| `sh-reel` | 360 x 640 | Playbook reel covers (9:16) |

Regenerate thumbnails (e.g. with the Regenerate Thumbnails plugin) for media uploaded before the theme was activated.

### SEO
- Semantic HTML: `<main>` wrapper, `<h1>` on hero name only, `role="region"` on sections
- Meta description and canonical URL on the front page
- Open Graph and Twitter Card meta tags (image = hero poster, falling back to the logo)
- Schema.org `Person` JSON-LD with name, job title (hero eyebrow), image, email, locality and `sameAs` social links
- Removed from `<head>`: emoji scripts, WP generator, WLW manifest, RSD link

### Performance
- Non-hero images use `loading="lazy"`
- Preloader prefetches only the assets selected in Preloader Assets
- Separate desktop / mobile video quality
- Custom image sizes serve appropriately scaled thumbnails
- Font preconnects for Fontshare / Google Fonts; local WOFF2 option with `font-display: swap`
- Compatible with LiteSpeed Cache for full-page caching
- No bundled media — zero bloat in the theme package

## Fonts

| Family | Role | Source |
|--------|------|--------|
| Cabinet Grotesk | Headings, hero name | Fontshare or local WOFF2 |
| General Sans | Body text | Fontshare or local WOFF2 |
| JetBrains Mono | Eyebrows, labels, buttons | Google Fonts |
| Space Grotesk | Heading fallback | Google Fonts |
| Anton | Alternate heavy hero font | Google Fonts |

## Demo Media Import

The theme ships with no bundled media. To set up a fresh install with demo content, use the **Demo Media Importer** in Theme Options.

### Setup

1. Create a separate GitHub repository (e.g. `saadhashmani-demo-media`) — this keeps media out of the theme repo.
2. Add all demo images and videos to the repo, organized in folders.
3. Create a `manifest.json` at the repo root with this format:

```json
{
  "base_url": "https://raw.githubusercontent.com/AbdulHannanGit/saadhashmani-demo-media/main/",
  "files": [
    { "key": "logo",       "path": "images/logo.webp",          "title": "Site Logo" },
    { "key": "poster",     "path": "images/poster.webp",        "title": "Video Poster" },
    { "key": "video_480",  "path": "video/full-video-480p.mp4", "title": "Video 480p" },
    { "key": "video_720",  "path": "video/full-video-720p.mp4", "title": "Video 720p" },
    { "key": "video_1080", "path": "video/full-video-1080p.mp4","title": "Video 1080p" },
    { "key": "tl_0",       "path": "images/timeline-1.webp",    "title": "Timeline 2014" },
    { "key": "v0_logo",    "path": "images/tp-logo.png",        "title": "Trading Papa Logo" },
    { "key": "v0_g0",      "path": "images/tp-gallery-1.webp",  "title": "TP Gallery 1" }
  ],
  "settings_map": {
    "options.logo": "logo",
    "hero.poster": "poster",
    "hero.video_480": "video_480",
    "hero.video_720": "video_720",
    "hero.video_1080": "video_1080",
    "record.timeline.0.img": "tl_0",
    "ventures.0.logo": "v0_logo",
    "ventures.0.gallery.0": "v0_g0"
  }
}
```

**How it works:**
- `files` lists every media file with a unique `key`, its `path` relative to `base_url`, and an optional `title`.
- `settings_map` maps dot-path theme setting keys to file keys. After import, each setting stores the WordPress attachment ID of the imported file.
- Files are imported in batches (`sh_demo_import_batch`), each downloaded and added to the Media Library via `media_handle_sideload`. Files whose name already exists in the Media Library are reused instead of re-downloaded, so the import can be re-run safely.
- After all batches finish, `sh_demo_apply_map` writes the attachment IDs into `sh_settings`.
- **Warning:** This replaces all current media references in theme settings.

### Using the Importer

1. Go to **Saad Hashmani > Theme Options**.
2. Paste the manifest URL (or use the default).
3. Click **Import Demo Media**.
4. Watch the log for progress. Reload the page when done.

## License

All Rights Reserved. This theme is proprietary to Saad Hashmani.
