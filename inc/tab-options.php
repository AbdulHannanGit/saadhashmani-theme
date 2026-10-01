<?php
defined('ABSPATH') || exit;
$o = $s['options'];
$color_tips = [
    'bg'          => __('Page background.', 'saadhashmani'),
    'bg_raised'   => __('Raised surfaces (gallery frames, cards).', 'saadhashmani'),
    'bg_inset'    => __('Inset areas behind images.', 'saadhashmani'),
    'tx'          => __('Primary text.', 'saadhashmani'),
    'tx_muted'    => __('Secondary text (descriptions, labels).', 'saadhashmani'),
    'tx_faint'    => __('Faint text (eyebrows, captions).', 'saadhashmani'),
    'glow'        => __('Highlight colour (name, numbers, buttons).', 'saadhashmani'),
    'line'        => __('Hairline borders.', 'saadhashmani'),
    'line_strong' => __('Stronger borders (buttons, cards).', 'saadhashmani'),
];
$q = ['480p' => '480p', '720p' => '720p', '1080p' => '1080p'];
?>
<h2><?php esc_html_e('Theme Options', 'saadhashmani'); ?></h2>

<h3><?php esc_html_e('Brand', 'saadhashmani'); ?></h3>
<?php sh_field_media('options.logo', __('Logo', 'saadhashmani'), $o['logo'], __('Header, menu and footer logo. WebP or PNG with transparency, at least 200px tall.', 'saadhashmani')); ?>

<h3><?php esc_html_e('Motion', 'saadhashmani'); ?></h3>
<?php
sh_field_check('options.gsap_desktop', __('GSAP motion on desktop', 'saadhashmani'), $o['gsap_desktop'], __('Section arrival animations (scrambled eyebrows, rising name, counting numbers). Adds ~90 KB, downloaded only when enabled. Screens wider than 768px.', 'saadhashmani'));
sh_field_check('options.gsap_mobile', __('GSAP motion on mobile', 'saadhashmani'), $o['gsap_mobile'], __('Same animations on phones (768px and narrower). Off by default to save data and battery.', 'saadhashmani'));
sh_field_check('options.animations', __('Animations', 'saadhashmani'), $o['animations'], __('Master switch. Off behaves like the visitor asked for reduced motion: no video transitions, no cursor, plain fades.', 'saadhashmani'));
sh_field_check('options.custom_cursor', __('Custom cursor', 'saadhashmani'), $o['custom_cursor'], __('Lens cursor on mouse devices wider than 768px.', 'saadhashmani'));
sh_field_check('options.preloader', __('Preloader', 'saadhashmani'), $o['preloader'], __('Intro screen with the name scramble while assets load.', 'saadhashmani'));
?>
<div class="sh-field sh-indent">
    <p class="description"><?php esc_html_e('The preloader waits for:', 'saadhashmani'); ?></p>
    <?php
    sh_field_check('options.preloader_assets.logo', __('Logo', 'saadhashmani'), $o['preloader_assets']['logo']);
    sh_field_check('options.preloader_assets.poster', __('Hero still', 'saadhashmani'), $o['preloader_assets']['poster']);
    sh_field_check('options.preloader_assets.video', __('Background video (heaviest; makes the first scroll seamless)', 'saadhashmani'), $o['preloader_assets']['video']);
    sh_field_check('options.preloader_assets.gallery', __('First venture gallery thumbnails', 'saadhashmani'), $o['preloader_assets']['gallery']);
    ?>
</div>

<h3><?php esc_html_e('Background video', 'saadhashmani'); ?></h3>
<?php
sh_field_select('options.video_quality', __('Quality on desktop', 'saadhashmani'), $o['video_quality'], $q, __('The visitor can override with ?quality=480|720|1080.', 'saadhashmani'));
sh_field_select('options.mobile_video_quality', __('Quality on mobile', 'saadhashmani'), $o['mobile_video_quality'], $q, __('Screens 768px and narrower.', 'saadhashmani'));
?>
<p class="description"><?php printf(esc_html__('The video files and clip timings are set in %s.', 'saadhashmani'), '<a href="' . esc_url(add_query_arg(['page' => 'sh-settings', 'tab' => 'sections', 'section' => 'hero'], admin_url('admin.php'))) . '">' . esc_html__('Sections > Hero', 'saadhashmani') . '</a>'); ?></p>

<h3><?php esc_html_e('Menu labels', 'saadhashmani'); ?></h3>
<div class="sh-grid">
<?php foreach (['Home', 'Journey', 'Ventures', 'Playbook', 'Podcast', 'Receipts', 'Contact'] as $i => $label) sh_field_text('options.nav.' . $i, sprintf('%02d · %s', $i, $label), $o['nav'][$i] ?? ''); ?>
</div>

<h3><?php esc_html_e('Colours', 'saadhashmani'); ?></h3>
<div class="sh-grid">
<?php foreach ($o['colors'] as $key => $val) sh_field_text('options.colors.' . $key, $key, $val, $color_tips[$key] ?? '', 'text', 'class="sh-color-input"'); ?>
</div>

<h3><?php esc_html_e('Fonts', 'saadhashmani'); ?></h3>
<?php
sh_field_text('options.fonts.grotesk_url', __('Fontshare stylesheet URL', 'saadhashmani'), $o['fonts']['grotesk_url'], __('Zodiak (headings) and General Sans (body). Skipped when both local fonts below are set.', 'saadhashmani'), 'url');
sh_field_text('options.fonts.google_url', __('Extra stylesheet URL (optional)', 'saadhashmani'), $o['fonts']['google_url'], __('Any additional font stylesheet, e.g. Google Fonts. Leave empty if unused.', 'saadhashmani'), 'url');
sh_field_media('options.fonts.local_heading', __('Self-hosted heading font (WOFF2)', 'saadhashmani'), $o['fonts']['local_heading'], __('Registered as Zodiak. Self-hosting removes the Fontshare request.', 'saadhashmani'));
sh_field_media('options.fonts.local_body', __('Self-hosted body font (WOFF2)', 'saadhashmani'), $o['fonts']['local_body'], __('Registered as General Sans.', 'saadhashmani'));
?>

<h3><?php esc_html_e('SEO', 'saadhashmani'); ?></h3>
<p class="description"><?php esc_html_e('Used on the front page when no SEO plugin (Yoast, Rank Math, AIOSEO, SEOPress, The SEO Framework) is active.', 'saadhashmani'); ?></p>
<?php
sh_field_text('seo.title', __('Page title', 'saadhashmani'), $s['seo']['title'], __('Browser tab and search result title.', 'saadhashmani'));
sh_field_textarea('seo.description', __('Meta description', 'saadhashmani'), $s['seo']['description'], __('About 150 characters. Also used for social shares.', 'saadhashmani'), 2);
sh_field_media('seo.og_image', __('Social share image', 'saadhashmani'), $s['seo']['og_image'], __('1200×630 recommended. Falls back to the hero still, then the logo.', 'saadhashmani'));
?>

<h3><?php esc_html_e('Demo Media Importer', 'saadhashmani'); ?></h3>
<div class="sh-field">
    <label for="sh-demo-url"><?php esc_html_e('Manifest URL', 'saadhashmani'); ?><?php echo sh_tip(__('manifest.json listing every demo file and the setting it belongs to.', 'saadhashmani')); ?></label>
    <input type="url" id="sh-demo-url" name="sh[options][demo_media_url]" value="<?php echo esc_attr($o['demo_media_url']); ?>" class="regular-text sh-wide">
</div>
<p class="description"><?php esc_html_e('Files already in the Media Library (same file contents) are reused, not downloaded again. Media fields in these settings are then pointed at the demo files; text is not changed.', 'saadhashmani'); ?></p>
<p><button type="button" id="sh-demo-import" class="button button-secondary"><?php esc_html_e('Import Demo Media', 'saadhashmani'); ?></button><span id="sh-demo-spinner" class="spinner"></span></p>
<div id="sh-demo-log" class="sh-demo-log" hidden></div>
