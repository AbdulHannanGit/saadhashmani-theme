<?php
if (!defined('ABSPATH')) exit;

function sh_seo_meta() {
    if (!is_front_page()) return;
    $name = sh_get('hero.first_name', 'Saad') . ' ' . sh_get('hero.last_name', 'Hashmani');
    $eyebrow = sh_get('hero.eyebrow', '');
    $desc = $name . ' — ' . $eyebrow . '. Venture portfolio showcasing TradingPapa, H University, SH Group and more.';
    $url = home_url('/');
    $logo_url = sh_img(sh_get('options.logo'), 'full');
    $poster_url = sh_img(sh_get('hero.poster'), 'full');
    $image = $poster_url ?: $logo_url;

    echo '<meta name="description" content="' . esc_attr($desc) . '">' . "\n";
    echo '<link rel="canonical" href="' . esc_url($url) . '">' . "\n";

    echo '<meta property="og:type" content="website">' . "\n";
    echo '<meta property="og:title" content="' . esc_attr($name) . '">' . "\n";
    echo '<meta property="og:description" content="' . esc_attr($desc) . '">' . "\n";
    echo '<meta property="og:url" content="' . esc_url($url) . '">' . "\n";
    if ($image) echo '<meta property="og:image" content="' . esc_url($image) . '">' . "\n";

    echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
    echo '<meta name="twitter:title" content="' . esc_attr($name) . '">' . "\n";
    echo '<meta name="twitter:description" content="' . esc_attr($desc) . '">' . "\n";
    if ($image) echo '<meta name="twitter:image" content="' . esc_url($image) . '">' . "\n";
    $x = sh_get('contact.social.x', '');
    if ($x) echo '<meta name="twitter:site" content="@' . esc_attr(basename(rtrim($x, '/'))) . '">' . "\n";
}
add_action('wp_head', 'sh_seo_meta', 1);

function sh_schema_jsonld() {
    if (!is_front_page()) return;
    $name = sh_get('hero.first_name', 'Saad') . ' ' . sh_get('hero.last_name', 'Hashmani');
    $social = sh_get('contact.social', []);
    $same_as = array_values(array_filter($social));
    $logo_url = sh_img(sh_get('options.logo'), 'full');

    $schema = [
        '@context'  => 'https://schema.org',
        '@type'     => 'Person',
        'name'      => $name,
        'url'       => home_url('/'),
        'jobTitle'  => sh_get('hero.eyebrow', ''),
        'sameAs'    => $same_as,
    ];
    if ($logo_url) $schema['image'] = $logo_url;
    $email = sh_get('contact.email', '');
    if ($email) $schema['email'] = 'mailto:' . $email;
    $location = sh_get('contact.location', '');
    if ($location) {
        $schema['address'] = [
            '@type'           => 'PostalAddress',
            'addressLocality' => explode(',', $location)[0] ?? $location,
        ];
    }

    echo '<script type="application/ld+json">' . wp_json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . '</script>' . "\n";
}
add_action('wp_head', 'sh_schema_jsonld', 2);
