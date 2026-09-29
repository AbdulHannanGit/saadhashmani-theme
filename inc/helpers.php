<?php
if (!defined('ABSPATH')) exit;

function sh_get($path = null, $fallback = null) {
    static $settings = null;
    if ($settings === null) {
        $saved = get_option('sh_settings', []);
        $settings = is_array($saved) ? array_replace_recursive(sh_defaults(), $saved) : sh_defaults();
    }
    if ($path === null) return $settings;
    $keys = explode('.', $path);
    $val = $settings;
    foreach ($keys as $k) {
        if (!isset($val[$k])) return $fallback;
        $val = $val[$k];
    }
    return $val;
}

function sh_img($id, $size = 'thumbnail') {
    if (!$id) return '';
    return wp_get_attachment_image_url((int) $id, $size) ?: '';
}

function sh_vid($id_or_url) {
    if (!$id_or_url) return '';
    if (is_numeric($id_or_url)) return wp_get_attachment_url((int) $id_or_url) ?: '';
    return $id_or_url;
}

function sh_resolve_hero() {
    $h = sh_get('hero');
    $opts = sh_get('options');
    $logo_id = sh_get('options.logo');
    return [
        'eyebrow'        => $h['eyebrow'],
        'first_name'     => $h['first_name'],
        'last_name'      => $h['last_name'],
        'preloader_text' => $h['preloader_text'],
        'scroll_text'    => $h['scroll_text'],
        'gate_message'   => $h['gate_message'],
        'logo_url'       => sh_img($logo_id, 'full'),
        'poster_url'     => sh_img($h['poster'], 'full'),
        'video_480'      => sh_vid($h['video_480']),
        'video_720'      => sh_vid($h['video_720']),
        'video_1080'     => sh_vid($h['video_1080']),
    ];
}

function sh_resolve_timeline() {
    $items = sh_get('record.timeline', []);
    return array_map(function ($m) {
        $id = $m['img'];
        $m['img'] = sh_img($id, 'sh-timeline');
        $m['img_full'] = sh_img($id, 'full');
        return $m;
    }, $items);
}

function sh_resolve_ventures() {
    $ventures = sh_get('ventures', []);
    return array_map(function ($v) {
        $v['logo_url'] = sh_img($v['logo'], 'medium');
        $v['gallery_thumbs'] = array_map(function ($id) {
            return sh_img($id, 'sh-card');
        }, $v['gallery']);
        $v['gallery_full'] = array_map(function ($id) {
            return sh_img($id, 'full');
        }, $v['gallery']);
        $v['partner_urls'] = array_map(function ($id) {
            return sh_img($id, 'thumbnail');
        }, $v['partners']);
        return $v;
    }, $ventures);
}

function sh_resolve_playbook() {
    $pb = sh_get('playbook');
    $reels = array_map(function ($r) {
        $r['img'] = sh_img($r['img'], 'sh-reel');
        return $r;
    }, $pb['reels']);
    return [
        'eyebrow'    => $pb['eyebrow'],
        'heading'    => $pb['heading'],
        'principles' => $pb['principles'],
        'reels'      => $reels,
    ];
}

function sh_resolve_podcasts() {
    $eps = sh_get('podcast.episodes', []);
    return array_map(function ($e) {
        $e['img'] = sh_img($e['img'], 'sh-podcast');
        $e['thumb'] = sh_img($e['thumb'], 'sh-podcast');
        return $e;
    }, $eps);
}

function sh_resolve_testimonials() {
    $left = sh_get('receipts.testimonials_left', []);
    $right = sh_get('receipts.testimonials_right', []);
    $resolve = function ($cards) {
        return array_map(function ($c) {
            $c['avatar_url'] = sh_img($c['avatar'], 'sh-card');
            return $c;
        }, $cards);
    };
    return ['left' => $resolve($left), 'right' => $resolve($right)];
}

function sh_resolve_collage() {
    $collage = sh_get('collage');
    $images = $collage['images'];
    if (!empty($images)) {
        return array_map(function ($id) {
            return sh_img($id, 'sh-card');
        }, $images);
    }
    return [];
}
