<?php if (!defined('ABSPATH')) exit;
$json = json_encode(sh_get(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
?>

<h2>Master JSON Editor</h2>

<div class="notice notice-warning" style="margin-bottom:16px">
    <p><strong>Warning:</strong> Editing this JSON overwrites all individual tab settings. Changes take effect after saving.</p>
</div>

<div class="sh-json-editor">
    <textarea name="sh_json" id="sh-json-textarea"><?php echo esc_textarea($json); ?></textarea>
</div>

<p style="margin-top:12px">
    <button type="button" class="button" id="sh-json-download">Download JSON</button>
    <button type="button" class="button" id="sh-json-upload-btn">Upload JSON</button>
    <input type="file" id="sh-json-upload" accept=".json" style="display:none">
</p>
