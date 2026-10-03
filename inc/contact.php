<?php
/**
 * Contact (chat form). The theme's chat skin collects name, email, message, inquiry type and an
 * optional attachment and posts them here. The submission is then handed to the form plugin picked in
 * Theme Options (Contact Form 7 or Fluent Forms), so that plugin's validation, spam checks, emails,
 * storage and integrations all run, and its error message is shown in the chat when it rejects one.
 * With no plugin picked (or the picked one unavailable) it is stored in {prefix}sh_submissions and
 * emailed to the site admin. Spam protection: reCAPTCHA v3 (verified here with the theme's or the
 * plugin's keys), a honeypot, per-IP rate limiting, plus the plugin's own checks (Akismet etc.).
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

/** Thrown by a temporary wp_die handler so a plugin's AJAX handler can be run in-process. */
class Sh_Ajax_Done extends Exception {}

/** Plugin field names for the chat answers: Theme Options, else the plugin's usual names. "-" = don't send. */
function sh_contact_fields($plugin) {
    $defaults = [
        'cf7'        => ['name' => 'your-name', 'email' => 'your-email', 'message' => 'your-message', 'type' => 'your-subject', 'attachment' => ''],
        'fluentform' => ['name' => 'names[first_name]', 'email' => 'email', 'message' => 'message', 'type' => 'subject', 'attachment' => ''],
    ];
    $map = $defaults[$plugin] ?? [];
    $saved = (array) sh_get('contact.fields', []);
    foreach ($map as $k => $d) {
        $v = trim((string) ($saved[$k] ?? ''));
        $map[$k] = $v === '-' ? '' : ($v !== '' ? $v : $d);
    }
    return $map;
}

/** The selected plugin's own reCAPTCHA v3 keys, as [site, secret], or null. */
function sh_plugin_recaptcha_keys($plugin) {
    if ($plugin === 'cf7' && class_exists('WPCF7')) {
        foreach ((array) WPCF7::get_option('recaptcha') as $site => $secret) {
            if ($site && $secret) return [(string) $site, (string) $secret];
        }
    }
    if ($plugin === 'fluentform') {
        $o = get_option('_fluentform_reCaptcha_details');
        if (is_array($o) && !empty($o['siteKey']) && !empty($o['secretKey']) && ($o['api_version'] ?? '') === 'v3_invisible') {
            return [(string) $o['siteKey'], (string) $o['secretKey']];
        }
    }
    return null;
}

/** reCAPTCHA keys in use: the theme's, else the selected plugin's, so one set of keys serves both. */
function sh_recaptcha_keys() {
    $ct = sh_get('contact');
    $site = trim((string) ($ct['recaptcha_site'] ?? ''));
    $secret = trim((string) ($ct['recaptcha_secret'] ?? ''));
    $source = 'theme';
    if ($site === '' && ($pk = sh_plugin_recaptcha_keys($ct['form_plugin'] ?? ''))) {
        [$site, $plugin_secret] = $pk;
        if ($secret === '') $secret = $plugin_secret;
        $source = $ct['form_plugin'];
    }
    return ['site' => $site, 'secret' => $secret, 'source' => $site === '' ? '' : $source];
}

/** The picked plugin and form, or null when the plugin is inactive or the form is gone. */
function sh_contact_target() {
    $ct = sh_get('contact');
    $plugin = $ct['form_plugin'] ?? '';
    if ($plugin === 'cf7') {
        $id = (int) ($ct['cf7_form_id'] ?? 0);
        if ($id && function_exists('wpcf7_contact_form') && wpcf7_contact_form($id)) return ['plugin' => 'cf7', 'id' => $id];
    } elseif ($plugin === 'fluentform') {
        // 3.x stored the Fluent Forms id in cf7_form_id
        $id = (int) (($ct['ff_form_id'] ?? 0) ?: ($ct['cf7_form_id'] ?? 0));
        if ($id && defined('FLUENTFORM')) {
            global $wpdb;
            if ($wpdb->get_var($wpdb->prepare("SELECT id FROM {$wpdb->prefix}fluentform_forms WHERE id = %d", $id))) return ['plugin' => 'fluentform', 'id' => $id];
        }
    }
    return null;
}

/** Google siteverify: success, score, action and hostname. */
function sh_verify_recaptcha($token, $secret) {
    if ($token === '') return new WP_Error('captcha', __('Security check failed. Please reload the page and try again.', 'saadhashmani'));
    $resp = wp_remote_post('https://www.google.com/recaptcha/api/siteverify', [
        'timeout' => 10,
        'body' => ['secret' => $secret, 'response' => $token, 'remoteip' => sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR'] ?? ''))],
    ]);
    // Google unreachable: refuse (fail closed) with a visible message, unless a site opts to fail open.
    if (is_wp_error($resp) || (int) wp_remote_retrieve_response_code($resp) !== 200) {
        return apply_filters('sh_recaptcha_fail_open', false) ? true : new WP_Error('captcha', __('The security check is unavailable right now. Please try again in a minute, or email us directly.', 'saadhashmani'));
    }
    $b = json_decode(wp_remote_retrieve_body($resp), true);
    $min = (float) sh_get('contact.recaptcha_score', 0.5);
    $host = preg_replace('/^www\./', '', (string) wp_parse_url(home_url(), PHP_URL_HOST));
    $ok = !empty($b['success'])
        && (float) ($b['score'] ?? 0) >= $min
        && ($b['action'] ?? 'contact') === 'contact'
        && (empty($b['hostname']) || preg_replace('/^www\./', '', $b['hostname']) === $host);
    return $ok ? true : new WP_Error('captcha', __('Your message was flagged as automated. Please try again in a moment, or email us directly.', 'saadhashmani'));
}

/** At most 5 messages per 10 minutes from one IP (filterable). */
function sh_contact_rate_limited() {
    $limit = (int) apply_filters('sh_contact_rate_limit', 5);
    if ($limit <= 0) return false;
    $key = 'sh_rl_' . md5(sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR'] ?? '')) . wp_salt('nonce'));
    $n = (int) get_transient($key);
    if ($n >= $limit) return true;
    set_transient($key, $n + 1, 10 * MINUTE_IN_SECONDS);
    return false;
}

/** With no attachment field mapped, the attachment link goes at the end of the message. */
function sh_with_attachment_link($f, $url, $map) {
    if ($url && empty($map['attachment'])) $f['message'] .= "\n\n" . __('Attachment:', 'saadhashmani') . ' ' . $url;
    return $f;
}

/** Contact Form 7: runs the form's own submit(), the same path its REST endpoint uses. */
function sh_send_cf7($id, $f, $captcha_done) {
    $form = wpcf7_contact_form($id);
    $map = sh_contact_fields('cf7');
    $post = [
        '_wpcf7' => (string) $id, '_wpcf7_version' => defined('WPCF7_VERSION') ? WPCF7_VERSION : '',
        '_wpcf7_locale' => $form->locale(), '_wpcf7_unit_tag' => 'wpcf7-f' . $id . '-o1', '_wpcf7_container_post' => '0',
    ];
    $files = [];
    $url = '';
    if (!empty($_FILES['attachment']['name'])) {
        $is_file_tag = $map['attachment'] && $form->scan_form_tags(['name' => $map['attachment'], 'basetype' => 'file']);
        if ($is_file_tag) {
            $files[$map['attachment']] = $_FILES['attachment']; // CF7 validates, stores and attaches it to the mail
        } else {
            $saved = sh_save_attachment();
            if (is_wp_error($saved)) return $saved;
            $url = (string) $saved;
            if ($map['attachment']) $post[$map['attachment']] = $url;
        }
    }
    $f = sh_with_attachment_link($f, $url, $map);
    foreach (['name', 'email', 'message', 'type'] as $k) if ($map[$k]) $post[$map[$k]] = $f[$k];
    // The theme already verified the single-use reCAPTCHA token; skip only CF7's own reCAPTCHA step
    // (its other spam checks - Akismet, disallowed words, etc. - still run).
    if ($captcha_done) remove_filter('wpcf7_spam', 'wpcf7_recaptcha_verify_response', 9);

    $_POST = wp_slash($post);
    $_REQUEST = $_POST;
    $_FILES = $files;
    $r = $form->submit();
    $status = $r['status'] ?? '';
    $msg = wp_strip_all_tags((string) ($r['message'] ?? ''));
    if ($status === 'mail_sent') return ['message' => $msg];
    $reasons = [];
    foreach ((array) ($r['invalid_fields'] ?? []) as $inv) if (!empty($inv['reason'])) $reasons[] = wp_strip_all_tags($inv['reason']);
    $msg = trim($msg . ' ' . implode(' ', array_unique($reasons)));
    return new WP_Error('rejected', $msg !== '' ? $msg : __('The message could not be sent.', 'saadhashmani'), ['status' => $status]);
}

/** Fluent Forms: runs its public submit handler in-process and reads the JSON it would have sent. */
function sh_send_fluentform($id, $f, $captcha_done) {
    $map = sh_contact_fields('fluentform');
    $url = '';
    if (!empty($_FILES['attachment']['name'])) {
        $saved = sh_save_attachment();
        if (is_wp_error($saved)) return $saved;
        $url = (string) $saved;
    }
    $f = sh_with_attachment_link($f, $url, $map);
    $data = [];
    foreach (['name', 'email', 'message', 'type'] as $k) if ($map[$k]) $data[$map[$k]] = $f[$k];
    if ($url && $map['attachment']) $data[$map['attachment']] = $url;
    $data['_fluentform_' . $id . '_fluentformnonce'] = wp_create_nonce('fluentform-submit-form');
    $data['_wp_http_referer'] = '/';
    $data['__fluent_form_embded_post_id'] = (string) get_option('page_on_front');
    $pairs = [];
    foreach ($data as $k => $v) $pairs[] = rawurlencode($k) . '=' . rawurlencode((string) $v);
    $query = implode('&', $pairs);
    parse_str($query, $parsed); // "names[first_name]" becomes a nested array, as Fluent Forms expects
    // The theme already verified the reCAPTCHA token; Fluent Forms' own captcha step is skipped.
    if ($captcha_done) add_filter('fluentform/disable_captcha', '__return_true', 999);
    $_FILES = [];

    $j = null;
    $thrown = null;
    $service = '\FluentForm\App\Services\Form\SubmissionHandlerService';
    if (class_exists($service)) {
        // Fluent Forms 5+: call its submission service directly (what its AJAX handler does).
        if (function_exists('wpFluentForm')) {
            try { $req = wpFluentForm('request'); if (is_object($req) && method_exists($req, 'merge')) $req->merge(['data' => $parsed, 'form_id' => $id]); } catch (Throwable $e) {}
        }
        try {
            $j = ['success' => true, 'data' => (new $service())->handleSubmission($parsed, $id)];
        } catch (Throwable $e) {
            $j = method_exists($e, 'errors') ? (array) $e->errors() : null;
            if (!$j) $thrown = $e;
        }
    } else {
        // Older versions: run the public AJAX handler in-process and read the JSON it would send.
        $_POST = wp_slash(['action' => 'fluentform_submit', 'form_id' => (string) $id, 'data' => $query]);
        $_REQUEST = $_POST;
        $die = function () { return function () { throw new Sh_Ajax_Done(); }; };
        add_filter('wp_die_ajax_handler', $die, 999);
        ob_start();
        try {
            do_action(is_user_logged_in() ? 'wp_ajax_fluentform_submit' : 'wp_ajax_nopriv_fluentform_submit');
        } catch (Sh_Ajax_Done $e) {
        } catch (Throwable $e) {
            $thrown = $e;
        }
        $j = json_decode((string) ob_get_clean(), true);
        remove_filter('wp_die_ajax_handler', $die, 999);
        status_header(200);
    }
    remove_filter('fluentform/disable_captcha', '__return_true', 999);

    if (is_array($j) && (!empty($j['success']) || !empty($j['data']['insert_id']) || !empty($j['insert_id']))) {
        $res = $j['data']['result'] ?? $j['result'] ?? [];
        return ['message' => wp_strip_all_tags((string) ($res['message'] ?? ''))];
    }
    $msgs = [];
    $errors = $j['errors'] ?? $j['data']['errors'] ?? null;
    if (is_string($errors) && $errors !== '') $msgs[] = wp_strip_all_tags($errors);
    if (is_array($errors)) {
        array_walk_recursive($errors, function ($m) use (&$msgs) { if (is_string($m) && $m !== '') $msgs[] = wp_strip_all_tags($m); });
    }
    foreach ([$j['data']['message'] ?? null, $j['message'] ?? null] as $m) if (is_string($m) && $m !== '') $msgs[] = wp_strip_all_tags($m);
    if (!$msgs && $thrown) $msgs[] = wp_strip_all_tags($thrown->getMessage());
    $msg = implode(' ', array_unique($msgs));
    return new WP_Error('rejected', $msg !== '' ? $msg : __('The message could not be sent.', 'saadhashmani'));
}

/** No plugin (or it is unavailable): theme table + email to the site admin. */
function sh_store_and_email($f) {
    $url = sh_save_attachment();
    if (is_wp_error($url)) return $url;
    global $wpdb;
    if ((int) get_option('sh_submissions_db') < 2) sh_install_submissions_table();
    $ok = $wpdb->insert(sh_submissions_table(), [
        'submitted_date' => wp_date('Y-m-d'), 'submitted_time' => wp_date('H:i:s'),
        'type' => $f['type'], 'name' => $f['name'], 'email' => $f['email'], 'message' => $f['message'], 'attachment_url' => $url,
    ]);
    $body = "Name: {$f['name']}\nEmail: {$f['email']}\nType: {$f['type']}\n\nMessage:\n{$f['message']}\n";
    if ($url) $body .= "\nAttachment: $url\n";
    /* translators: %s: sender name */
    $mailed = wp_mail(get_option('admin_email'), sprintf(__('New contact from %s', 'saadhashmani'), $f['name']), $body, ['Reply-To: ' . $f['name'] . ' <' . $f['email'] . '>']);
    if (!$ok && !$mailed) return new WP_Error('store', __('The message could not be saved. Please email us directly.', 'saadhashmani'));
    return ['message' => ''];
}

function sh_contact_submit() {
    // Logged-out nonces are shared by every visitor and expire inside cached pages (LiteSpeed etc.),
    // which would silently drop messages; they add no CSRF protection there, so only check them for
    // logged-in users. Spam protection for everyone else: reCAPTCHA, honeypot, rate limit.
    if (is_user_logged_in()) check_ajax_referer('sh_contact', 'nonce');

    // Honeypot: a hidden field people never see. Bots that fill it get a quiet "success".
    if (!empty($_POST['website'])) wp_send_json_success(['message' => '']);

    $f = [
        'name'    => mb_substr(sanitize_text_field(wp_unslash($_POST['name'] ?? '')), 0, 100),
        'email'   => mb_substr(sanitize_email(wp_unslash($_POST['email'] ?? '')), 0, 191),
        'message' => mb_substr(sanitize_textarea_field(wp_unslash($_POST['message'] ?? '')), 0, 5000),
        'type'    => sanitize_text_field(wp_unslash($_POST['type'] ?? '')),
    ];
    if ($f['name'] === '' || !is_email($f['email']) || $f['message'] === '') {
        wp_send_json_error(['error' => __('Please provide your name, a valid email and a message.', 'saadhashmani')], 400);
    }
    $types = array_values(array_filter((array) sh_get('contact.form_types', [])));
    if ($types && !in_array($f['type'], $types, true)) $f['type'] = sh_get('contact.default_type') ?: $types[0];

    if (sh_contact_rate_limited()) {
        wp_send_json_error(['error' => __('Too many messages from your connection. Please wait a few minutes and try again.', 'saadhashmani')], 429);
    }

    // reCAPTCHA v3 is verified here, once (tokens are single-use), with the theme's keys or the form
    // plugin's own keys; the plugin's reCAPTCHA step is then skipped for this submission.
    $target = sh_contact_target();
    $keys = sh_recaptcha_keys();
    $captcha_done = false;
    if ($keys['site'] !== '' && $keys['secret'] !== '') {
        $ok = sh_verify_recaptcha(sanitize_text_field(wp_unslash($_POST['recaptcha_token'] ?? '')), $keys['secret']);
        if (is_wp_error($ok)) wp_send_json_error(['error' => $ok->get_error_message()], 403);
        $captcha_done = true;
    }

    if ($target && $target['plugin'] === 'cf7') $res = sh_send_cf7($target['id'], $f, $captcha_done);
    elseif ($target && $target['plugin'] === 'fluentform') $res = sh_send_fluentform($target['id'], $f, $captcha_done);
    else {
        if (sh_get('contact.form_plugin')) error_log('[saadhashmani] Contact: the selected form plugin or form is unavailable; message stored and emailed instead.');
        $res = sh_store_and_email($f);
    }

    if (is_wp_error($res)) wp_send_json_error(['error' => $res->get_error_message()], 422);
    wp_send_json_success(['message' => $res['message'] ?? '']);
}
add_action('wp_ajax_sh_contact', 'sh_contact_submit');
add_action('wp_ajax_nopriv_sh_contact', 'sh_contact_submit');
