<?php if (!defined('ABSPATH')) exit;

$sub = isset($_GET['section']) ? sanitize_text_field($_GET['section']) : 'hero';
$subs = [
    'hero'     => 'Hero',
    'record'   => 'The Record',
    'ventures' => 'Ventures',
    'playbook' => 'The Playbook',
    'podcast'  => 'The Podcast',
    'receipts' => 'The Receipts',
    'contact_section' => 'Contact',
];
?>

<h2>Sections</h2>

<nav class="sh-sub-tabs">
    <?php foreach ($subs as $slug => $label): ?>
        <a href="<?php echo admin_url('admin.php?page=sh-settings&tab=sections&section=' . $slug); ?>"
           class="sh-sub-tab-link <?php echo $sub === $slug ? 'active' : ''; ?>">
            <?php echo esc_html($label); ?>
        </a>
    <?php endforeach; ?>
</nav>

<div class="sh-sub-tab-content">
<?php
// ── Hero ──
if ($sub === 'hero'):
    $h = sh_get('hero');
?>
    <h3>Hero Section</h3>
    <?php foreach (['eyebrow' => 'Eyebrow text above the name.', 'first_name' => 'First name displayed large.', 'last_name' => 'Last name displayed large.', 'preloader_text' => 'Marquee text shown during page preload.', 'scroll_text' => 'Marquee text shown on the scroll gate.', 'gate_message' => 'Message shown on mobile/tablet gate overlay.'] as $key => $tip): ?>
    <div class="sh-field">
        <label><?php echo ucwords(str_replace('_', ' ', $key)); ?> <span class="sh-tooltip" data-tip="<?php echo esc_attr($tip); ?>">&#8505;</span></label>
        <input type="text" name="sh[hero][<?php echo $key; ?>]" value="<?php echo esc_attr($h[$key]); ?>" class="regular-text" style="width:100%">
    </div>
    <?php endforeach; ?>

    <!-- Poster -->
    <div class="sh-field">
        <label>Poster Image <span class="sh-tooltip" data-tip="Fallback poster image shown before video loads.">&#8505;</span></label>
        <div class="sh-media-field">
            <input type="hidden" name="sh[hero][poster]" value="<?php echo esc_attr($h['poster']); ?>" class="sh-media-id">
            <div class="sh-media-preview"><?php if ($u = sh_img($h['poster'], 'medium')): ?><img src="<?php echo esc_url($u); ?>"><?php endif; ?></div>
            <button type="button" class="button sh-media-btn">Upload</button>
            <button type="button" class="button sh-media-remove">Remove</button>
        </div>
    </div>

    <!-- Videos -->
    <?php foreach (['video_480' => '480p video', 'video_720' => '720p video', 'video_1080' => '1080p video'] as $vk => $vl): ?>
    <div class="sh-field">
        <label><?php echo $vl; ?> <span class="sh-tooltip" data-tip="Background video at <?php echo $vl; ?>. Upload or paste an external URL.">&#8505;</span></label>
        <div class="sh-video-field">
            <div class="sh-media-field">
                <input type="hidden" name="sh[hero][<?php echo $vk; ?>]" value="<?php echo esc_attr($h[$vk]); ?>" class="sh-media-id sh-video-input">
                <button type="button" class="button sh-media-btn sh-video-upload-btn">Upload</button>
                <button type="button" class="button sh-media-remove">Remove</button>
            </div>
            <span style="margin:0 8px">or</span>
            <input type="url" class="regular-text sh-video-url" placeholder="External URL" value="<?php echo esc_attr(is_numeric($h[$vk]) ? '' : $h[$vk]); ?>" style="width:50%">
        </div>
    </div>
    <?php endforeach; ?>

<?php
// ── The Record ──
elseif ($sub === 'record'):
    $r = sh_get('record');
?>
    <h3>The Record</h3>
    <div class="sh-field">
        <label>Eyebrow <span class="sh-tooltip" data-tip="Small label above the section heading.">&#8505;</span></label>
        <input type="text" name="sh[record][eyebrow]" value="<?php echo esc_attr($r['eyebrow']); ?>" class="regular-text">
    </div>
    <div class="sh-field">
        <label>Heading <span class="sh-tooltip" data-tip="Main heading for The Record section.">&#8505;</span></label>
        <input type="text" name="sh[record][heading]" value="<?php echo esc_attr($r['heading']); ?>" class="regular-text" style="width:100%">
    </div>

    <h4>Stats</h4>
    <?php for ($i = 0; $i < 4; $i++): $s = $r['stats'][$i] ?? ['value' => '', 'label' => '']; ?>
    <div class="sh-field sh-field-inline">
        <input type="text" name="sh[record][stats][<?php echo $i; ?>][value]" value="<?php echo esc_attr($s['value']); ?>" placeholder="Value" style="width:120px">
        <input type="text" name="sh[record][stats][<?php echo $i; ?>][label]" value="<?php echo esc_attr($s['label']); ?>" placeholder="Label" style="width:200px">
    </div>
    <?php endfor; ?>

    <h4>Timeline <span class="sh-tooltip" data-tip="Milestones displayed on the timeline.">&#8505;</span></h4>
    <div class="sh-repeater" data-group="record-timeline">
        <?php foreach ($r['timeline'] as $i => $m): ?>
        <div class="sh-repeater-item">
            <div class="sh-field sh-field-inline">
                <input type="text" name="sh[record][timeline][<?php echo $i; ?>][y]" value="<?php echo esc_attr($m['y']); ?>" placeholder="Year" style="width:120px">
                <input type="text" name="sh[record][timeline][<?php echo $i; ?>][t]" value="<?php echo esc_attr($m['t']); ?>" placeholder="Title" style="width:200px">
                <input type="text" name="sh[record][timeline][<?php echo $i; ?>][tag]" value="<?php echo esc_attr($m['tag']); ?>" placeholder="Tag" style="width:120px">
            </div>
            <div class="sh-field">
                <label>Image <span class="sh-tooltip" data-tip="Timeline milestone image.">&#8505;</span></label>
                <div class="sh-media-field">
                    <input type="hidden" name="sh[record][timeline][<?php echo $i; ?>][img]" value="<?php echo esc_attr($m['img']); ?>" class="sh-media-id">
                    <div class="sh-media-preview"><?php if ($u = sh_img($m['img'], 'thumbnail')): ?><img src="<?php echo esc_url($u); ?>"><?php endif; ?></div>
                    <button type="button" class="button sh-media-btn">Upload</button>
                    <button type="button" class="button sh-media-remove">Remove</button>
                </div>
            </div>
            <div class="sh-field">
                <label>Description</label>
                <textarea name="sh[record][timeline][<?php echo $i; ?>][d]" rows="3" style="width:100%"><?php echo esc_textarea($m['d']); ?></textarea>
            </div>
            <button type="button" class="button sh-repeater-remove">Remove Milestone</button>
            <hr>
        </div>
        <?php endforeach; ?>
    </div>
    <button type="button" class="button sh-repeater-add" data-group="record-timeline">+ Add Milestone</button>

<?php
// ── Ventures ──
elseif ($sub === 'ventures'):
    $ventures = sh_get('ventures');
?>
    <h3>Ventures</h3>
    <div class="sh-repeater" data-group="ventures">
        <?php foreach ($ventures as $vi => $v): ?>
        <div class="sh-repeater-item">
            <h4>Venture #<?php echo $vi + 1; ?></h4>
            <div class="sh-field">
                <label>Logo <span class="sh-tooltip" data-tip="Venture logo image.">&#8505;</span></label>
                <div class="sh-media-field">
                    <input type="hidden" name="sh[ventures][<?php echo $vi; ?>][logo]" value="<?php echo esc_attr($v['logo']); ?>" class="sh-media-id">
                    <div class="sh-media-preview"><?php if ($u = sh_img($v['logo'], 'thumbnail')): ?><img src="<?php echo esc_url($u); ?>"><?php endif; ?></div>
                    <button type="button" class="button sh-media-btn">Upload</button>
                    <button type="button" class="button sh-media-remove">Remove</button>
                </div>
            </div>
            <?php foreach (['eyebrow' => 'Venture category tags.', 'title' => 'Venture name.', 'cta_label' => 'Call-to-action button text.', 'cta_url' => 'Call-to-action link URL.'] as $fk => $ft): ?>
            <div class="sh-field">
                <label><?php echo ucwords(str_replace('_', ' ', $fk)); ?> <span class="sh-tooltip" data-tip="<?php echo esc_attr($ft); ?>">&#8505;</span></label>
                <input type="text" name="sh[ventures][<?php echo $vi; ?>][<?php echo $fk; ?>]" value="<?php echo esc_attr($v[$fk]); ?>" class="regular-text" style="width:100%">
            </div>
            <?php endforeach; ?>
            <div class="sh-field">
                <label>Description <span class="sh-tooltip" data-tip="Venture description paragraph.">&#8505;</span></label>
                <textarea name="sh[ventures][<?php echo $vi; ?>][description]" rows="3" style="width:100%"><?php echo esc_textarea($v['description']); ?></textarea>
            </div>

            <h5>Stats</h5>
            <?php for ($si = 0; $si < 4; $si++): $st = $v['stats'][$si] ?? ['value' => '', 'label' => '']; ?>
            <div class="sh-field sh-field-inline">
                <input type="text" name="sh[ventures][<?php echo $vi; ?>][stats][<?php echo $si; ?>][value]" value="<?php echo esc_attr($st['value']); ?>" placeholder="Value" style="width:120px">
                <input type="text" name="sh[ventures][<?php echo $vi; ?>][stats][<?php echo $si; ?>][label]" value="<?php echo esc_attr($st['label']); ?>" placeholder="Label" style="width:200px">
            </div>
            <?php endfor; ?>

            <div class="sh-field">
                <label>Gallery <span class="sh-tooltip" data-tip="Venture gallery images. Select multiple.">&#8505;</span></label>
                <div class="sh-gallery-field">
                    <input type="hidden" name="sh[ventures][<?php echo $vi; ?>][gallery]" value="<?php echo esc_attr(implode(',', $v['gallery'])); ?>" class="sh-gallery-ids">
                    <div class="sh-gallery-preview">
                        <?php foreach ($v['gallery'] as $gid): if ($gu = sh_img($gid, 'thumbnail')): ?>
                            <span class="sh-gallery-thumb" data-id="<?php echo $gid; ?>"><img src="<?php echo esc_url($gu); ?>"><button type="button" class="sh-gallery-remove-img">&times;</button></span>
                        <?php endif; endforeach; ?>
                    </div>
                    <button type="button" class="button sh-gallery-btn">Add Images</button>
                </div>
            </div>

            <div class="sh-field">
                <label>Partners <span class="sh-tooltip" data-tip="Partner logos. Select multiple.">&#8505;</span></label>
                <div class="sh-gallery-field">
                    <input type="hidden" name="sh[ventures][<?php echo $vi; ?>][partners]" value="<?php echo esc_attr(implode(',', $v['partners'])); ?>" class="sh-gallery-ids">
                    <div class="sh-gallery-preview">
                        <?php foreach ($v['partners'] as $pid): if ($pu = sh_img($pid, 'thumbnail')): ?>
                            <span class="sh-gallery-thumb" data-id="<?php echo $pid; ?>"><img src="<?php echo esc_url($pu); ?>"><button type="button" class="sh-gallery-remove-img">&times;</button></span>
                        <?php endif; endforeach; ?>
                    </div>
                    <button type="button" class="button sh-gallery-btn">Add Images</button>
                </div>
            </div>

            <button type="button" class="button sh-repeater-remove">Remove Venture</button>
            <hr>
        </div>
        <?php endforeach; ?>
    </div>
    <button type="button" class="button sh-repeater-add" data-group="ventures">+ Add Venture</button>

<?php
// ── The Playbook ──
elseif ($sub === 'playbook'):
    $pb = sh_get('playbook');
?>
    <h3>The Playbook</h3>
    <div class="sh-field">
        <label>Eyebrow <span class="sh-tooltip" data-tip="Small label above the section heading.">&#8505;</span></label>
        <input type="text" name="sh[playbook][eyebrow]" value="<?php echo esc_attr($pb['eyebrow']); ?>" class="regular-text">
    </div>
    <div class="sh-field">
        <label>Heading <span class="sh-tooltip" data-tip="Main heading for the Playbook section.">&#8505;</span></label>
        <input type="text" name="sh[playbook][heading]" value="<?php echo esc_attr($pb['heading']); ?>" class="regular-text" style="width:100%">
    </div>

    <h4>Principles <span class="sh-tooltip" data-tip="Each principle has a title, description, open/locked toggle, thumbnail image, and optional Instagram Reel ID for the embed popup.">&#8505;</span></h4>
    <div class="sh-repeater" data-group="playbook-principles">
        <?php foreach ($pb['principles'] as $pi => $p): ?>
        <div class="sh-repeater-item">
            <div class="sh-field sh-field-inline">
                <input type="text" name="sh[playbook][principles][<?php echo $pi; ?>][t]" value="<?php echo esc_attr($p['t']); ?>" placeholder="Title" style="width:50%">
                <label style="margin-left:12px">
                    <input type="hidden" name="sh[playbook][principles][<?php echo $pi; ?>][open]" value="0">
                    <input type="checkbox" name="sh[playbook][principles][<?php echo $pi; ?>][open]" value="1" <?php checked(!empty($p['open'])); ?>> Open
                </label>
                <input type="text" name="sh[playbook][principles][<?php echo $pi; ?>][embed]" value="<?php echo esc_attr($p['embed'] ?? ''); ?>" placeholder="Reel ID (e.g. DddfD5cRyky)" style="width:25%;margin-left:8px">
            </div>
            <div class="sh-field">
                <textarea name="sh[playbook][principles][<?php echo $pi; ?>][d]" rows="2" style="width:100%" placeholder="Description"><?php echo esc_textarea($p['d']); ?></textarea>
            </div>
            <div class="sh-field">
                <label>Thumbnail</label>
                <div class="sh-media-field">
                    <input type="hidden" name="sh[playbook][principles][<?php echo $pi; ?>][img]" value="<?php echo esc_attr($p['img'] ?? 0); ?>" class="sh-media-id">
                    <div class="sh-media-preview"><?php if ($u = sh_img($p['img'] ?? 0, 'thumbnail')): ?><img src="<?php echo esc_url($u); ?>"><?php endif; ?></div>
                    <button type="button" class="button sh-media-btn">Upload</button>
                    <button type="button" class="button sh-media-remove">Remove</button>
                </div>
            </div>
            <button type="button" class="button sh-repeater-remove">Remove</button>
        </div>
        <?php endforeach; ?>
    </div>
    <button type="button" class="button sh-repeater-add" data-group="playbook-principles">+ Add Principle</button>

<?php
// ── The Podcast ──
elseif ($sub === 'podcast'):
    $pc = sh_get('podcast');
?>
    <h3>The Podcast</h3>
    <div class="sh-field">
        <label>Eyebrow <span class="sh-tooltip" data-tip="Small label above the podcast section.">&#8505;</span></label>
        <input type="text" name="sh[podcast][eyebrow]" value="<?php echo esc_attr($pc['eyebrow']); ?>" class="regular-text">
    </div>

    <h4>Episodes</h4>
    <div class="sh-repeater" data-group="podcast-episodes">
        <?php foreach ($pc['episodes'] as $ei => $ep): ?>
        <div class="sh-repeater-item">
            <div class="sh-field sh-field-inline">
                <input type="text" name="sh[podcast][episodes][<?php echo $ei; ?>][t]" value="<?php echo esc_attr($ep['t']); ?>" placeholder="Title" style="width:40%">
                <input type="text" name="sh[podcast][episodes][<?php echo $ei; ?>][src]" value="<?php echo esc_attr($ep['src']); ?>" placeholder="Source" style="width:30%">
                <input type="text" name="sh[podcast][episodes][<?php echo $ei; ?>][yt]" value="<?php echo esc_attr($ep['yt']); ?>" placeholder="YouTube ID" style="width:20%">
                <span class="sh-tooltip" data-tip="YouTube video ID, e.g. gz5yMEZzrsM">&#8505;</span>
            </div>
            <div class="sh-field">
                <textarea name="sh[podcast][episodes][<?php echo $ei; ?>][d]" rows="2" style="width:100%" placeholder="Description"><?php echo esc_textarea($ep['d']); ?></textarea>
            </div>
            <div class="sh-field sh-field-inline">
                <div class="sh-media-field" style="margin-right:20px">
                    <label>Main Image <span class="sh-tooltip" data-tip="Full-size episode image.">&#8505;</span></label>
                    <input type="hidden" name="sh[podcast][episodes][<?php echo $ei; ?>][img]" value="<?php echo esc_attr($ep['img']); ?>" class="sh-media-id">
                    <div class="sh-media-preview"><?php if ($u = sh_img($ep['img'], 'thumbnail')): ?><img src="<?php echo esc_url($u); ?>"><?php endif; ?></div>
                    <button type="button" class="button sh-media-btn">Upload</button>
                    <button type="button" class="button sh-media-remove">Remove</button>
                </div>
                <div class="sh-media-field">
                    <label>Thumbnail <span class="sh-tooltip" data-tip="Small thumbnail for carousel card, ideally 544x700px.">&#8505;</span></label>
                    <input type="hidden" name="sh[podcast][episodes][<?php echo $ei; ?>][thumb]" value="<?php echo esc_attr($ep['thumb']); ?>" class="sh-media-id">
                    <div class="sh-media-preview"><?php if ($u = sh_img($ep['thumb'], 'thumbnail')): ?><img src="<?php echo esc_url($u); ?>"><?php endif; ?></div>
                    <button type="button" class="button sh-media-btn">Upload</button>
                    <button type="button" class="button sh-media-remove">Remove</button>
                </div>
            </div>
            <button type="button" class="button sh-repeater-remove">Remove Episode</button>
            <hr>
        </div>
        <?php endforeach; ?>
    </div>
    <button type="button" class="button sh-repeater-add" data-group="podcast-episodes">+ Add Episode</button>

<?php
// ── The Receipts ──
elseif ($sub === 'receipts'):
    $rc = sh_get('receipts');
?>
    <h3>The Receipts</h3>
    <div class="sh-field">
        <label>Eyebrow <span class="sh-tooltip" data-tip="Small label above the section heading.">&#8505;</span></label>
        <input type="text" name="sh[receipts][eyebrow]" value="<?php echo esc_attr($rc['eyebrow']); ?>" class="regular-text">
    </div>
    <div class="sh-field">
        <label>Heading <span class="sh-tooltip" data-tip="Main heading for the Receipts section.">&#8505;</span></label>
        <input type="text" name="sh[receipts][heading]" value="<?php echo esc_attr($rc['heading']); ?>" class="regular-text" style="width:100%">
    </div>

    <h4>Platform Stats <span class="sh-tooltip" data-tip="Stats shown per platform filter.">&#8505;</span></h4>
    <?php foreach ($rc['stats'] as $platform => $stats_arr): ?>
    <fieldset style="border:1px solid #333;padding:12px;margin-bottom:12px">
        <legend><strong><?php echo esc_html(ucfirst($platform)); ?></strong></legend>
        <?php for ($si = 0; $si < count($stats_arr); $si++): $s = $stats_arr[$si]; ?>
        <div class="sh-field sh-field-inline">
            <input type="text" name="sh[receipts][stats][<?php echo $platform; ?>][<?php echo $si; ?>][0]" value="<?php echo esc_attr($s[0]); ?>" placeholder="Value" style="width:120px">
            <input type="text" name="sh[receipts][stats][<?php echo $platform; ?>][<?php echo $si; ?>][1]" value="<?php echo esc_attr($s[1]); ?>" placeholder="Label" style="width:200px">
        </div>
        <?php endfor; ?>
    </fieldset>
    <?php endforeach; ?>

    <h4>Filter Labels <span class="sh-tooltip" data-tip="Short labels for each platform filter button.">&#8505;</span></h4>
    <?php foreach ($rc['filter_labels'] as $fk => $fl): ?>
    <div class="sh-field sh-field-inline">
        <label style="width:100px"><?php echo esc_html(ucfirst($fk)); ?></label>
        <input type="text" name="sh[receipts][filter_labels][<?php echo $fk; ?>]" value="<?php echo esc_attr($fl); ?>" style="width:80px">
    </div>
    <?php endforeach; ?>

    <?php
    // Testimonials helper
    function sh_render_testimonials($side, $cards) {
        ?>
        <h4>Testimonials (<?php echo ucfirst($side); ?>) <span class="sh-tooltip" data-tip="Testimonial cards for the <?php echo $side; ?> column.">&#8505;</span></h4>
        <div class="sh-repeater" data-group="receipts-testimonials-<?php echo $side; ?>">
            <?php foreach ($cards as $ci => $c): ?>
            <div class="sh-repeater-item">
                <div class="sh-field sh-field-inline">
                    <select name="sh[receipts][testimonials_<?php echo $side; ?>][<?php echo $ci; ?>][platform]">
                        <?php foreach (['google','instagram','facebook','tiktok','twitter'] as $p): ?>
                            <option value="<?php echo $p; ?>" <?php selected($c['platform'], $p); ?>><?php echo ucfirst($p); ?></option>
                        <?php endforeach; ?>
                    </select>
                    <input type="number" name="sh[receipts][testimonials_<?php echo $side; ?>][<?php echo $ci; ?>][stars]" value="<?php echo esc_attr($c['stars']); ?>" min="1" max="5" style="width:60px" placeholder="Stars">
                    <span class="sh-tooltip" data-tip="Star rating 1-5.">&#8505;</span>
                </div>
                <div class="sh-field">
                    <textarea name="sh[receipts][testimonials_<?php echo $side; ?>][<?php echo $ci; ?>][text]" rows="3" style="width:100%" placeholder="Testimonial text"><?php echo esc_textarea($c['text']); ?></textarea>
                </div>
                <div class="sh-field sh-field-inline">
                    <input type="text" name="sh[receipts][testimonials_<?php echo $side; ?>][<?php echo $ci; ?>][name]" value="<?php echo esc_attr($c['name']); ?>" placeholder="Name" style="width:30%">
                    <input type="text" name="sh[receipts][testimonials_<?php echo $side; ?>][<?php echo $ci; ?>][role]" value="<?php echo esc_attr($c['role']); ?>" placeholder="Role" style="width:30%">
                    <input type="text" name="sh[receipts][testimonials_<?php echo $side; ?>][<?php echo $ci; ?>][yt]" value="<?php echo esc_attr($c['yt']); ?>" placeholder="YouTube ID (optional)" style="width:25%">
                    <span class="sh-tooltip" data-tip="Optional YouTube video ID for video testimonial.">&#8505;</span>
                </div>
                <div class="sh-field">
                    <label>Avatar <span class="sh-tooltip" data-tip="Reviewer avatar image.">&#8505;</span></label>
                    <div class="sh-media-field">
                        <input type="hidden" name="sh[receipts][testimonials_<?php echo $side; ?>][<?php echo $ci; ?>][avatar]" value="<?php echo esc_attr($c['avatar']); ?>" class="sh-media-id">
                        <div class="sh-media-preview"><?php if ($u = sh_img($c['avatar'], 'thumbnail')): ?><img src="<?php echo esc_url($u); ?>"><?php endif; ?></div>
                        <button type="button" class="button sh-media-btn">Upload</button>
                        <button type="button" class="button sh-media-remove">Remove</button>
                    </div>
                </div>
                <button type="button" class="button sh-repeater-remove">Remove</button>
                <hr>
            </div>
            <?php endforeach; ?>
        </div>
        <button type="button" class="button sh-repeater-add" data-group="receipts-testimonials-<?php echo $side; ?>">+ Add Testimonial</button>
        <?php
    }
    sh_render_testimonials('left', $rc['testimonials_left']);
    sh_render_testimonials('right', $rc['testimonials_right']);
    ?>

<?php
// ── Contact Section ──
elseif ($sub === 'contact_section'):
    $ct = sh_get('contact');
?>
    <h3>Contact Section</h3>
    <?php foreach (['eyebrow' => 'Small label above the contact heading.', 'heading' => 'Main contact heading.', 'description' => 'Subtitle text under the heading.'] as $ck => $ctip): ?>
    <div class="sh-field">
        <label><?php echo ucwords($ck); ?> <span class="sh-tooltip" data-tip="<?php echo esc_attr($ctip); ?>">&#8505;</span></label>
        <input type="text" name="sh[contact][<?php echo $ck; ?>]" value="<?php echo esc_attr($ct[$ck]); ?>" class="regular-text" style="width:100%">
    </div>
    <?php endforeach; ?>

    <h4>Form Types <span class="sh-tooltip" data-tip="Dropdown options in the contact form type selector.">&#8505;</span></h4>
    <div class="sh-repeater" data-group="contact-form-types">
        <?php foreach ($ct['form_types'] as $fi => $ft): ?>
        <div class="sh-repeater-item sh-field-inline">
            <input type="text" name="sh[contact][form_types][<?php echo $fi; ?>]" value="<?php echo esc_attr($ft); ?>" style="width:60%">
            <button type="button" class="button sh-repeater-remove">Remove</button>
        </div>
        <?php endforeach; ?>
    </div>
    <button type="button" class="button sh-repeater-add" data-group="contact-form-types">+ Add Form Type</button>

<?php endif; ?>
</div>
