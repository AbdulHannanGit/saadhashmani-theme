<?php
/**
 * Small renderers for the settings screen. $path is the field's dot path
 * (e.g. "hero.first_name"), turned into sh[hero][first_name].
 */
defined('ABSPATH') || exit;

function sh_field_name($path) {
    $parts = explode('.', $path);
    return 'sh[' . implode('][', array_map('esc_attr', $parts)) . ']';
}

function sh_tip($tip) {
    return $tip ? ' <span class="sh-tooltip" data-tip="' . esc_attr($tip) . '">&#8505;</span>' : '';
}

function sh_field_text($path, $label, $value, $tip = '', $type = 'text', $attrs = '') {
    echo '<div class="sh-field"><label>' . esc_html($label) . sh_tip($tip) . '</label>';
    echo '<input type="' . esc_attr($type) . '" name="' . sh_field_name($path) . '" value="' . esc_attr($value) . '" class="regular-text sh-wide" ' . $attrs . '></div>';
}

function sh_field_textarea($path, $label, $value, $tip = '', $rows = 3) {
    echo '<div class="sh-field"><label>' . esc_html($label) . sh_tip($tip) . '</label>';
    echo '<textarea name="' . sh_field_name($path) . '" rows="' . (int) $rows . '" class="sh-wide">' . esc_textarea($value) . '</textarea></div>';
}

function sh_field_check($path, $label, $value, $tip = '') {
    $n = sh_field_name($path);
    echo '<div class="sh-field"><label class="sh-check"><input type="hidden" name="' . $n . '" value="0"><input type="checkbox" name="' . $n . '" value="1" ' . checked(!empty($value), true, false) . '> ' . esc_html($label) . sh_tip($tip) . '</label></div>';
}

function sh_field_select($path, $label, $value, $options, $tip = '') {
    echo '<div class="sh-field"><label>' . esc_html($label) . sh_tip($tip) . '</label><select name="' . sh_field_name($path) . '">';
    foreach ($options as $k => $l) echo '<option value="' . esc_attr($k) . '" ' . selected((string) $value, (string) $k, false) . '>' . esc_html($l) . '</option>';
    echo '</select></div>';
}

function sh_media_preview($id) {
    if (!$id || !is_numeric($id)) return '';
    if (wp_attachment_is_image((int) $id)) {
        $u = wp_get_attachment_image_url((int) $id, 'thumbnail');
        return $u ? '<img src="' . esc_url($u) . '" alt="">' : '';
    }
    $file = get_attached_file((int) $id);
    return $file ? '<code>' . esc_html(basename($file)) . '</code>' : '';
}

function sh_field_media($path, $label, $id, $tip = '', $type = '') {
    echo '<div class="sh-field"><label>' . esc_html($label) . sh_tip($tip) . '</label><div class="sh-media-field" data-type="' . esc_attr($type) . '">';
    echo '<input type="hidden" name="' . sh_field_name($path) . '" value="' . esc_attr(is_numeric($id) ? (int) $id : 0) . '" class="sh-media-id">';
    echo '<div class="sh-media-preview">' . sh_media_preview($id) . '</div>';
    echo '<button type="button" class="button sh-media-btn">' . esc_html__('Select', 'saadhashmani') . '</button> ';
    echo '<button type="button" class="button sh-media-remove">' . esc_html__('Remove', 'saadhashmani') . '</button></div></div>';
}

/** Attachment ID or external URL (videos). */
function sh_field_video($path, $label, $value, $tip = '') {
    $is_id = is_numeric($value) && (int) $value > 0;
    echo '<div class="sh-field"><label>' . esc_html($label) . sh_tip($tip) . '</label><div class="sh-video-field">';
    echo '<div class="sh-media-field" data-type="video"><input type="hidden" name="' . sh_field_name($path) . '" value="' . esc_attr($value) . '" class="sh-media-id sh-video-input">';
    echo '<div class="sh-media-preview">' . ($is_id ? sh_media_preview($value) : '') . '</div>';
    echo '<button type="button" class="button sh-media-btn">' . esc_html__('Select video', 'saadhashmani') . '</button> <button type="button" class="button sh-media-remove">' . esc_html__('Remove', 'saadhashmani') . '</button></div>';
    echo '<span class="sh-or">' . esc_html__('or', 'saadhashmani') . '</span><input type="url" class="regular-text sh-video-url" placeholder="https://…" value="' . esc_attr($is_id ? '' : $value) . '"></div></div>';
}

function sh_field_gallery($path, $label, $ids, $tip = '') {
    $ids = array_values(array_filter(array_map('intval', (array) $ids)));
    echo '<div class="sh-field"><label>' . esc_html($label) . sh_tip($tip) . '</label><div class="sh-gallery-field">';
    echo '<input type="hidden" name="' . sh_field_name($path) . '" value="' . esc_attr(implode(',', $ids)) . '" class="sh-gallery-ids">';
    echo '<div class="sh-gallery-preview">';
    foreach ($ids as $gid) echo '<span class="sh-gallery-thumb" data-id="' . (int) $gid . '">' . sh_media_preview($gid) . '<button type="button" class="sh-gallery-remove-img" aria-label="' . esc_attr__('Remove', 'saadhashmani') . '">&times;</button></span>';
    echo '</div><button type="button" class="button sh-gallery-btn">' . esc_html__('Add images', 'saadhashmani') . '</button></div></div>';
}

/** A repeater; each item is rendered by $render($index, $item, $item_path). */
function sh_repeater($path, $items, $render, $add_label, $item_label = '') {
    $group = str_replace('.', '-', $path);
    $items = array_values((array) $items);
    if (!$items) $items = [[]];
    echo '<div class="sh-repeater" data-group="' . esc_attr($group) . '">';
    foreach ($items as $i => $item) {
        echo '<div class="sh-repeater-item">';
        if ($item_label) echo '<h4 class="sh-item-title">' . esc_html($item_label) . ' <span class="sh-item-num">#' . ($i + 1) . '</span></h4>';
        $render($i, (array) $item, $path . '.' . $i);
        echo '<p><button type="button" class="button-link sh-repeater-remove">' . esc_html__('Remove', 'saadhashmani') . '</button></p></div>';
    }
    echo '</div><p><button type="button" class="button sh-repeater-add" data-group="' . esc_attr($group) . '">+ ' . esc_html($add_label) . '</button></p>';
}
