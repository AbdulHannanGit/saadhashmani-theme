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
<p class="description"><?php esc_html_e('The chat form keeps its look; on send, the message is handed to the plugin below, so its validation, spam checks, emails, entries and integrations all apply, and its error message is shown in the chat if it rejects one. With no plugin (or if the plugin or form is missing) the message is saved in the wp_sh_submissions table and emailed to the site admin.', 'saadhashmani'); ?></p>
<?php
sh_field_select('contact.form_plugin', __('Send to', 'saadhashmani'), $fp, ['' => __('Theme only (save + email to site admin)', 'saadhashmani'), 'cf7' => __('Contact Form 7', 'saadhashmani'), 'fluentform' => __('Fluent Forms', 'saadhashmani')]);

$cf7 = ['0' => __('— Select a form —', 'saadhashmani')];
if (function_exists('wpcf7_contact_form')) foreach (get_posts(['post_type' => 'wpcf7_contact_form', 'numberposts' => 200, 'orderby' => 'title', 'order' => 'ASC']) as $f) $cf7[(string) $f->ID] = $f->post_title;
$ff = ['0' => __('— Select a form —', 'saadhashmani')];
if (defined('FLUENTFORM')) { global $wpdb; foreach ((array) $wpdb->get_results("SELECT id, title FROM {$wpdb->prefix}fluentform_forms ORDER BY title ASC") as $f) $ff[(string) $f->id] = $f->title; }
$ff_id = (int) (($ct['ff_form_id'] ?? 0) ?: ($fp === 'fluentform' ? ($ct['cf7_form_id'] ?? 0) : 0));
echo '<div class="sh-grid">';
sh_field_select('contact.cf7_form_id', __('Contact Form 7 form', 'saadhashmani'), (string) $ct['cf7_form_id'], $cf7, function_exists('wpcf7_contact_form') ? '' : __('Contact Form 7 is not active.', 'saadhashmani'));
sh_field_select('contact.ff_form_id', __('Fluent Forms form', 'saadhashmani'), (string) $ff_id, $ff, defined('FLUENTFORM') ? '' : __('Fluent Forms is not active.', 'saadhashmani'));
echo '</div>';
$target = function_exists('sh_contact_target') ? sh_contact_target() : null;
if ($fp && !$target) echo '<div class="notice notice-warning inline"><p>' . esc_html__('The selected plugin is not active or no form is selected: messages are saved and emailed by the theme until this is fixed.', 'saadhashmani') . '</p></div>';
?>
<h4><?php esc_html_e('Form field names', 'saadhashmani'); ?></h4>
<p class="description"><?php esc_html_e('The field names in your plugin form that receive each chat answer. Leave empty for the default shown; enter - to not send that answer. Contact Form 7: the name in the tag, e.g. [email* your-email]. Fluent Forms: the field\'s "Name Attribute", e.g. names[first_name] for the first-name part of a Name field. Attachment: a CF7 [file] field gets the file itself; any other field gets a link to it; empty adds the link to the message. Keep any other required fields out of the form, or the plugin will reject the message.', 'saadhashmani'); ?></p>
<div class="sh-grid">
<?php
$ph = $fp === 'fluentform' ? ['name' => 'names[first_name]', 'email' => 'email', 'message' => 'message', 'type' => 'subject', 'attachment' => __('(added to message)', 'saadhashmani')]
                           : ['name' => 'your-name', 'email' => 'your-email', 'message' => 'your-message', 'type' => 'your-subject', 'attachment' => __('(added to message)', 'saadhashmani')];
$labels = ['name' => __('Name', 'saadhashmani'), 'email' => __('Email', 'saadhashmani'), 'message' => __('Message', 'saadhashmani'), 'type' => __('Inquiry type', 'saadhashmani'), 'attachment' => __('Attachment', 'saadhashmani')];
foreach ($labels as $k => $label) sh_field_text("contact.fields.$k", $label, $ct['fields'][$k] ?? '', '', 'text', 'placeholder="' . esc_attr($ph[$k]) . '"');
?>
</div>

<h3><?php esc_html_e('reCAPTCHA v3', 'saadhashmani'); ?></h3>
<?php
$keys = function_exists('sh_recaptcha_keys') ? sh_recaptcha_keys() : ['site' => '', 'secret' => '', 'source' => ''];
if ($keys['site'] === '') $status = __('Off. Enter keys below, or add reCAPTCHA v3 keys in your form plugin (Contact Form 7 → Integration, or Fluent Forms → Global Settings → reCAPTCHA, version v3) and they are used automatically.', 'saadhashmani');
elseif ($keys['secret'] !== '') $status = __('On. Every message is verified (score, action and site) before it is handed to the form plugin; the plugin\'s own reCAPTCHA step is skipped for it, its other spam checks still run.', 'saadhashmani');
else $status = __('Not protected: a site key is set but no secret key. Add the secret key below.', 'saadhashmani');
if ($keys['source'] && $keys['source'] !== 'theme') $status .= ' ' . __('Using the keys from your form plugin.', 'saadhashmani');
echo '<p class="description"><strong>' . esc_html__('Status:', 'saadhashmani') . '</strong> ' . esc_html($status) . '</p>';
?>
<div class="sh-grid">
<?php
sh_field_text('contact.recaptcha_site', __('Site key', 'saadhashmani'), $ct['recaptcha_site'], __('Optional when your form plugin already has reCAPTCHA v3 keys.', 'saadhashmani'));
sh_field_text('contact.recaptcha_secret', __('Secret key', 'saadhashmani'), $ct['recaptcha_secret'], __('Kept on the server; never sent to the browser.', 'saadhashmani'), 'password', 'autocomplete="off"');
sh_field_text('contact.recaptcha_score', __('Minimum score', 'saadhashmani'), $ct['recaptcha_score'] ?? 0.5, __('0.0 (allow all) to 1.0 (strict). 0.5 is Google\'s recommendation. Used when the theme verifies.', 'saadhashmani'), 'number', 'min="0" max="1" step="0.1"');
?>
</div>
