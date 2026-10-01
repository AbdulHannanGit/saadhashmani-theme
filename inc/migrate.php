<?php
/**
 * One-time upgrade of saved settings from the 2.x build to the 3.x (new UI) schema.
 * Values the site owner changed are kept; values still equal to the old defaults are
 * dropped so the new defaults apply.
 */
defined('ABSPATH') || exit;

function sh_migrate_to_3(array $s) {
    $unset_if = function (&$arr, $key, $old) {
        if (isset($arr[$key]) && $arr[$key] === $old) unset($arr[$key]);
    };

    // Typography and palette moved to Zodiak + warm text tones.
    if (isset($s['options']['fonts'])) {
        $unset_if($s['options']['fonts'], 'grotesk_url', 'https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,700,800&f[]=general-sans@400,500,600&display=swap');
        $unset_if($s['options']['fonts'], 'google_url', 'https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
    }
    if (isset($s['options']['colors'])) {
        foreach (['tx' => '#f4f4f5', 'tx_muted' => '#a1a1aa', 'tx_faint' => '#6b6b73'] as $k => $old) $unset_if($s['options']['colors'], $k, $old);
    }

    // The new background video has a different clip layout; the old files cannot be time-sliced with it.
    foreach (['video_480', 'video_720', 'video_1080', 'poster', 'gate_message'] as $k) unset($s['hero'][$k]);

    // Playbook: reels (video topics) and text principles are now separate lists.
    if (isset($s['playbook']['principles']) && is_array($s['playbook']['principles'])) {
        $reels = [];
        foreach ($s['playbook']['principles'] as $p) {
            if (is_array($p) && !empty($p['embed'])) $reels[] = ['t' => $p['t'] ?? '', 'img' => (int) ($p['img'] ?? 0), 'embed' => $p['embed']];
        }
        if ($reels) $s['playbook']['reels'] = $reels;
        unset($s['playbook']['principles']);
    }

    // Partners are shared by every venture slide in the new UI.
    if (!isset($s['partners']) && !empty($s['ventures'][0]['partners'])) {
        $heights = wp_list_pluck(sh_defaults()['partners'], 'h');
        $ids = array_values(array_filter(array_map('intval', (array) $s['ventures'][0]['partners'])));
        $s['partners'] = [];
        foreach ($ids as $i => $id) $s['partners'][] = ['img' => $id, 'h' => count($ids) === count($heights) ? $heights[$i] : 24, 'name' => ''];
    }
    if (isset($s['ventures']) && is_array($s['ventures'])) {
        foreach ($s['ventures'] as &$v) {
            if (is_array($v)) unset($v['partners']);
        }
        unset($v);
    }

    // Video testimonials now have their own cover image.
    foreach (['testimonials_left', 'testimonials_right'] as $side) {
        if (empty($s['receipts'][$side]) || !is_array($s['receipts'][$side])) continue;
        foreach ($s['receipts'][$side] as &$c) {
            if (is_array($c) && !empty($c['yt']) && empty($c['media'])) $c['media'] = (int) ($c['avatar'] ?? 0);
        }
        unset($c);
    }
    if (isset($s['receipts'])) {
        $unset_if($s['receipts'], 'heading', 'Word Of Mouth');
    }
    if (isset($s['contact'])) {
        $unset_if($s['contact'], 'heading', 'Build Something Meaningful.');
    }

    unset($s['collage']);
    return $s;
}

function sh_maybe_migrate() {
    $version = (int) get_option('sh_schema_version', 0);
    if ($version >= SH_SCHEMA) return;
    $saved = get_option('sh_settings', null);
    if (is_array($saved) && $saved && $version < 3) {
        update_option('sh_settings_backup_v2', $saved, false);
        update_option('sh_settings', sh_migrate_to_3($saved));
        sh_settings(true);
    }
    if (function_exists('sh_install_submissions_table')) sh_install_submissions_table();
    update_option('sh_schema_version', SH_SCHEMA);
}
add_action('init', 'sh_maybe_migrate', 1);
add_action('after_switch_theme', 'sh_maybe_migrate');
