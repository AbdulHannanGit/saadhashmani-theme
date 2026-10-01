<?php
/**
 * Demo media importer (Theme Options > Demo Media Importer).
 *
 * Manifest: { base_url, files: [{key, path, title, alt, sha1}], settings_map: {"dot.path": "key"} }
 * A file is skipped when the Media Library already holds it: first by the source path recorded
 * on a previous import, then by SHA-1 of the file contents (catches media added by hand or by
 * the 2.x importer, without false matches between files that merely share a name).
 */
defined('ABSPATH') || exit;

function sh_demo_find_existing($path, $sha1, $bytes = 0) {
    $q = ['post_type' => 'attachment', 'post_status' => 'inherit', 'posts_per_page' => 1, 'fields' => 'ids', 'no_found_rows' => true];
    $hit = get_posts($q + ['meta_key' => '_sh_demo_src', 'meta_value' => $path]);
    if ($hit) return (int) $hit[0];
    if (!$sha1) return 0;
    $hit = get_posts($q + ['meta_key' => '_sh_demo_sha1', 'meta_value' => $sha1]);
    if ($hit) return (int) $hit[0];

    // Same base name (WordPress may have appended -1, -2 or -scaled): compare file contents.
    $stem = pathinfo($path, PATHINFO_FILENAME);
    // Anchor on "/" so a stem like "2026" does not match the 2026/10/ upload folders.
    $candidates = get_posts(['post_type' => 'attachment', 'post_status' => 'inherit', 'posts_per_page' => 100, 'fields' => 'ids', 'no_found_rows' => true,
        'meta_query' => [['key' => '_wp_attached_file', 'value' => '/' . sanitize_file_name($stem), 'compare' => 'LIKE']]]);
    foreach ($candidates as $id) {
        $file = function_exists('wp_get_original_image_path') ? wp_get_original_image_path($id) : '';
        if (!$file || !file_exists($file)) $file = get_attached_file($id);
        if (!$file || !file_exists($file) || ($bytes && filesize($file) !== $bytes)) continue;
        if (sha1_file($file) === $sha1) {
            update_post_meta($id, '_sh_demo_sha1', $sha1);
            update_post_meta($id, '_sh_demo_src', $path);
            return (int) $id;
        }
    }
    return 0;
}

function sh_demo_import_batch() {
    check_ajax_referer('sh_settings_nonce', 'nonce');
    if (!current_user_can('manage_options') || !current_user_can('upload_files')) wp_send_json_error('Unauthorized', 403);
    @set_time_limit(300);

    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';

    $base_url = esc_url_raw(wp_unslash($_POST['base_url'] ?? ''));
    $files = json_decode(wp_unslash($_POST['files'] ?? '[]'), true);
    // download_url() applies WordPress's safe-URL checks to every file; here only require http(s).
    if (!preg_match('#^https?://#i', $base_url) || !is_array($files) || !$files) wp_send_json_error('No files in batch');

    $log = [];
    $id_map = [];
    foreach ($files as $file) {
        $key = sanitize_text_field($file['key'] ?? '');
        $path = ltrim(str_replace(['..', '\\'], '', (string) ($file['path'] ?? '')), '/');
        $sha1 = preg_match('/^[a-f0-9]{40}$/', $file['sha1'] ?? '') ? $file['sha1'] : '';
        if ($key === '' || $path === '') continue;
        $name = basename($path);

        $existing = sh_demo_find_existing($path, $sha1, (int) ($file['bytes'] ?? 0));
        if ($existing) {
            $id_map[$key] = $existing;
            $log[] = 'Exists: ' . $name . ' → ID ' . $existing;
            continue;
        }

        $tmp = download_url($base_url . str_replace('%2F', '/', rawurlencode($path)), 120);
        if (is_wp_error($tmp)) {
            $log[] = 'FAILED: ' . $name . ' — ' . $tmp->get_error_message();
            continue;
        }
        $head = (string) @file_get_contents($tmp, false, null, 0, 64);
        if (strpos($head, 'version https://git-lfs') === 0) {
            @unlink($tmp);
            $log[] = 'FAILED: ' . $name . ' — the host returned a Git LFS pointer, not the file. Commit media without LFS (see README).';
            continue;
        }
        if ($sha1 && sha1_file($tmp) !== $sha1) {
            @unlink($tmp);
            $log[] = 'FAILED: ' . $name . ' — checksum mismatch.';
            continue;
        }

        $att_id = media_handle_sideload(['name' => $name, 'tmp_name' => $tmp], 0, sanitize_text_field($file['title'] ?? ''));
        if (is_wp_error($att_id)) {
            @unlink($tmp);
            $log[] = 'FAILED: ' . $name . ' — ' . $att_id->get_error_message();
            continue;
        }
        update_post_meta($att_id, '_sh_demo_src', $path);
        if ($sha1) update_post_meta($att_id, '_sh_demo_sha1', $sha1);
        if (!empty($file['alt']) && wp_attachment_is_image($att_id)) update_post_meta($att_id, '_wp_attachment_image_alt', sanitize_text_field($file['alt']));

        $id_map[$key] = (int) $att_id;
        $log[] = 'Imported: ' . $name . ' → ID ' . $att_id;
    }
    wp_send_json_success(['log' => $log, 'id_map' => $id_map]);
}
add_action('wp_ajax_sh_demo_import_batch', 'sh_demo_import_batch');

/** Arrays keyed only by integers become ordered lists again (a failed file leaves a gap). */
function sh_demo_normalize_lists($a) {
    if (!is_array($a)) return $a;
    foreach ($a as $k => $v) $a[$k] = sh_demo_normalize_lists($v);
    if ($a && count(array_filter(array_keys($a), 'is_int')) === count($a)) {
        ksort($a);
        $a = array_values($a);
    }
    return $a;
}

function sh_demo_apply_map() {
    check_ajax_referer('sh_settings_nonce', 'nonce');
    if (!current_user_can('manage_options')) wp_send_json_error('Unauthorized', 403);

    $settings_map = json_decode(wp_unslash($_POST['settings_map'] ?? '{}'), true);
    $id_map = json_decode(wp_unslash($_POST['id_map'] ?? '{}'), true);
    if (!is_array($settings_map) || !is_array($id_map)) wp_send_json_error('Invalid data');

    // Work on the full merged settings: lists replace defaults wholesale, so a partial list would drop content.
    $settings = sh_settings(true);
    $applied = 0;
    foreach ($settings_map as $dot_path => $file_key) {
        if (!isset($id_map[$file_key]) || !preg_match('/^[a-z0-9_.]+$/i', $dot_path)) continue;
        $ref = &$settings;
        foreach (explode('.', $dot_path) as $k) {
            if (!is_array($ref)) $ref = [];
            if (!array_key_exists($k, $ref)) $ref[$k] = [];
            $ref = &$ref[$k];
        }
        $ref = (int) $id_map[$file_key];
        unset($ref);
        $applied++;
    }
    update_option('sh_settings', sh_demo_normalize_lists($settings));
    wp_send_json_success(['applied' => $applied]);
}
add_action('wp_ajax_sh_demo_apply_map', 'sh_demo_apply_map');
