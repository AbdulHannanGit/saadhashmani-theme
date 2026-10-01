<?php
/**
 * Chat-form submissions: stored in {prefix}sh_submissions, then mirrored to
 * Fluent Forms or emailed to the site admin. Optional reCAPTCHA v3 and attachment.
 */
defined('ABSPATH') || exit;

function sh_submissions_table() {
    global $wpdb;
    return $wpdb->prefix . 'sh_submissions';
}

/** Create or upgrade the submissions table (dbDelta adds the attachment column on old installs). */
function sh_install_submissions_table() {
    global $wpdb;
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    $table = sh_submissions_table();
    dbDelta("CREATE TABLE $table (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        submitted_date date NOT NULL,
        submitted_time time NOT NULL,
        type varchar(64) NOT NULL DEFAULT 'general',
        name varchar(191) NOT NULL,
        email varchar(191) NOT NULL,
        message text NOT NULL,
        attachment_url varchar(512) DEFAULT NULL,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY  (id)
    ) " . $wpdb->get_charset_collate() . ';');
    update_option('sh_submissions_db', 2, false);
}

/** Save an uploaded attachment into uploads/sh-submissions/ (images, PDF, Office, text; 10 MB). */
function sh_save_attachment() {
    if (empty($_FILES['attachment']['name']) || (int) $_FILES['attachment']['error'] !== UPLOAD_ERR_OK) return null;
    if ((int) $_FILES['attachment']['size'] > 10 * MB_IN_BYTES) return new WP_Error('size', __('Attachment must be 10 MB or smaller.', 'saadhashmani'));

    $mimes = [
        'jpg|jpeg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp', 'gif' => 'image/gif',
        'pdf' => 'application/pdf', 'txt' => 'text/plain',
        'doc' => 'application/msword', 'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls' => 'application/vnd.ms-excel', 'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt' => 'application/vnd.ms-powerpoint', 'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];
    require_once ABSPATH . 'wp-admin/includes/file.php';
    $dir_filter = function ($dirs) {
        $dirs['subdir'] = '/sh-submissions';
        $dirs['path'] = $dirs['basedir'] . '/sh-submissions';
        $dirs['url'] = $dirs['baseurl'] . '/sh-submissions';
        return $dirs;
    };
    add_filter('upload_dir', $dir_filter);
    $name_filter = function ($file) {
        $file['name'] = gmdate('Ymd_His') . '_' . wp_generate_password(8, false) . '_' . sanitize_file_name($file['name']);
        return $file;
    };
    add_filter('wp_handle_upload_prefilter', $name_filter);
    $res = wp_handle_upload($_FILES['attachment'], ['test_form' => false, 'mimes' => $mimes]);
    remove_filter('wp_handle_upload_prefilter', $name_filter);
    remove_filter('upload_dir', $dir_filter);

    if (!empty($res['error'])) return new WP_Error('upload', $res['error']);

    $dir = dirname($res['file']);
    if (!file_exists($dir . '/index.php')) @file_put_contents($dir . '/index.php', "<?php // Silence.\n");
    if (!file_exists($dir . '/.htaccess')) {
        @file_put_contents($dir . '/.htaccess', "Options -Indexes -ExecCGI\n<FilesMatch \"\\.(php|phtml|phar|pl|py|cgi|sh)$\">\n  Require all denied\n</FilesMatch>\n");
    }
    return $res['url'];
}

function sh_contact_submit() {
    // Logged-out nonces are shared by every visitor and expire inside cached pages (LiteSpeed etc.),
    // which would silently drop messages; they add no CSRF protection there, so only check them for
    // logged-in users. Spam protection for everyone else is reCAPTCHA.
    if (is_user_logged_in()) check_ajax_referer('sh_contact', 'nonce');

    $name    = sanitize_text_field(wp_unslash($_POST['name'] ?? ''));
    $email   = sanitize_email(wp_unslash($_POST['email'] ?? ''));
    $message = sanitize_textarea_field(wp_unslash($_POST['message'] ?? ''));
    $type    = sanitize_text_field(wp_unslash($_POST['type'] ?? 'general'));

    if ($name === '' || !is_email($email) || $message === '') {
        wp_send_json_error(['error' => __('Please provide your name, a valid email and a message.', 'saadhashmani')], 400);
    }

    $rc_secret = sh_get('contact.recaptcha_secret');
    if (!empty($rc_secret)) {
        $token = sanitize_text_field(wp_unslash($_POST['recaptcha_token'] ?? ''));
        if ($token === '') wp_send_json_error(['error' => 'reCAPTCHA verification failed'], 403);
        $resp = wp_remote_post('https://www.google.com/recaptcha/api/siteverify', [
            'timeout' => 10,
            'body' => ['secret' => $rc_secret, 'response' => $token, 'remoteip' => sanitize_text_field($_SERVER['REMOTE_ADDR'] ?? '')],
        ]);
        $body = json_decode(wp_remote_retrieve_body($resp), true);
        if (empty($body['success']) || ($body['score'] ?? 0) < 0.5) wp_send_json_error(['error' => 'Spam detected'], 403);
    }

    $attachment = sh_save_attachment();
    if (is_wp_error($attachment)) wp_send_json_error(['error' => $attachment->get_error_message()], 400);

    global $wpdb;
    if ((int) get_option('sh_submissions_db') < 2) sh_install_submissions_table();
    $ok = $wpdb->insert(sh_submissions_table(), [
        'submitted_date' => wp_date('Y-m-d'),
        'submitted_time' => wp_date('H:i:s'),
        'type'           => $type,
        'name'           => $name,
        'email'          => $email,
        'message'        => $message,
        'attachment_url' => $attachment,
    ]);
    if (!$ok) wp_send_json_error(['error' => 'Database error'], 500);
    $id = (int) $wpdb->insert_id;

    $ct = sh_get('contact');
    $form_id = (int) ($ct['cf7_form_id'] ?? 0);
    if (($ct['form_plugin'] ?? '') === 'fluentform' && $form_id > 0 && defined('FLUENTFORM') && function_exists('fluentFormApi')) {
        $wpdb->insert($wpdb->prefix . 'fluentform_submissions', [
            'form_id'       => $form_id,
            'serial_number' => fluentFormApi('submissions')->getNextEntrySerialNumber($form_id),
            'response'      => wp_json_encode(['names' => $name, 'email' => $email, 'message' => $message, 'inquiry_type' => $type, 'attachment' => $attachment]),
            'source_url'    => home_url('/'),
            'user_id'       => get_current_user_id(),
            'status'        => 'unread',
            'created_at'    => current_time('mysql'),
            'updated_at'    => current_time('mysql'),
        ]);
        if ($wpdb->insert_id) do_action('fluentform/submission_inserted', $wpdb->insert_id, [], $form_id);
    } else {
        $body = "Name: $name\nEmail: $email\nType: $type\n\nMessage:\n$message\n";
        if ($attachment) $body .= "\nAttachment: $attachment\n";
        /* translators: %s: sender name */
        wp_mail(get_option('admin_email'), sprintf(__('New contact from %s', 'saadhashmani'), $name), $body, ['Reply-To: ' . $name . ' <' . $email . '>']);
    }

    wp_send_json_success(['id' => $id]);
}
add_action('wp_ajax_sh_contact', 'sh_contact_submit');
add_action('wp_ajax_nopriv_sh_contact', 'sh_contact_submit');
