<?php if (!defined('ABSPATH')) exit;
$o = sh_get('options');
$colors = $o['colors'];
$color_tips = [
    'bg'          => 'Main background color of the site.',
    'bg_raised'   => 'Background for elevated surfaces (cards, modals).',
    'bg_inset'    => 'Background for inset/recessed areas.',
    'tx'          => 'Primary text color.',
    'tx_muted'    => 'Secondary/muted text (subtitles, captions).',
    'tx_faint'    => 'Faintest text (placeholders, disabled labels).',
    'glow'        => 'Glow/highlight accent color.',
    'line'        => 'Default border/divider line color.',
    'line_strong' => 'Stronger border/divider line color.',
];
?>

<h2>Theme Options</h2>

<!-- Logo -->
<div class="sh-field">
    <label>Logo <span class="sh-tooltip" data-tip="Upload your site logo. Recommended: WebP or PNG, transparent background, min 200px height.">&#8505;</span></label>
    <div class="sh-media-field">
        <input type="hidden" name="sh[options][logo]" value="<?php echo esc_attr($o['logo']); ?>" class="sh-media-id">
        <?php $logo_url = sh_img($o['logo'], 'medium'); ?>
        <div class="sh-media-preview"><?php if ($logo_url): ?><img src="<?php echo esc_url($logo_url); ?>"><?php endif; ?></div>
        <button type="button" class="button sh-media-btn">Upload</button>
        <button type="button" class="button sh-media-remove">Remove</button>
    </div>
</div>

<!-- Custom Cursor -->
<div class="sh-field">
    <label>
        <input type="hidden" name="sh[options][custom_cursor]" value="0">
        <input type="checkbox" name="sh[options][custom_cursor]" value="1" <?php checked($o['custom_cursor']); ?>>
        Custom Cursor <span class="sh-tooltip" data-tip="Enable/disable the custom lens cursor effect on desktop.">&#8505;</span>
    </label>
</div>

<!-- Preloader -->
<div class="sh-field">
    <label>
        <input type="hidden" name="sh[options][preloader]" value="0">
        <input type="checkbox" name="sh[options][preloader]" value="1" <?php checked($o['preloader']); ?>>
        Preloader <span class="sh-tooltip" data-tip="Enable/disable the loading screen with name scramble animation. When off, the page loads directly.">&#8505;</span>
    </label>
</div>

<!-- Animations -->
<div class="sh-field">
    <label>
        <input type="hidden" name="sh[options][animations]" value="0">
        <input type="checkbox" name="sh[options][animations]" value="1" <?php checked($o['animations']); ?>>
        Animations <span class="sh-tooltip" data-tip="Master toggle for all scroll animations and transitions.">&#8505;</span>
    </label>
</div>

<!-- Video Quality -->
<div class="sh-field">
    <label>Video Quality (Desktop) <span class="sh-tooltip" data-tip="Default background video quality on desktop. Visitors can change this via the on-page toggle.">&#8505;</span></label>
    <select name="sh[options][video_quality]">
        <?php foreach (['480p', '720p', '1080p'] as $q): ?>
            <option value="<?php echo $q; ?>" <?php selected($o['video_quality'], $q); ?>><?php echo $q; ?></option>
        <?php endforeach; ?>
    </select>
</div>

<!-- Mobile Video Quality -->
<div class="sh-field">
    <label>Video Quality (Mobile) <span class="sh-tooltip" data-tip="Video quality on mobile devices (under 768px). Lower quality saves bandwidth on cellular connections.">&#8505;</span></label>
    <select name="sh[options][mobile_video_quality]">
        <?php foreach (['480p', '720p', '1080p'] as $q): ?>
            <option value="<?php echo $q; ?>" <?php selected($o['mobile_video_quality'], $q); ?>><?php echo $q; ?></option>
        <?php endforeach; ?>
    </select>
</div>

<!-- Colors -->
<h3>Colors</h3>
<?php foreach ($colors as $key => $val): ?>
    <div class="sh-field sh-field-inline">
        <label><?php echo esc_html($key); ?> <span class="sh-tooltip" data-tip="<?php echo esc_attr($color_tips[$key] ?? ''); ?>">&#8505;</span></label>
        <input type="text" name="sh[options][colors][<?php echo esc_attr($key); ?>]" value="<?php echo esc_attr($val); ?>" class="sh-color-input">
    </div>
<?php endforeach; ?>

<!-- Font URLs -->
<h3>Fonts</h3>
<div class="sh-field">
    <label>Grotesk / Fontshare URL <span class="sh-tooltip" data-tip="Fontshare stylesheet URL for Cabinet Grotesk and General Sans.">&#8505;</span></label>
    <input type="url" name="sh[options][fonts][grotesk_url]" value="<?php echo esc_attr($o['fonts']['grotesk_url']); ?>" class="regular-text" style="width:100%">
</div>
<div class="sh-field">
    <label>Google Fonts URL <span class="sh-tooltip" data-tip="Google Fonts stylesheet URL for Anton, Space Grotesk, JetBrains Mono.">&#8505;</span></label>
    <input type="url" name="sh[options][fonts][google_url]" value="<?php echo esc_attr($o['fonts']['google_url']); ?>" class="regular-text" style="width:100%">
</div>

<!-- Demo Media Importer -->
<h3>Demo Media Importer</h3>
<div class="sh-field">
    <label>Manifest URL <span class="sh-tooltip" data-tip="URL to the demo media manifest.json file. Points to a GitHub repo with all demo images and videos.">&#8505;</span></label>
    <input type="url" id="sh-demo-url" value="<?php echo esc_url($o['demo_media_url']); ?>" class="regular-text" style="width:100%">
</div>
<div class="sh-field">
    <p class="description" style="margin-bottom:10px;color:#e74c3c"><strong>Warning:</strong> This will replace all current media references in theme settings with demo media.</p>
    <button type="button" id="sh-demo-import" class="button button-secondary">Import Demo Media</button>
    <span id="sh-demo-spinner" class="spinner" style="float:none;margin:0 8px"></span>
</div>
<div id="sh-demo-log" style="display:none;margin-top:12px;max-height:300px;overflow-y:auto;padding:12px 16px;border-radius:8px;background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.08);font-family:monospace;font-size:12px;line-height:1.8;color:#a1a1aa"></div>
