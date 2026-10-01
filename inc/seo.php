<?php
/**
 * Front-page SEO: title, description, canonical, Open Graph / Twitter and JSON-LD.
 * Stands down when a dedicated SEO plugin is active so tags are never duplicated.
 */
defined('ABSPATH') || exit;

function sh_seo_plugin_active() {
    return defined('WPSEO_VERSION') || defined('RANK_MATH_VERSION') || defined('AIOSEO_VERSION') || class_exists('The_SEO_Framework\Load') || defined('SEOPRESS_VERSION');
}

function sh_seo_description() {
    $d = trim((string) sh_get('seo.description'));
    if ($d !== '') return $d;
    return trim(sh_get('hero.first_name') . ' ' . sh_get('hero.last_name')) . ' — ' . sh_get('hero.eyebrow');
}

function sh_seo_image() {
    $id = sh_get('seo.og_image') ?: sh_get('hero.poster') ?: sh_get('options.logo');
    if (!$id) return null;
    $src = wp_get_attachment_image_src((int) $id, 'large');
    return $src ? ['url' => $src[0], 'w' => $src[1], 'h' => $src[2]] : null;
}

// The theme prints the front-page canonical itself; avoid WordPress's duplicate.
add_action('wp', function () {
    if (is_front_page() && !sh_seo_plugin_active()) remove_action('wp_head', 'rel_canonical');
});

add_filter('pre_get_document_title', function ($title) {
    if (!is_front_page() || sh_seo_plugin_active()) return $title;
    $t = trim((string) sh_get('seo.title'));
    return $t !== '' ? $t : $title;
});

add_action('wp_head', function () {
    if (!is_front_page() || sh_seo_plugin_active()) return;
    $name = trim(sh_get('hero.first_name') . ' ' . sh_get('hero.last_name'));
    $title = trim((string) sh_get('seo.title')) ?: $name;
    $desc = sh_seo_description();
    $url = home_url('/');
    $img = sh_seo_image();

    echo '<meta name="description" content="' . esc_attr($desc) . '">' . "\n";
    echo '<link rel="canonical" href="' . esc_url($url) . '">' . "\n";
    echo '<meta name="theme-color" content="' . esc_attr(sh_css_color(sh_get('options.colors.bg')) ?: '#0b0b0c') . '">' . "\n";
    echo '<meta property="og:type" content="website">' . "\n";
    echo '<meta property="og:site_name" content="' . esc_attr(get_bloginfo('name')) . '">' . "\n";
    echo '<meta property="og:title" content="' . esc_attr($title) . '">' . "\n";
    echo '<meta property="og:description" content="' . esc_attr($desc) . '">' . "\n";
    echo '<meta property="og:url" content="' . esc_url($url) . '">' . "\n";
    echo '<meta property="og:locale" content="' . esc_attr(get_locale()) . '">' . "\n";
    if ($img) {
        echo '<meta property="og:image" content="' . esc_url($img['url']) . '">' . "\n";
        echo '<meta property="og:image:width" content="' . (int) $img['w'] . '">' . "\n";
        echo '<meta property="og:image:height" content="' . (int) $img['h'] . '">' . "\n";
    }
    echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
    echo '<meta name="twitter:title" content="' . esc_attr($title) . '">' . "\n";
    echo '<meta name="twitter:description" content="' . esc_attr($desc) . '">' . "\n";
    if ($img) echo '<meta name="twitter:image" content="' . esc_url($img['url']) . '">' . "\n";
    $x = sh_get('contact.social.x', '');
    if ($x) echo '<meta name="twitter:site" content="@' . esc_attr(basename(untrailingslashit(wp_parse_url($x, PHP_URL_PATH) ?: ''))) . '">' . "\n";
}, 1);

add_action('wp_head', function () {
    if (!is_front_page() || sh_seo_plugin_active()) return;
    $url = home_url('/');
    $name = trim(sh_get('hero.first_name') . ' ' . sh_get('hero.last_name'));
    $person = [
        '@type'    => 'Person',
        '@id'      => $url . '#person',
        'name'     => $name,
        'url'      => $url,
        'jobTitle' => sh_get('hero.eyebrow', ''),
        'description' => sh_seo_description(),
        'sameAs'   => array_values(array_filter((array) sh_get('contact.social', []))),
    ];
    $logo = sh_img(sh_get('options.logo'));
    if ($logo) $person['image'] = $logo;
    $email = sh_get('contact.email', '');
    if ($email) $person['email'] = 'mailto:' . $email;
    $loc = trim(explode('·', (string) sh_get('contact.location', ''))[0]);
    if ($loc !== '') $person['address'] = ['@type' => 'PostalAddress', 'addressLocality' => trim(explode(',', $loc)[0])];
    $founded = [];
    foreach ((array) sh_get('ventures', []) as $v) {
        if (!empty($v['title'])) {
            $org = ['@type' => 'Organization', 'name' => $v['title']];
            if (!empty($v['cta_url']) && $v['cta_url'] !== '#') $org['url'] = $v['cta_url'];
            $founded[] = $org;
        }
    }
    if ($founded) $person['founder'] = $founded;

    $graph = [
        '@context' => 'https://schema.org',
        '@graph'   => [
            $person,
            ['@type' => 'WebSite', '@id' => $url . '#website', 'url' => $url, 'name' => get_bloginfo('name'), 'publisher' => ['@id' => $url . '#person'], 'inLanguage' => get_bloginfo('language')],
        ],
    ];
    echo '<script type="application/ld+json">' . wp_json_encode($graph, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . '</script>' . "\n";
}, 3);
