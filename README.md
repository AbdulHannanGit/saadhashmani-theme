# Saad Hashmani — WordPress Theme

Dark cinematic venture portfolio with scroll-driven video, carousels, and interactive animations. A single-page theme built for personal branding, featuring seven fixed-position sections driven by [Lenis](https://lenis.darkroom.engineering/) smooth scroll.

## Requirements

- WordPress 6.0+
- PHP 7.4+
- [LiteSpeed Cache](https://wordpress.org/plugins/litespeed-cache/) (recommended for production caching)
- [Contact Form 7](https://wordpress.org/plugins/contact-form-7/) (optional — falls back to built-in chat widget)

## Installation

1. Download or clone this repository into `wp-content/themes/`:
   ```bash
   cd wp-content/themes
   git clone https://github.com/AbdulHannanGit/saadhashmani-theme.git
   ```
2. Activate the theme in **Appearance > Themes**.
3. Upload all media (images, videos) via the WordPress Media Library.
4. Configure the theme in **Saad Hashmani** (admin sidebar menu).

> **Note:** The theme ships with no bundled media. All images and videos are managed through the WordPress Media Library and referenced by attachment ID in the theme settings.

## Theme Settings

The admin settings page (**Saad Hashmani** in the sidebar) has four tabs:

### Theme Options
| Setting | Description |
|---------|-------------|
| Logo | Site logo (WebP/PNG, transparent, min 200px height) |
| Custom Cursor | Toggle the lens cursor effect on desktop |
| Animations | Enable/disable scroll-driven animations |
| Video Quality | Default video quality (480p / 720p / 1080p) |
| Colors (9) | `bg`, `bg-raised`, `bg-inset`, `tx`, `tx-muted`, `tx-faint`, `glow`, `line`, `line-strong` |
| Fonts (2) | Fontshare URL (Cabinet Grotesk) and Google Fonts URL |

### Sections (7 sub-tabs)
- **Hero** — Eyebrow, first/last name, preloader text, scroll text, gate message, poster image, 3 video qualities (480p/720p/1080p)
- **The Record** — Eyebrow, heading, 4 stats, 8 timeline milestones (year, title, tag, image, description)
- **Ventures** — 4 ventures, each with: logo, eyebrow, title, description, CTA, 4 stats, image gallery, partner logos
- **The Playbook** — Eyebrow, heading, 45 principles (topic cards), 24 reels (title, cover image, YouTube embed ID)
- **The Podcast** — Eyebrow, 21 episodes (title, source label, description, YouTube ID, cover image, thumbnail)
- **The Receipts** — Eyebrow, heading, per-platform stats, filter labels, 12 testimonials (6 left + 6 right columns)
- **Contact** — Eyebrow, heading, description, form type options

### Contact Details
Social links (X, Facebook, Instagram, TikTok, LinkedIn), email, location, and Contact Form 7 form selector.

### Master JSON Editor
View, edit, download, or upload the entire settings object as JSON. All tabs read and write the same `sh_settings` WordPress option.

## File Structure

```
saadhashmani-theme/
├── style.css              # Theme header + design tokens + component styles
├── functions.php          # Setup, enqueue, AJAX handler, WP cleanup
├── header.php             # DOCTYPE, <head>, wp_head()
├── footer.php             # wp_footer(), closing tags
├── front-page.php         # Single-page template (all 7 sections)
├── index.php              # Fallback template
├── css/
│   ├── mobile.css         # Responsive overrides (max-width: 768px)
│   └── admin.css          # Settings page styles
├── js/
│   ├── app.js             # Main app (scroll engine, video, carousels, animations)
│   └── admin.js           # Settings page (media uploaders, repeaters, JSON editor)
├── inc/
│   ├── defaults.php       # Master settings schema with all default values
│   ├── helpers.php        # sh_get(), sh_img(), sh_vid(), sh_resolve_*() functions
│   ├── seo.php            # Open Graph, Twitter Cards, Schema.org JSON-LD
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
The site is a single fixed-position overlay architecture. Seven sections (`data-sec2` through `data-sec7`) are stacked at `position: fixed` and revealed/hidden via opacity as the user scrolls through a `1090vh` spacer div. Lenis provides smooth scroll, and a merged background video plays time-sliced segments per section with canvas crossfade transitions.

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
wp_localize_script()   →  window.shTheme (injected into JS)
       ↓
front-page.php         →  PHP renders server-side HTML
app.js                 →  JS reads shTheme for client-side behavior
```

### Custom Image Sizes
| Name | Dimensions | Usage |
|------|-----------|-------|
| `sh-card` | 400 x 400 | Gallery thumbs, collage, avatars |
| `sh-timeline` | 512 x 640 | Timeline milestone images |
| `sh-podcast` | 544 x 700 | Podcast episode covers |
| `sh-reel` | 360 x 640 | Playbook reel covers (9:16) |

### SEO
- Semantic HTML: `<main>` wrapper, `<h1>` on hero name only, `role="region"` on sections
- Open Graph and Twitter Card meta tags
- Schema.org `Person` JSON-LD with `sameAs` social links
- Canonical URL via `wp_head`

### Performance
- Non-hero images use `loading="lazy"`
- Preloader prefetches hero logo, poster, and video before reveal
- Custom image sizes serve appropriately scaled thumbnails
- Compatible with LiteSpeed Cache for full-page caching
- No bundled media — zero bloat in the theme package

## Contact Form

The theme supports two contact modes:

1. **Contact Form 7** — Set a CF7 form ID in the Contact Details tab. The CF7 shortcode renders in place of the built-in widget.
2. **Built-in Chat Widget** — When no CF7 form is set, a chat-style contact form submits via AJAX to `wp_ajax_sh_contact`, stores submissions in a `wp_sh_submissions` database table, and sends an email notification to the site admin.

## Fonts

The theme uses three font families loaded via external stylesheets (configurable in Theme Options):

- **Cabinet Grotesk** (headings) — via Fontshare
- **General Sans** (body) — via Fontshare
- **JetBrains Mono** (mono/labels) — via Google Fonts

## License

All Rights Reserved. This theme is proprietary to Saad Hashmani.
