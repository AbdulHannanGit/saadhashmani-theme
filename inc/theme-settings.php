<?php
/**
 * Settings screen (admin menu "Saad Hashmani"): tab router and save handler.
 */
defined('ABSPATH') || exit;

add_action('admin_menu', function () {
    add_menu_page(__('Saad Hashmani', 'saadhashmani'), __('Saad Hashmani', 'saadhashmani'), 'manage_options', 'sh-settings', 'sh_settings_page', 'dashicons-businessman', 60);
});

add_action('admin_enqueue_scripts', function ($hook) {
    if ($hook !== 'toplevel_page_sh-settings') return;
    wp_enqueue_media();
    wp_enqueue_style('sh-admin', SH_URI . '/css/admin.css', [], SH_VERSION);
    wp_enqueue_script('sh-admin', sh_script_url('admin'), ['jquery'], SH_VERSION, true);
    wp_localize_script('sh-admin', 'shAdmin', [
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'nonce'   => wp_create_nonce('sh_settings_nonce'),
        'i18n'    => [
            'confirmImport' => __('Import demo media? Files already in the Media Library are reused, and theme media fields are pointed at the demo files.', 'saadhashmani'),
            'lastItem'      => __('At least one item is required.', 'saadhashmani'),
            'invalidJson'   => __('Invalid JSON:', 'saadhashmani'),
        ],
    ]);
});

/** Fields that hold an attachment ID or an external URL. */
function sh_is_video_key($key) {
    return in_array($key, ['video_480', 'video_720', 'video_1080'], true);
}

/** Plain text: tags and invalid UTF-8 removed, whitespace kept (ring texts rely on trailing spaces). */
function sh_clean_text($value) {
    return str_replace("\0", '', strip_tags(wp_check_invalid_utf8((string) $value)));
}

function sh_clean_url($value) {
    $value = trim((string) $value);
    if ($value === '' || $value === '#') return $value;
    return str_replace(['%5B', '%5D'], ['[', ']'], esc_url_raw($value));
}

/**
 * Sanitize posted data against the type of the matching default:
 * bool -> bool, int -> int (media IDs, counts), list -> each item against the first default item,
 * strings -> URL-sanitized for *_url keys and social links, otherwise plain text.
 * $path is the dot path of the value (used to recognise social links).
 */
function sh_sanitize_value($value, $default, $key = '', $path = '') {
    if (sh_is_video_key($key)) {
        return is_numeric($value) ? (int) $value : sh_clean_url($value);
    }
    if (is_bool($default)) return !empty($value) && $value !== '0';
    if (is_int($default)) return (int) $value;
    if (is_float($default)) return (float) $value;
    if (is_array($default)) {
        if (sh_is_list($default)) {
            if (!is_array($value)) {
                // Gallery fields post "12,15,18".
                return array_values(array_filter(array_map('intval', explode(',', (string) $value))));
            }
            $proto = $default[0] ?? '';
            $out = [];
            foreach (array_values($value) as $i => $item) $out[] = sh_sanitize_value($item, $proto, $key, $path . '.' . $i);
            return $out;
        }
        $out = [];
        foreach ((array) $value as $k => $v) {
            $k = sanitize_key($k);
            $out[$k] = sh_sanitize_value($v, $default[$k] ?? (is_array($v) ? [] : ''), $k, ltrim($path . '.' . $k, '.'));
        }
        return $out;
    }
    if (preg_match('/(^|_)url$/', $key) || preg_match('/(^|\.)social\.[a-z]+$/', $path)) return sh_clean_url($value);
    return sh_clean_text($value);
}

function sh_handle_settings_save() {
    if (!current_user_can('manage_options') || empty($_POST['sh_nonce'])) return;
    check_admin_referer('sh_settings_nonce', 'sh_nonce');

    $tab = sanitize_key($_POST['sh_current_tab'] ?? 'options');
    $section = sanitize_key($_POST['sh_current_section'] ?? '');
    $current = sh_settings(true);
    $notice = 'saved';

    if ($tab === 'json') {
        $decoded = json_decode(wp_unslash($_POST['sh_json'] ?? ''), true);
        if (is_array($decoded)) {
            update_option('sh_settings', sh_sanitize_value($decoded, sh_defaults()));
        } else {
            $notice = 'json_error';
        }
    } elseif (isset($_POST['sh']) && is_array($_POST['sh'])) {
        $clean = sh_sanitize_value(wp_unslash($_POST['sh']), sh_defaults());
        update_option('sh_settings', sh_merge($current, $clean));
    }

    $args = ['page' => 'sh-settings', 'tab' => $tab, $notice => 1];
    if ($section) $args['section'] = $section;
    wp_safe_redirect(add_query_arg($args, admin_url('admin.php')));
    exit;
}
add_action('admin_post_sh_save_settings', 'sh_handle_settings_save');

function sh_settings_page() {
    if (!current_user_can('manage_options')) return;
    $tabs = [
        'options'  => __('Theme Options', 'saadhashmani'),
        'sections' => __('Sections', 'saadhashmani'),
        'contact'  => __('Contact Details', 'saadhashmani'),
        'json'     => __('Master JSON', 'saadhashmani'),
    ];
    $tab = sanitize_key($_GET['tab'] ?? 'options');
    if (!isset($tabs[$tab])) $tab = 'options';
    $s = sh_settings(true);
    ?>
    <div class="wrap sh-settings-wrap">
        <h1><?php esc_html_e('Saad Hashmani Theme Settings', 'saadhashmani'); ?></h1>
        <?php if (isset($_GET['saved'])) : ?>
            <div class="notice notice-success is-dismissible"><p><?php esc_html_e('Settings saved.', 'saadhashmani'); ?></p></div>
        <?php elseif (isset($_GET['json_error'])) : ?>
            <div class="notice notice-error"><p><?php esc_html_e('The JSON could not be parsed. Nothing was saved.', 'saadhashmani'); ?></p></div>
        <?php endif; ?>

        <nav class="sh-tabs">
            <?php foreach ($tabs as $slug => $label) : ?>
                <a href="<?php echo esc_url(add_query_arg(['page' => 'sh-settings', 'tab' => $slug], admin_url('admin.php'))); ?>" class="sh-tab-link <?php echo $tab === $slug ? 'active' : ''; ?>"><?php echo esc_html($label); ?></a>
            <?php endforeach; ?>
        </nav>

        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" class="sh-settings-form">
            <input type="hidden" name="action" value="sh_save_settings">
            <?php wp_nonce_field('sh_settings_nonce', 'sh_nonce'); ?>
            <input type="hidden" name="sh_current_tab" value="<?php echo esc_attr($tab); ?>">
            <?php include SH_DIR . '/inc/tab-' . $tab . '.php'; ?>
            <p class="submit"><button type="submit" class="button button-primary"><?php esc_html_e('Save Settings', 'saadhashmani'); ?></button></p>
        </form>
    </div>
    <?php
}
