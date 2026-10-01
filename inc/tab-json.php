<?php
defined('ABSPATH') || exit;
$json = wp_json_encode(sh_settings(true), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
?>
<h2><?php esc_html_e('Master JSON Editor', 'saadhashmani'); ?></h2>
<div class="notice notice-warning inline"><p><?php esc_html_e('Saving this tab replaces every setting with the JSON below. Use Download first to keep a backup. Media fields hold attachment IDs from this site.', 'saadhashmani'); ?></p></div>
<div class="sh-json-editor"><textarea name="sh_json" id="sh-json-textarea" spellcheck="false"><?php echo esc_textarea($json); ?></textarea></div>
<p>
    <button type="button" class="button" id="sh-json-download"><?php esc_html_e('Download JSON', 'saadhashmani'); ?></button>
    <button type="button" class="button" id="sh-json-upload-btn"><?php esc_html_e('Load JSON file', 'saadhashmani'); ?></button>
    <input type="file" id="sh-json-upload" accept=".json,application/json" hidden>
</p>
