<?php
if (!defined('ABSPATH')) exit;

add_action('admin_menu', function () {
    add_menu_page('Saad Hashmani', 'Saad Hashmani', 'manage_options', 'sh-settings', 'sh_settings_page', 'dashicons-businessman', 60);
});

add_action('admin_enqueue_scripts', function ($hook) {
    if ($hook !== 'toplevel_page_sh-settings') return;
    wp_enqueue_media();
    wp_enqueue_style('sh-admin', get_template_directory_uri() . '/css/admin.css', [], '1.0');
    wp_enqueue_script('sh-admin', get_template_directory_uri() . '/js/admin.js', ['jquery'], '1.0', true);
    wp_localize_script('sh-admin', 'shAdmin', [
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'nonce'   => wp_create_nonce('sh_settings_nonce'),
    ]);
});

function sh_settings_page() {
    if (!current_user_can('manage_options')) return;

    // Save handler
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['sh_nonce'])) {
        check_admin_referer('sh_settings_nonce', 'sh_nonce');

        $tab = isset($_POST['sh_current_tab']) ? sanitize_text_field($_POST['sh_current_tab']) : 'options';

        // JSON tab: parse raw JSON
        if ($tab === 'json' && isset($_POST['sh_json'])) {
            $decoded = json_decode(stripslashes($_POST['sh_json']), true);
            if (is_array($decoded)) {
                update_option('sh_settings', $decoded);
            }
        } elseif (isset($_POST['sh'])) {
            $raw = $_POST['sh'];
            $saved = get_option('sh_settings', []);
            if (!is_array($saved)) $saved = [];
            $data = sh_sanitize_recursive($raw);
            $merged = array_replace_recursive($saved, $data);
            update_option('sh_settings', $merged);
        }

        wp_redirect(admin_url('admin.php?page=sh-settings&tab=' . $tab . '&saved=1'));
        exit;
    }

    $tab = isset($_GET['tab']) ? sanitize_text_field($_GET['tab']) : 'options';
    $tabs = [
        'options' => 'Theme Options',
        'sections' => 'Sections',
        'contact' => 'Contact Details',
        'json' => 'Master JSON',
    ];

    ?>
    <div class="sh-settings-wrap">
        <h1>Saad Hashmani Theme Settings</h1>

        <?php if (isset($_GET['saved'])): ?>
            <div class="notice notice-success is-dismissible"><p>Settings saved.</p></div>
        <?php endif; ?>

        <nav class="sh-tabs">
            <?php foreach ($tabs as $slug => $label): ?>
                <a href="<?php echo admin_url('admin.php?page=sh-settings&tab=' . $slug); ?>"
                   class="sh-tab-link <?php echo $tab === $slug ? 'active' : ''; ?>">
                    <?php echo esc_html($label); ?>
                </a>
            <?php endforeach; ?>
        </nav>

        <form method="post" class="sh-settings-form">
            <?php wp_nonce_field('sh_settings_nonce', 'sh_nonce'); ?>
            <input type="hidden" name="sh_current_tab" value="<?php echo esc_attr($tab); ?>">

            <?php
            $tab_file = get_template_directory() . '/inc/tab-' . $tab . '.php';
            if (file_exists($tab_file)) {
                include $tab_file;
            }
            ?>

            <p class="submit">
                <button type="submit" class="button button-primary">Save Settings</button>
            </p>
        </form>
    </div>
    <?php
}

function sh_sanitize_recursive($data) {
    if (!is_array($data)) {
        return sanitize_text_field($data);
    }
    $out = [];
    foreach ($data as $k => $v) {
        $out[sanitize_text_field($k)] = sh_sanitize_recursive($v);
    }
    return $out;
}
