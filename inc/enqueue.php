<?php
/**
 * Front-end assets. GSAP is not enqueued here: app.js downloads it on demand
 * (only when enabled for the visitor's device), so full-page caches stay valid.
 */
defined('ABSPATH') || exit;

/** Hex, rgb()/rgba() or hsl()/hsla() colour, or '' if invalid. */
function sh_css_color($c) {
    $c = trim((string) $c);
    if (preg_match('/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i', $c)) return $c;
    if (preg_match('/^(rgb|hsl)a?\(\s*[0-9.,%\s\/]+\)$/i', $c)) return $c;
    return '';
}

function sh_font_urls() {
    $f = sh_get('options.fonts');
    return [
        'heading' => !empty($f['local_heading']) ? wp_get_attachment_url((int) $f['local_heading']) : '',
        'body'    => !empty($f['local_body']) ? wp_get_attachment_url((int) $f['local_body']) : '',
        'remote'  => $f['grotesk_url'] ?? '',
        'google'  => $f['google_url'] ?? '',
    ];
}

add_action('wp_enqueue_scripts', function () {
    $fonts = sh_font_urls();

    // Remote stylesheets are skipped once both families are self-hosted.
    if ($fonts['remote'] && !($fonts['heading'] && $fonts['body'])) {
        wp_enqueue_style('sh-fonts', $fonts['remote'], [], null);
    }
    if ($fonts['google']) {
        wp_enqueue_style('sh-google-fonts', $fonts['google'], [], null);
    }

    if (is_front_page() && !(defined('SCRIPT_DEBUG') && SCRIPT_DEBUG)) {
        // One-page site: inline the (small) theme CSS so the first paint waits on no stylesheet requests.
        wp_register_style('sh-style', false, [], SH_VERSION);
        wp_enqueue_style('sh-style');
        wp_add_inline_style('sh-style', sh_inline_theme_css());
    } else {
        wp_enqueue_style('sh-style', get_stylesheet_uri(), [], SH_VERSION);
        wp_enqueue_style('sh-mobile', SH_URI . '/css/mobile.css', ['sh-style'], SH_VERSION, '(max-width:768px)');
    }

    $css = '';
    foreach ([['heading', 'Zodiak'], ['body', 'General Sans']] as $ff) {
        if ($fonts[$ff[0]]) {
            $css .= "@font-face{font-family:'{$ff[1]}';src:url('" . esc_url($fonts[$ff[0]]) . "') format('woff2');font-weight:100 900;font-display:swap}";
        }
    }
    $vars = '';
    foreach ((array) sh_get('options.colors', []) as $key => $val) {
        $val = sh_css_color($val);
        if ($val !== '') $vars .= '--' . str_replace('_', '-', sanitize_key($key)) . ':' . $val . ';';
    }
    if ($vars) $css .= ':root{' . $vars . '}';
    if ($css) wp_add_inline_style('sh-style', $css);

    if (!is_front_page()) return;

    wp_enqueue_script('sh-app', sh_script_url('app'), [], SH_VERSION, ['in_footer' => true, 'strategy' => 'defer']);
    wp_add_inline_script('sh-app', 'window.shTheme=' . wp_json_encode(sh_js_data()) . ';', 'before');

    $rc = sh_get('contact.recaptcha_site');
    if ($rc) {
        wp_enqueue_script('google-recaptcha', 'https://www.google.com/recaptcha/api.js?render=' . rawurlencode($rc), [], null, ['in_footer' => true, 'strategy' => 'defer']);
    }
});

/** style.css + mobile.css (inside its media query), comments and extra whitespace stripped. */
function sh_inline_theme_css() {
    $key = 'sh_inline_css_' . SH_VERSION . '_' . filemtime(SH_DIR . '/style.css') . '_' . filemtime(SH_DIR . '/css/mobile.css');
    $css = get_transient($key);
    if ($css !== false) return $css;
    $min = function ($c) {
        $c = preg_replace('#/\*.*?\*/#s', '', $c);
        $c = preg_replace('/\s+/', ' ', $c);
        return trim(preg_replace('/\s*([{};,>])\s*/', '$1', $c));
    };
    $css = $min((string) file_get_contents(SH_DIR . '/style.css')) . '@media (max-width:768px){' . $min((string) file_get_contents(SH_DIR . '/css/mobile.css')) . '}';
    set_transient($key, $css, WEEK_IN_SECONDS);
    return $css;
}

// Font stylesheets load without blocking the first paint (the preloader name waits for them; see app.js).
add_filter('style_loader_tag', function ($tag, $handle) {
    if (!in_array($handle, ['sh-fonts', 'sh-google-fonts'], true)) return $tag;
    $async = preg_replace("/media=(['\"])[^'\"]*\\1/", "media='print' onload=\"this.media='all'\"", $tag, 1);
    return $async . '<noscript>' . $tag . '</noscript>';
}, 10, 2);

// The theme's own contact form replaces Contact Form 7 on the front page: drop its CSS/JS there.
add_action('wp_enqueue_scripts', function () {
    if (!is_front_page()) return;
    foreach (['contact-form-7', 'swv'] as $h) { wp_dequeue_script($h); wp_dequeue_style($h); }
}, 100);

add_action('wp_head', function () {
    $fonts = sh_font_urls();
    if ($fonts['remote'] && !($fonts['heading'] && $fonts['body'])) {
        echo '<link rel="preconnect" href="https://api.fontshare.com" crossorigin>' . "\n";
        echo '<link rel="preconnect" href="https://cdn.fontshare.com" crossorigin>' . "\n";
    }
    if ($fonts['google']) {
        echo '<link rel="preconnect" href="https://fonts.googleapis.com">' . "\n";
        echo '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' . "\n";
    }
    if (!is_front_page()) return;
    // The hero still is the first thing painted (preloader backdrop and video poster).
    $still = sh_img(sh_get('hero.poster'));
    if ($still) echo '<link rel="preload" as="image" href="' . esc_url($still) . '" fetchpriority="high">' . "\n";
}, 2);
