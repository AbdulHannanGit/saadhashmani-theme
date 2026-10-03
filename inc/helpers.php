<?php
/**
 * Settings access, media resolution and the data handed to templates and app.js.
 */
defined('ABSPATH') || exit;

/** True for a list ([0 => .., 1 => ..]); false for an associative array. */
function sh_is_list($a) {
    return is_array($a) && ($a === [] || array_keys($a) === range(0, count($a) - 1));
}

/**
 * Merge saved settings over defaults. Associative arrays merge key by key so new
 * default keys appear after an update; lists (repeaters) are taken as saved, so a
 * deleted row stays deleted.
 */
function sh_merge($base, $over) {
    if (!is_array($base) || !is_array($over) || sh_is_list($base)) {
        return $over;
    }
    if ($over === []) return $base;
    if (sh_is_list($over)) return $over;
    foreach ($over as $k => $val) {
        $base[$k] = array_key_exists($k, $base) ? sh_merge($base[$k], $val) : $val;
    }
    return $base;
}

function sh_settings($refresh = false) {
    static $settings = null;
    if ($settings === null || $refresh) {
        $saved = get_option('sh_settings', []);
        $settings = is_array($saved) ? sh_merge(sh_defaults(), $saved) : sh_defaults();
    }
    return $settings;
}

/** Read a setting by dot path, e.g. sh_get('hero.first_name'). */
function sh_get($path = null, $fallback = null) {
    $val = sh_settings();
    if ($path === null) return $val;
    foreach (explode('.', $path) as $k) {
        if (!is_array($val) || !array_key_exists($k, $val)) return $fallback;
        $val = $val[$k];
    }
    return $val;
}

/** Theme script URL: the .min.js build unless SCRIPT_DEBUG is on. */
function sh_script_url($name) {
    $min = !(defined('SCRIPT_DEBUG') && SCRIPT_DEBUG) && file_exists(SH_DIR . "/js/$name.min.js");
    return SH_URI . '/js/' . $name . ($min ? '.min' : '') . '.js';
}

function sh_img($id, $size = 'full') {
    if (!$id || !is_numeric($id)) return is_string($id) && preg_match('#^https?://#', $id) ? $id : '';
    return wp_get_attachment_image_url((int) $id, $size) ?: '';
}

/** ' srcset=".." sizes=".."' for an attachment (same-ratio sizes only), so phones and small slots get small files. */
function sh_srcset($id, $size, $sizes) {
    if (!$id || !is_numeric($id)) return '';
    $set = wp_get_attachment_image_srcset((int) $id, $size);
    return $set ? ' srcset="' . esc_attr($set) . '" sizes="' . esc_attr($sizes) . '"' : '';
}

/** Display width (px) of an image shown at a fixed CSS height, for the sizes hint. */
function sh_width_at($id, $height, $max = 0) {
    $src = is_numeric($id) && $id ? wp_get_attachment_image_src((int) $id, 'medium') : false;
    $w = ($src && $src[2]) ? (int) ceil($height * $src[1] / $src[2]) : $height * 3;
    return $max ? min($max, $w) : $w;
}

/** Video fields accept an attachment ID or an external URL. */
function sh_vid($id_or_url) {
    if (!$id_or_url) return '';
    if (is_numeric($id_or_url)) return wp_get_attachment_url((int) $id_or_url) ?: '';
    return esc_url_raw($id_or_url);
}

function sh_alt($id, $fallback = '') {
    $alt = $id ? trim((string) get_post_meta((int) $id, '_wp_attachment_image_alt', true)) : '';
    return $alt !== '' ? $alt : $fallback;
}

function sh_platform_name($key) {
    $names = ['google' => 'Google', 'instagram' => 'Instagram', 'facebook' => 'Facebook', 'tiktok' => 'TikTok', 'twitter' => 'X'];
    return $names[$key] ?? ucfirst($key);
}

/** "4.04, 5.04, ..." -> 14 floats, or [] when the value is not a full set. */
function sh_clip_lengths($raw) {
    $nums = array_values(array_filter(array_map('floatval', preg_split('/[\s,]+/', (string) $raw)), function ($n) { return $n > 0; }));
    return count($nums) === 14 ? $nums : [];
}

function sh_social_links() {
    $labels = [
        'x'         => ['X', 'X'],
        'facebook'  => ['FB', 'Facebook'],
        'instagram' => ['Insta', 'Instagram'],
        'tiktok'    => ['Tiktok', 'TikTok'],
        'linkedin'  => ['Linkedin', 'LinkedIn'],
    ];
    $social = (array) sh_get('contact.social', []);
    $out = [];
    foreach ($labels as $key => $l) {
        if (!empty($social[$key])) $out[] = ['key' => $key, 'url' => $social[$key], 'short' => $l[0], 'label' => $l[1]];
    }
    return $out;
}

function sh_resolve_card($c) {
    $c = wp_parse_args((array) $c, ['platform' => 'google', 'stars' => 5, 'text' => '', 'name' => '', 'role' => '', 'avatar' => 0, 'media' => 0, 'yt' => '']);
    $labels = (array) sh_get('receipts.filter_labels', []);
    return [
        'platform' => sanitize_key($c['platform']),
        'stars'    => max(0, min(5, (int) $c['stars'])),
        'text'     => $c['text'],
        'name'     => $c['name'],
        'role'     => $c['role'],
        'badge'    => $labels[$c['platform']] ?? strtoupper(substr($c['platform'], 0, 2)),
        'avatar'   => sh_img($c['avatar'], 'sh-card'),
        'media'    => sh_img($c['media'], 'medium_large'),
        'yt'       => $c['yt'],
    ];
}

/** Everything the front-page templates print. Built once per request. */
function sh_view_data() {
    static $v = null;
    if ($v !== null) return $v;
    $s = sh_settings();
    $h = $s['hero'];
    $first = trim($h['first_name']);
    $last = trim($h['last_name']);
    $ids = ['home', 'journey', 'ventures', 'playbook', 'podcast', 'receipts', 'contact'];
    $nav = [];
    foreach ($ids as $i => $id) $nav[] = ['id' => $id, 'label' => $s['options']['nav'][$i] ?? ucfirst($id)];

    $ventures = [];
    foreach ((array) $s['ventures'] as $ven) {
        $ven = wp_parse_args((array) $ven, ['logo' => 0, 'eyebrow' => '', 'title' => '', 'description' => '', 'cta_label' => '', 'cta_url' => '#', 'stats' => [], 'gallery' => []]);
        $gallery = [];
        foreach ((array) $ven['gallery'] as $gid) {
            $thumb = sh_img($gid, 'sh-card');
            if ($thumb) $gallery[] = ['thumb' => $thumb, 'srcset' => sh_srcset($gid, 'sh-card', '(max-width:768px) 96px, 112px'), 'full' => sh_img($gid, 'large')];
        }
        $ventures[] = [
            'logo' => sh_img($ven['logo'], 'medium'), 'logo_srcset' => sh_srcset($ven['logo'], 'medium', sh_width_at($ven['logo'], 44, 190) . 'px'), 'eyebrow' => $ven['eyebrow'], 'title' => $ven['title'],
            'description' => $ven['description'], 'cta_label' => $ven['cta_label'], 'cta_url' => $ven['cta_url'] ?: '#',
            'stats' => array_values((array) $ven['stats']), 'gallery' => $gallery,
        ];
    }

    $partners = [];
    foreach ((array) $s['partners'] as $p) {
        $url = sh_img($p['img'] ?? 0, 'medium');
        if ($url) $partners[] = ['url' => $url, 'srcset' => sh_srcset($p['img'] ?? 0, 'medium', sh_width_at($p['img'] ?? 0, max(12, (int) ($p['h'] ?? 24))) . 'px'), 'h' => max(12, (int) ($p['h'] ?? 24)), 'alt' => sh_alt($p['img'], $p['name'] ?? '')];
    }

    $episodes = [];
    foreach ((array) $s['podcast']['episodes'] as $e) {
        $e = wp_parse_args((array) $e, ['t' => '', 'src' => '', 'd' => '', 'yt' => '', 'img' => 0, 'thumb' => 0]);
        $pid = $e['thumb'] ?: $e['img'];
        // ring cards show at ~110-150px wide: let the browser pick the medium size instead of the original
        $episodes[] = ['t' => $e['t'], 'd' => $e['d'], 'thumb' => sh_img($pid, 'sh-podcast'), 'srcset' => sh_srcset($pid, 'medium', '(max-width:768px) 110px, 150px')];
    }

    $topics = array_merge(wp_list_pluck((array) $s['playbook']['reels'], 't'), wp_list_pluck((array) $s['playbook']['principles'], 't'));
    $types = array_values(array_filter((array) $s['contact']['form_types']));
    $default_type = in_array($s['contact']['default_type'], $types, true) ? $s['contact']['default_type'] : ($types[0] ?? '');

    $v = [
        'first' => $first, 'last' => $last, 'name' => trim($first . ' ' . $last),
        'logo' => sh_img($s['options']['logo']),
        'logo_srcset' => sh_srcset($s['options']['logo'], 'full', '260px'),
        'still' => sh_img($h['poster']),
        'eyebrow' => $h['eyebrow'], 'scroll_text' => $h['scroll_text'], 'preloader_text' => $h['preloader_text'],
        'preloader' => !empty($s['options']['preloader']),
        /* translators: %s: first name */
        'cta' => sprintf(__('Connect with %s', 'saadhashmani'), $first),
        'nav' => $nav,
        'email' => $s['contact']['email'], 'location' => $s['contact']['location'],
        'social_links' => sh_social_links(),
        'record' => ['eyebrow' => $s['record']['eyebrow'], 'heading' => $s['record']['heading'], 'stats' => array_values((array) $s['record']['stats'])],
        'ventures' => $ventures,
        'partners' => $partners,
        'playbook' => ['eyebrow' => $s['playbook']['eyebrow'], 'heading' => $s['playbook']['heading'], 'topics' => array_filter($topics)],
        'podcast' => ['eyebrow' => $s['podcast']['eyebrow'], 'episodes' => $episodes, 'first' => $episodes[0] ?? ['t' => '', 'd' => '']],
        'receipts' => [
            'eyebrow' => $s['receipts']['eyebrow'], 'heading' => $s['receipts']['heading'],
            'labels' => (array) $s['receipts']['filter_labels'],
            'stats_all' => array_values((array) ($s['receipts']['stats']['all'] ?? [])),
            'left' => array_map('sh_resolve_card', (array) $s['receipts']['testimonials_left']),
            'right' => array_map('sh_resolve_card', (array) $s['receipts']['testimonials_right']),
        ],
        'contact' => [
            'eyebrow' => $s['contact']['eyebrow'], 'heading' => $s['contact']['heading'], 'accent' => $s['contact']['heading_accent'],
            'description' => $s['contact']['description'], 'types' => $types, 'default_type' => $default_type,
        ],
    ];
    return $v;
}

/** Data app.js needs at runtime (window.shTheme). Secrets never go here. */
/**
 * Whether a playbook reel/principle shows on the phone wheel ("m"). Items saved before the
 * checkbox existed have no "m" key and take the default pick, matched by title.
 */
function sh_pb_on_mobile($item, $list) {
    $item = (array) $item;
    if (array_key_exists('m', $item)) return !empty($item['m']);
    static $picks = [];
    if (!isset($picks[$list])) {
        $picks[$list] = [];
        foreach ((array) (sh_defaults()['playbook'][$list] ?? []) as $d) if (!empty($d['m'])) $picks[$list][$d['t']] = true;
    }
    return isset($picks[$list][$item['t'] ?? '']);
}

function sh_js_data() {
    $s = sh_settings();
    $h = $s['hero'];
    $o = $s['options'];

    $timeline = [];
    foreach ((array) $s['record']['timeline'] as $m) {
        $m = wp_parse_args((array) $m, ['y' => '', 't' => '', 'tag' => '', 'img' => 0, 'd' => '']);
        $timeline[] = ['y' => $m['y'], 't' => $m['t'], 'tag' => $m['tag'], 'd' => $m['d'], 'img' => sh_img($m['img'], 'sh-timeline'), 'thumb' => sh_img($m['img'], 'medium') ?: sh_img($m['img'], 'sh-timeline')];
    }
    $reels = [];
    foreach ((array) $s['playbook']['reels'] as $r) {
        $r = wp_parse_args((array) $r, ['t' => '', 'img' => 0, 'embed' => '']);
        $m = sh_pb_on_mobile($r, 'reels');
        $reels[] = ['t' => $r['t'], 'img' => sh_img($r['img'], 'sh-reel'), 'embed' => $r['embed'], 'm' => $m];
    }
    $principles = [];
    foreach ((array) $s['playbook']['principles'] as $p) {
        if (empty($p['t'])) continue;
        $m = sh_pb_on_mobile($p, 'principles');
        $principles[] = ['t' => $p['t'], 'd' => $p['d'] ?? '', 'm' => $m];
    }
    $pods = [];
    foreach ((array) $s['podcast']['episodes'] as $e) {
        $e = wp_parse_args((array) $e, ['t' => '', 'src' => '', 'd' => '', 'yt' => '', 'img' => 0, 'thumb' => 0]);
        $pods[] = ['t' => $e['t'], 'src' => $e['src'], 'd' => $e['d'], 'yt' => $e['yt'], 'img' => sh_img($e['img'] ?: $e['thumb'], 'large')];
    }
    $first_gallery = (array) ($s['ventures'][0]['gallery'] ?? []);
    $preload_gallery = array_values(array_filter(array_map(function ($id) { return sh_img($id, 'sh-card'); }, array_slice($first_gallery, 0, 2))));

    $o_out = array_intersect_key($o, array_flip(['custom_cursor', 'animations', 'gsap_desktop', 'gsap_mobile', 'preloader', 'preloader_assets', 'video_quality', 'mobile_video_quality']));

    return [
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('sh_contact'),
        'options' => $o_out,
        'gsapFiles' => [
            SH_URI . '/js/vendor/gsap.min.js?ver=3.13.0',
            SH_URI . '/js/vendor/SplitText.min.js?ver=3.13.0',
            SH_URI . '/js/vendor/ScrambleTextPlugin.min.js?ver=3.13.0',
            sh_script_url('gsap-motion') . '?ver=' . SH_VERSION,
        ],
        'hero' => [
            'first_name' => $h['first_name'], 'last_name' => $h['last_name'], 'scroll_text' => $h['scroll_text'],
            'logo_url' => sh_img($o['logo'], 'medium_large'), 'poster_url' => sh_img($h['poster']),
            'video_480' => sh_vid($h['video_480']), 'video_720' => sh_vid($h['video_720']), 'video_1080' => sh_vid($h['video_1080']),
            'clips' => sh_clip_lengths($h['clips']),
        ],
        'preloadGallery' => $preload_gallery,
        'sections' => [
            'timeline' => $timeline,
            'playbook' => ['locked_count' => max(0, (int) $s['playbook']['locked_count']), 'reels' => $reels, 'principles' => $principles],
            'podcasts' => $pods,
            'receipts_stats' => (array) $s['receipts']['stats'],
        ],
        'contact' => ['recaptcha_site' => $s['contact']['recaptcha_site']],
    ];
}
