<?php
defined('ABSPATH') || exit;
$ct = $s['contact'];
$fp = $ct['form_plugin'] ?? '';
?>
<h2><?php esc_html_e('Contact Details', 'saadhashmani'); ?></h2>
<div class="sh-grid">
<?php
sh_field_text('contact.email', __('Email', 'saadhashmani'), $ct['email'], __('Shown in the menu as the direct line and used in structured data.', 'saadhashmani'), 'email');
sh_field_text('contact.location', __('Location', 'saadhashmani'), $ct['location'], __('Shown in the menu. Text before the first comma is used as the locality in structured data.', 'saadhashmani'));
?>
</div>

<h3><?php esc_html_e('Social links', 'saadhashmani'); ?></h3>
<p class="description"><?php esc_html_e('Empty links are hidden everywhere.', 'saadhashmani'); ?></p>
<div class="sh-grid">
<?php foreach (['x' => 'X (Twitter)', 'facebook' => 'Facebook', 'instagram' => 'Instagram', 'tiktok' => 'TikTok', 'linkedin' => 'LinkedIn'] as $k => $label) sh_field_text("contact.social.$k", $label, $ct['social'][$k] ?? '', '', 'url'); ?>
</div>

<h3><?php esc_html_e('Where submissions go', 'saadhashmani'); ?></h3>
<p class="description"><?php esc_html_e('Every submission is stored in the database table wp_sh_submissions. In addition it is either emailed to the site admin or added to Fluent Forms.', 'saadhashmani'); ?></p>
<?php sh_field_select('contact.form_plugin', __('Also send to', 'saadhashmani'), $fp, ['' => __('Email to site admin', 'saadhashmani'), 'fluentform' => __('Fluent Forms entries', 'saadhashmani')], __('Fluent Forms: create a form with fields names, email, message and inquiry_type, then save and pick it below.', 'saadhashmani')); ?>
<?php if ($fp === 'fluentform') :
    $forms = ['0' => __('— Select a form —', 'saadhashmani')];
    if (defined('FLUENTFORM')) {
        global $wpdb;
        foreach ((array) $wpdb->get_results("SELECT id, title FROM {$wpdb->prefix}fluentform_forms ORDER BY title ASC") as $f) $forms[(string) $f->id] = $f->title;
    }
    sh_field_select('contact.cf7_form_id', __('Fluent Forms form', 'saadhashmani'), (string) $ct['cf7_form_id'], $forms);
    if (!defined('FLUENTFORM')) echo '<p class="description">' . esc_html__('Fluent Forms is not active.', 'saadhashmani') . '</p>';
endif; ?>

<h3><?php esc_html_e('reCAPTCHA v3', 'saadhashmani'); ?></h3>
<div class="sh-grid">
<?php
sh_field_text('contact.recaptcha_site', __('Site key', 'saadhashmani'), $ct['recaptcha_site'], __('Leave empty to disable.', 'saadhashmani'));
sh_field_text('contact.recaptcha_secret', __('Secret key', 'saadhashmani'), $ct['recaptcha_secret'], __('Kept on the server; never sent to the browser.', 'saadhashmani'), 'password', 'autocomplete="off"');
?>
</div>
