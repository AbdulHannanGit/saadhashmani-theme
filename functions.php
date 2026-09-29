<?php
if (!defined('ABSPATH')) exit;

define('SH_VERSION', '2.0.0');
define('SH_DIR', get_template_directory());
define('SH_URI', get_template_directory_uri());

require_once SH_DIR . '/inc/defaults.php';
require_once SH_DIR . '/inc/helpers.php';
require_once SH_DIR . '/inc/seo.php';
require_once SH_DIR . '/inc/theme-settings.php';

function sh_setup() {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', ['search-form', 'comment-form', 'comment-list', 'gallery', 'caption']);
    add_image_size('sh-card', 400, 400, true);
    add_image_size('sh-timeline', 512, 640, true);
    add_image_size('sh-podcast', 544, 700, true);
    add_image_size('sh-reel', 360, 640, true);
}
add_action('after_setup_theme', 'sh_setup');

function sh_enqueue() {
    $fonts = sh_get('options.fonts');
    if (!empty($fonts['grotesk_url'])) {
        wp_enqueue_style('sh-fontshare', $fonts['grotesk_url'], [], null);
    }
    if (!empty($fonts['google_url'])) {
        wp_enqueue_style('sh-google-fonts', $fonts['google_url'], [], null);
    }

    wp_enqueue_style('sh-style', get_stylesheet_uri(), [], SH_VERSION);
    wp_enqueue_style('sh-mobile', SH_URI . '/css/mobile.css', ['sh-style'], SH_VERSION, '(max-width:768px)');

    wp_enqueue_script('lenis', 'https://cdn.jsdelivr.net/npm/lenis@1.1.18/dist/lenis.min.js', [], '1.1.18', true);
    wp_enqueue_script('sh-app', SH_URI . '/js/app.js', ['lenis'], SH_VERSION, true);

    $hero = sh_resolve_hero();
    wp_localize_script('sh-app', 'shTheme', [
        'ajaxUrl'  => admin_url('admin-ajax.php'),
        'nonce'    => wp_create_nonce('sh_contact'),
        'options'  => sh_get('options'),
        'hero'     => $hero,
        'sections' => [
            'record'         => ['eyebrow' => sh_get('record.eyebrow'), 'heading' => sh_get('record.heading'), 'stats' => sh_get('record.stats')],
            'timeline'       => sh_resolve_timeline(),
            'ventures'       => sh_resolve_ventures(),
            'playbook'       => sh_resolve_playbook(),
            'podcasts'       => sh_resolve_podcasts(),
            'testimonials'   => sh_resolve_testimonials(),
            'receipts_stats' => sh_get('receipts.stats'),
            'collage'        => sh_resolve_collage(),
        ],
        'contact'  => sh_get('contact'),
    ]);
}
add_action('wp_enqueue_scripts', 'sh_enqueue');

remove_action('wp_head', 'print_emoji_detection_script', 7);
remove_action('wp_print_styles', 'print_emoji_styles');
remove_action('wp_head', 'wp_generator');
remove_action('wp_head', 'wlwmanifest_link');
remove_action('wp_head', 'rsd_link');

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

    $result = $wpdb->insert($table, [
        'submitted_date' => wp_date('Y-m-d'),
        'submitted_time' => wp_date('H:i:s'),
        'type'           => $type,
        'name'           => $name,
        'email'          => $email,
        'message'        => $message,
    ]);

    if ($result) {
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

function sh_demo_import() {
    check_ajax_referer('sh_settings_nonce', 'nonce');
    if (!current_user_can('manage_options')) wp_send_json_error('Unauthorized');

    $manifest_url = esc_url_raw($_POST['manifest_url'] ?? '');
    if (empty($manifest_url)) wp_send_json_error('No manifest URL');

    $response = wp_remote_get($manifest_url, ['timeout' => 30]);
    if (is_wp_error($response)) wp_send_json_error('Failed to fetch manifest: ' . $response->get_error_message());

    $manifest = json_decode(wp_remote_retrieve_body($response), true);
    if (!is_array($manifest) || empty($manifest['files'])) wp_send_json_error('Invalid manifest');

    $base_url = $manifest['base_url'] ?? '';
    $settings = get_option('sh_settings', []);
    if (!is_array($settings)) $settings = [];
    $log = [];
    $id_map = [];

    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';

    foreach ($manifest['files'] as $file) {
        $url = $base_url . $file['path'];
        $log[] = 'Downloading: ' . $file['path'];

        $tmp = download_url($url, 60);
        if (is_wp_error($tmp)) {
            $log[] = 'FAILED: ' . $tmp->get_error_message();
            continue;
        }

        $file_array = [
            'name'     => basename($file['path']),
            'tmp_name' => $tmp,
        ];

        $att_id = media_handle_sideload($file_array, 0, $file['title'] ?? '');
        if (is_wp_error($att_id)) {
            $log[] = 'FAILED to import: ' . $att_id->get_error_message();
            @unlink($tmp);
            continue;
        }

        $id_map[$file['key']] = $att_id;
        $log[] = 'Imported: ' . $file['path'] . ' → ID ' . $att_id;
    }

    if (!empty($manifest['settings_map']) && !empty($id_map)) {
        foreach ($manifest['settings_map'] as $dot_path => $file_key) {
            if (!isset($id_map[$file_key])) continue;
            $keys = explode('.', $dot_path);
            $ref = &$settings;
            foreach ($keys as $k) {
                if (!isset($ref[$k])) $ref[$k] = [];
                $ref = &$ref[$k];
            }
            $ref = $id_map[$file_key];
            unset($ref);
        }
        update_option('sh_settings', $settings);
        $log[] = 'Settings updated with ' . count($id_map) . ' media references.';
    }

    wp_send_json_success(['log' => $log, 'imported' => count($id_map)]);
}
add_action('wp_ajax_sh_demo_import', 'sh_demo_import');
