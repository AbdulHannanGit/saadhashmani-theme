<?php
/**
 * Theme supports, image sizes, upload types and head cleanup.
 */
defined('ABSPATH') || exit;

add_action('after_setup_theme', function () {
    load_theme_textdomain('saadhashmani', SH_DIR . '/languages');
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', ['search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script']);
    add_image_size('sh-card', 400, 400, true);
    add_image_size('sh-timeline', 512, 640, true);
    add_image_size('sh-podcast', 544, 700, true);
    add_image_size('sh-reel', 360, 640, true);
});

add_filter('upload_mimes', function ($mimes) {
    $mimes['mp4']   = 'video/mp4';
    $mimes['webm']  = 'video/webm';
    $mimes['woff2'] = 'font/woff2';
    return $mimes;
});

// WordPress checks the real file type; woff2 is not in its default map.
add_filter('wp_check_filetype_and_ext', function ($data, $file, $filename) {
    if (empty($data['ext']) && strtolower(pathinfo($filename, PATHINFO_EXTENSION)) === 'woff2' && current_user_can('upload_files')) {
        $data = ['ext' => 'woff2', 'type' => 'font/woff2', 'proper_filename' => false];
    }
    return $data;
}, 10, 3);

// Leaner <head>: the one-page site has no use for these.
remove_action('wp_head', 'print_emoji_detection_script', 7);
remove_action('wp_print_styles', 'print_emoji_styles');
remove_action('wp_head', 'wp_generator');
remove_action('wp_head', 'wlwmanifest_link');
remove_action('wp_head', 'rsd_link');
remove_action('wp_head', 'wp_shortlink_wp_head');
remove_action('wp_head', 'rest_output_link_wp_head');
remove_action('wp_head', 'wp_oembed_add_discovery_links');
add_filter('emoji_svg_url', '__return_false');

add_action('wp', function () {
    if (!is_front_page()) return;
    // The front page uses no blocks: skip global styles (theme.json presets) and the SVG filter set.
    remove_action('wp_enqueue_scripts', 'wp_enqueue_global_styles');
    remove_action('wp_footer', 'wp_enqueue_global_styles', 1);
    remove_action('wp_body_open', 'wp_global_styles_render_svg_filters');
});

add_action('wp_enqueue_scripts', function () {
    if (!is_front_page()) return;
    wp_dequeue_style('wp-block-library');
    wp_dequeue_style('wp-block-library-theme');
    wp_dequeue_style('global-styles');
    wp_dequeue_style('classic-theme-styles');
}, 100);
