<?php
/**
 * Saad Hashmani Theme Functions
 */

if (!defined('ABSPATH')) exit;

define('SH_VERSION', '1.0.0');
define('SH_DIR', get_template_directory());
define('SH_URI', get_template_directory_uri());

function sh_setup() {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', ['search-form', 'comment-form', 'comment-list', 'gallery', 'caption']);
}
add_action('after_setup_theme', 'sh_setup');

function sh_enqueue() {
    // Fonts
    wp_enqueue_style('sh-fontshare', 'https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,700,800&f[]=general-sans@400,500,600&display=swap', [], null);
    wp_enqueue_style('sh-google-fonts', 'https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap', [], null);

    // Theme CSS
    wp_enqueue_style('sh-style', get_stylesheet_uri(), [], SH_VERSION);
    wp_enqueue_style('sh-mobile', SH_URI . '/css/mobile.css', ['sh-style'], SH_VERSION, '(max-width:768px)');

    // Lenis smooth scroll
    wp_enqueue_script('lenis', 'https://cdn.jsdelivr.net/npm/lenis@1.1.18/dist/lenis.min.js', [], '1.1.18', true);

    // Main app
    wp_enqueue_script('sh-app', SH_URI . '/js/app.js', ['lenis'], SH_VERSION, true);

    // Pass asset paths to JS
    wp_localize_script('sh-app', 'shTheme', [
        'ajaxUrl'  => admin_url('admin-ajax.php'),
        'nonce'    => wp_create_nonce('sh_contact'),
        'assetUrl' => SH_URI . '/assets/',
    ]);
}
add_action('wp_enqueue_scripts', 'sh_enqueue');

// Remove WP emoji, embed, and block library for performance
remove_action('wp_head', 'print_emoji_detection_script', 7);
remove_action('wp_print_styles', 'print_emoji_styles');
remove_action('wp_head', 'wp_generator');
remove_action('wp_head', 'wlwmanifest_link');
remove_action('wp_head', 'rsd_link');

// Contact form AJAX handler
function sh_contact_submit() {
    check_ajax_referer('sh_contact', 'nonce');

    $name    = sanitize_text_field($_POST['name'] ?? '');
    $email   = sanitize_email($_POST['email'] ?? '');
    $message = sanitize_textarea_field($_POST['message'] ?? '');
    $type    = sanitize_text_field($_POST['type'] ?? 'general');

    if (empty($name) || empty($email) || empty($message)) {
        wp_send_json_error(['error' => 'Missing required fields'], 400);
    }

    global $wpdb;
    $table = $wpdb->prefix . 'sh_submissions';

    // Create table on first use
    if ($wpdb->get_var("SHOW TABLES LIKE '$table'") !== $table) {
        $charset = $wpdb->get_charset_collate();
        $wpdb->query("CREATE TABLE $table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            submitted_date date NOT NULL,
            submitted_time time NOT NULL,
            type varchar(64) NOT NULL DEFAULT 'general',
            name varchar(191) NOT NULL,
            email varchar(191) NOT NULL,
            message text NOT NULL,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset");
    }

    $now = current_time('mysql');
    $result = $wpdb->insert($table, [
        'submitted_date' => wp_date('Y-m-d'),
        'submitted_time' => wp_date('H:i:s'),
        'type'           => $type,
        'name'           => $name,
        'email'          => $email,
        'message'        => $message,
    ]);

    if ($result) {
        // Email notification
        $to = get_option('admin_email');
        $subject = "New contact from $name";
        $body = "Name: $name\nEmail: $email\nType: $type\n\nMessage:\n$message";
        wp_mail($to, $subject, $body);

        wp_send_json_success(['id' => $wpdb->insert_id]);
    } else {
        wp_send_json_error(['error' => 'Database error'], 500);
    }
}
add_action('wp_ajax_sh_contact', 'sh_contact_submit');
add_action('wp_ajax_nopriv_sh_contact', 'sh_contact_submit');
