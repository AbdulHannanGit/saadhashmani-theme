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

    wp_enqueue_style('sh-style', get_stylesheet_uri(), [], SH_VERSION);
    wp_enqueue_style('sh-mobile', SH_URI . '/css/mobile.css', ['sh-style'], SH_VERSION, '(max-width:768px)');

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
