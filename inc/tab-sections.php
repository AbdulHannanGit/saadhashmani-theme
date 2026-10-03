<?php
defined('ABSPATH') || exit;
$subs = [
    'hero'            => __('Hero', 'saadhashmani'),
    'record'          => __('The Record', 'saadhashmani'),
    'ventures'        => __('Ventures', 'saadhashmani'),
    'playbook'        => __('The Playbook', 'saadhashmani'),
    'podcast'         => __('The Podcast', 'saadhashmani'),
    'receipts'        => __('The Receipts', 'saadhashmani'),
    'contact_section' => __('Contact', 'saadhashmani'),
];
$sub = sanitize_key($_GET['section'] ?? 'hero');
if (!isset($subs[$sub])) $sub = 'hero';
$platforms = ['google' => 'Google', 'instagram' => 'Instagram', 'facebook' => 'Facebook', 'tiktok' => 'TikTok', 'twitter' => 'X'];
?>
<input type="hidden" name="sh_current_section" value="<?php echo esc_attr($sub); ?>">
<h2><?php esc_html_e('Sections', 'saadhashmani'); ?></h2>
<nav class="sh-sub-tabs">
    <?php foreach ($subs as $slug => $label) : ?>
        <a href="<?php echo esc_url(add_query_arg(['page' => 'sh-settings', 'tab' => 'sections', 'section' => $slug], admin_url('admin.php'))); ?>" class="sh-sub-tab-link <?php echo $sub === $slug ? 'active' : ''; ?>"><?php echo esc_html($label); ?></a>
    <?php endforeach; ?>
</nav>
<div class="sh-sub-tab-content">
<?php
switch ($sub) :

case 'hero':
    $h = $s['hero'];
    echo '<h3>' . esc_html__('Hero', 'saadhashmani') . '</h3>';
    sh_field_text('hero.eyebrow', __('Eyebrow', 'saadhashmani'), $h['eyebrow'], __('Small line above the name.', 'saadhashmani'));
    echo '<div class="sh-grid">';
    sh_field_text('hero.first_name', __('First name', 'saadhashmani'), $h['first_name'], __('Bright half of the name; also used in "Connect with …".', 'saadhashmani'));
    sh_field_text('hero.last_name', __('Last name', 'saadhashmani'), $h['last_name']);
    echo '</div>';
    sh_field_text('hero.preloader_text', __('Preloader ring text', 'saadhashmani'), $h['preloader_text'], __('Repeated around the ring while loading. End with a separator so it loops cleanly.', 'saadhashmani'));
    sh_field_text('hero.scroll_text', __('Scroll ring text', 'saadhashmani'), $h['scroll_text']);
    sh_field_media('hero.poster', __('Hero still', 'saadhashmani'), $h['poster'], __('First frame of the background video (section 1 loop). Shown by the preloader and while the video loads.', 'saadhashmani'));
    echo '<h3>' . esc_html__('Background video', 'saadhashmani') . '</h3>';
    echo '<p class="description">' . esc_html__('One MP4 holding every clip in order: s0 t0 s1 t1 … s6 t6 (s = a section loop, t = the transition to the next section; t6 returns from Contact to the hero). Export the same video in three sizes.', 'saadhashmani') . '</p>';
    sh_field_video('hero.video_480', '480p', $h['video_480']);
    sh_field_video('hero.video_720', '720p', $h['video_720']);
    sh_field_video('hero.video_1080', '1080p', $h['video_1080']);
    sh_field_text('hero.clips', __('Clip lengths (seconds)', 'saadhashmani'), $h['clips'], __('14 numbers, comma separated, in file order: s0, t0, s1, t1 … s6, t6. Change only when the video is re-exported with different clip lengths.', 'saadhashmani'));
    break;

case 'record':
    $r = $s['record'];
    echo '<h3>' . esc_html__('The Record', 'saadhashmani') . '</h3>';
    sh_field_text('record.eyebrow', __('Eyebrow', 'saadhashmani'), $r['eyebrow']);
    sh_field_text('record.heading', __('Heading', 'saadhashmani'), $r['heading']);
    echo '<h4>' . esc_html__('Stats', 'saadhashmani') . '</h4>';
    sh_repeater('record.stats', $r['stats'], function ($i, $st, $p) {
        echo '<div class="sh-grid">';
        sh_field_text("$p.value", __('Value', 'saadhashmani'), $st['value'] ?? '');
        sh_field_text("$p.label", __('Label', 'saadhashmani'), $st['label'] ?? '');
        echo '</div>';
    }, __('Add stat', 'saadhashmani'));
    echo '<h4>' . esc_html__('Timeline', 'saadhashmani') . '</h4>';
    sh_repeater('record.timeline', $r['timeline'], function ($i, $m, $p) {
        echo '<div class="sh-grid">';
        sh_field_text("$p.y", __('Year(s)', 'saadhashmani'), $m['y'] ?? '');
        sh_field_text("$p.t", __('Title', 'saadhashmani'), $m['t'] ?? '');
        sh_field_text("$p.tag", __('Tag', 'saadhashmani'), $m['tag'] ?? '');
        echo '</div>';
        sh_field_media("$p.img", __('Image', 'saadhashmani'), $m['img'] ?? 0, __('Portrait, cropped to 512×640.', 'saadhashmani'));
        sh_field_textarea("$p.d", __('Story', 'saadhashmani'), $m['d'] ?? '', __('Shown in the milestone popup.', 'saadhashmani'), 4);
    }, __('Add milestone', 'saadhashmani'), __('Milestone', 'saadhashmani'));
    break;

case 'ventures':
    echo '<h3>' . esc_html__('Ventures', 'saadhashmani') . '</h3>';
    sh_repeater('ventures', $s['ventures'], function ($i, $v, $p) {
        sh_field_media("$p.logo", __('Logo', 'saadhashmani'), $v['logo'] ?? 0);
        echo '<div class="sh-grid">';
        sh_field_text("$p.eyebrow", __('Eyebrow', 'saadhashmani'), $v['eyebrow'] ?? '');
        sh_field_text("$p.title", __('Title', 'saadhashmani'), $v['title'] ?? '');
        sh_field_text("$p.cta_label", __('Button label', 'saadhashmani'), $v['cta_label'] ?? '');
        sh_field_text("$p.cta_url", __('Button link', 'saadhashmani'), $v['cta_url'] ?? '#', __('External URL opens in a new tab. Use # to scroll to the Contact section.', 'saadhashmani'));
        echo '</div>';
        sh_field_textarea("$p.description", __('Description', 'saadhashmani'), $v['description'] ?? '');
        echo '<h5>' . esc_html__('Stats', 'saadhashmani') . '</h5><div class="sh-grid">';
        for ($k = 0; $k < 4; $k++) {
            $st = $v['stats'][$k] ?? [];
            sh_field_text("$p.stats.$k.value", sprintf(__('Value %d', 'saadhashmani'), $k + 1), $st['value'] ?? '');
            sh_field_text("$p.stats.$k.label", sprintf(__('Label %d', 'saadhashmani'), $k + 1), $st['label'] ?? '');
        }
        echo '</div>';
        sh_field_gallery("$p.gallery", __('Gallery', 'saadhashmani'), $v['gallery'] ?? [], __('Square thumbnails in the slide; click opens the full image. Leave empty to hide.', 'saadhashmani'));
    }, __('Add venture', 'saadhashmani'), __('Venture', 'saadhashmani'));
    echo '<h3>' . esc_html__('Partners', 'saadhashmani') . '</h3><p class="description">' . esc_html__('Logo marquee shown on every venture slide. Height is the logo height in pixels so different artwork looks balanced.', 'saadhashmani') . '</p>';
    sh_repeater('partners', $s['partners'], function ($i, $pt, $p) {
        echo '<div class="sh-grid">';
        sh_field_media("$p.img", __('Logo', 'saadhashmani'), $pt['img'] ?? 0);
        sh_field_text("$p.name", __('Name (alt text)', 'saadhashmani'), $pt['name'] ?? '');
        sh_field_text("$p.h", __('Height (px)', 'saadhashmani'), $pt['h'] ?? 24, '', 'number', 'min="12" max="60"');
        echo '</div>';
    }, __('Add partner', 'saadhashmani'));
    break;

case 'playbook':
    $pb = $s['playbook'];
    echo '<h3>' . esc_html__('The Playbook', 'saadhashmani') . '</h3>';
    sh_field_text('playbook.eyebrow', __('Eyebrow', 'saadhashmani'), $pb['eyebrow']);
    sh_field_text('playbook.heading', __('Heading', 'saadhashmani'), $pb['heading']);
    sh_field_text('playbook.locked_count', __('Locked topics shown', 'saadhashmani'), $pb['locked_count'], __('How many principles (picked at random on each visit) appear on the wheel as locked topics next to the reels.', 'saadhashmani'), 'number', 'min="0" max="60"');
    echo '<p class="description">' . esc_html__('Phones show a shorter wheel: only the reels and principles ticked "Show on mobile" (20 by default, mixed open and locked). Desktop shows every reel plus the locked principles above.', 'saadhashmani') . '</p>';
    echo '<h4>' . esc_html__('Reels', 'saadhashmani') . '</h4><p class="description">' . esc_html__('Open topics: a 9:16 cover and the Instagram Reel ID (the part after /reel/ in the link).', 'saadhashmani') . '</p>';
    sh_repeater('playbook.reels', $pb['reels'], function ($i, $r, $p) {
        echo '<div class="sh-grid">';
        sh_field_text("$p.t", __('Title', 'saadhashmani'), $r['t'] ?? '');
        sh_field_text("$p.embed", __('Reel ID', 'saadhashmani'), $r['embed'] ?? '');
        sh_field_media("$p.img", __('Cover', 'saadhashmani'), $r['img'] ?? 0);
        echo '</div>';
        sh_field_check("$p.m", __('Show on mobile', 'saadhashmani'), sh_pb_on_mobile($r, 'reels'));
    }, __('Add reel', 'saadhashmani'));
    echo '<h4>' . esc_html__('Principles', 'saadhashmani') . '</h4><p class="description">' . esc_html__('Pool for the locked topics. Locked topics borrow a random reel cover.', 'saadhashmani') . '</p>';
    sh_repeater('playbook.principles', $pb['principles'], function ($i, $pr, $p) {
        sh_field_text("$p.t", __('Principle', 'saadhashmani'), $pr['t'] ?? '');
        sh_field_textarea("$p.d", __('Note (optional)', 'saadhashmani'), $pr['d'] ?? '', '', 2);
        sh_field_check("$p.m", __('Show on mobile (as a locked topic)', 'saadhashmani'), sh_pb_on_mobile($pr, 'principles'));
    }, __('Add principle', 'saadhashmani'));
    break;

case 'podcast':
    $pc = $s['podcast'];
    echo '<h3>' . esc_html__('The Podcast', 'saadhashmani') . '</h3>';
    sh_field_text('podcast.eyebrow', __('Eyebrow', 'saadhashmani'), $pc['eyebrow']);
    sh_repeater('podcast.episodes', $pc['episodes'], function ($i, $e, $p) {
        echo '<div class="sh-grid">';
        sh_field_text("$p.t", __('Title', 'saadhashmani'), $e['t'] ?? '');
        sh_field_text("$p.src", __('Show / source', 'saadhashmani'), $e['src'] ?? '');
        sh_field_text("$p.yt", __('YouTube ID', 'saadhashmani'), $e['yt'] ?? '', __('e.g. gz5yMEZzrsM from youtube.com/watch?v=gz5yMEZzrsM', 'saadhashmani'));
        echo '</div>';
        sh_field_textarea("$p.d", __('One-line description', 'saadhashmani'), $e['d'] ?? '', '', 2);
        echo '<div class="sh-grid">';
        sh_field_media("$p.thumb", __('Card (3:4)', 'saadhashmani'), $e['thumb'] ?? 0, __('Ring card, cropped to 544×700.', 'saadhashmani'));
        sh_field_media("$p.img", __('Player poster (16:9)', 'saadhashmani'), $e['img'] ?? 0);
        echo '</div>';
    }, __('Add episode', 'saadhashmani'), __('Episode', 'saadhashmani'));
    break;

case 'receipts':
    $rc = $s['receipts'];
    echo '<h3>' . esc_html__('The Receipts', 'saadhashmani') . '</h3>';
    sh_field_check('receipts.show_cards', __('Show testimonial cards', 'saadhashmani'), !empty($rc['show_cards']), __('Untick to hide the moving card strip; the heading, platform buttons and stats stay. Your cards are kept.', 'saadhashmani'));
    sh_field_text('receipts.eyebrow', __('Eyebrow', 'saadhashmani'), $rc['eyebrow']);
    sh_field_text('receipts.heading', __('Heading', 'saadhashmani'), $rc['heading']);
    echo '<h4>' . esc_html__('Stats per filter', 'saadhashmani') . '</h4>';
    foreach (array_merge(['all' => __('All (default view)', 'saadhashmani')], $platforms) as $key => $name) {
        echo '<fieldset class="sh-fieldset"><legend>' . esc_html($name) . '</legend><div class="sh-grid">';
        for ($k = 0; $k < 3; $k++) {
            $st = $rc['stats'][$key][$k] ?? ['', ''];
            sh_field_text("receipts.stats.$key.$k.0", sprintf(__('Value %d', 'saadhashmani'), $k + 1), $st[0] ?? '');
            sh_field_text("receipts.stats.$key.$k.1", sprintf(__('Label %d', 'saadhashmani'), $k + 1), $st[1] ?? '');
        }
        echo '</div></fieldset>';
    }
    echo '<h4>' . esc_html__('Filter button labels', 'saadhashmani') . '</h4><div class="sh-grid">';
    foreach ($platforms as $key => $name) sh_field_text("receipts.filter_labels.$key", $name, $rc['filter_labels'][$key] ?? '');
    echo '</div>';
    foreach (['left' => __('Left column', 'saadhashmani'), 'right' => __('Right column', 'saadhashmani')] as $side => $title) {
        echo '<h4>' . esc_html($title) . '</h4>';
        sh_repeater("receipts.testimonials_$side", $rc["testimonials_$side"], function ($i, $c, $p) use ($platforms) {
            echo '<div class="sh-grid">';
            sh_field_select("$p.platform", __('Platform', 'saadhashmani'), $c['platform'] ?? 'google', $platforms);
            sh_field_select("$p.stars", __('Stars', 'saadhashmani'), $c['stars'] ?? 5, [5 => '5', 4 => '4', 3 => '3', 2 => '2', 1 => '1']);
            sh_field_text("$p.name", __('Name', 'saadhashmani'), $c['name'] ?? '');
            sh_field_text("$p.role", __('Role', 'saadhashmani'), $c['role'] ?? '');
            echo '</div>';
            sh_field_textarea("$p.text", __('Quote', 'saadhashmani'), $c['text'] ?? '', '', 2);
            echo '<div class="sh-grid">';
            sh_field_media("$p.avatar", __('Avatar', 'saadhashmani'), $c['avatar'] ?? 0);
            sh_field_media("$p.media", __('Photo / video cover (optional)', 'saadhashmani'), $c['media'] ?? 0, __('16:9 image shown on top of the card.', 'saadhashmani'));
            sh_field_text("$p.yt", __('YouTube ID (optional)', 'saadhashmani'), $c['yt'] ?? '', __('Adds a play button that opens the video review.', 'saadhashmani'));
            echo '</div>';
        }, __('Add testimonial', 'saadhashmani'), __('Card', 'saadhashmani'));
    }
    break;

case 'contact_section':
    $ct = $s['contact'];
    echo '<h3>' . esc_html__('Contact', 'saadhashmani') . '</h3>';
    sh_field_text('contact.eyebrow', __('Eyebrow', 'saadhashmani'), $ct['eyebrow']);
    echo '<div class="sh-grid">';
    sh_field_text('contact.heading', __('Heading', 'saadhashmani'), $ct['heading']);
    sh_field_text('contact.heading_accent', __('Heading accent', 'saadhashmani'), $ct['heading_accent'], __('Shown after the heading in the faint colour.', 'saadhashmani'));
    echo '</div>';
    sh_field_textarea('contact.description', __('Description', 'saadhashmani'), $ct['description'], '', 2);
    echo '<h4>' . esc_html__('Enquiry types', 'saadhashmani') . '</h4>';
    sh_repeater('contact.form_types', $ct['form_types'], function ($i, $t, $p) {
        $val = is_array($t) ? (string) reset($t) : (string) $t;
        echo '<div class="sh-field"><input type="text" name="' . sh_field_name($p) . '" value="' . esc_attr($val) . '" class="regular-text"></div>';
    }, __('Add type', 'saadhashmani'));
    sh_field_text('contact.default_type', __('Selected by default', 'saadhashmani'), $ct['default_type'], __('Must match one of the types above.', 'saadhashmani'));
    break;
endswitch;
?>
</div>
