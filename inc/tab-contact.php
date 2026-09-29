<?php if (!defined('ABSPATH')) exit;
$ct = sh_get('contact');
$socials = [
    'x'         => 'X (Twitter) profile URL, e.g. https://x.com/username',
    'facebook'  => 'Facebook page URL, e.g. https://www.facebook.com/username/',
    'instagram' => 'Instagram profile URL, e.g. https://www.instagram.com/username/',
    'tiktok'    => 'TikTok profile URL, e.g. https://www.tiktok.com/@username',
    'linkedin'  => 'LinkedIn profile URL, e.g. https://www.linkedin.com/in/slug',
];
?>

<h2>Contact Details</h2>

<div class="sh-field">
    <label>Email <span class="sh-tooltip" data-tip="Primary contact email shown on the site.">&#8505;</span></label>
    <input type="email" name="sh[contact][email]" value="<?php echo esc_attr($ct['email']); ?>" class="regular-text" style="width:100%">
</div>

<div class="sh-field">
    <label>Location <span class="sh-tooltip" data-tip="Location text shown in menu and footer.">&#8505;</span></label>
    <input type="text" name="sh[contact][location]" value="<?php echo esc_attr($ct['location']); ?>" class="regular-text" style="width:100%">
</div>

<h3>Social Links</h3>
<?php foreach ($socials as $sk => $stip): ?>
<div class="sh-field">
    <label><?php echo ucfirst($sk); ?> <span class="sh-tooltip" data-tip="<?php echo esc_attr($stip); ?>">&#8505;</span></label>
    <input type="url" name="sh[contact][social][<?php echo $sk; ?>]" value="<?php echo esc_attr($ct['social'][$sk] ?? ''); ?>" class="regular-text" style="width:100%">
</div>
<?php endforeach; ?>

<h3>Contact Form 7 Integration</h3>
<div class="sh-field">
    <label>CF7 Form <span class="sh-tooltip" data-tip="Select a Contact Form 7 form to replace the built-in chat widget in the Contact section. Install CF7 plugin to see available forms.">&#8505;</span></label>
    <select name="sh[contact][cf7_form_id]">
        <option value="0" <?php selected($ct['cf7_form_id'], 0); ?>>Use built-in chat form</option>
        <?php
        if (post_type_exists('wpcf7_contact_form')) {
            $forms = get_posts(['post_type' => 'wpcf7_contact_form', 'numberposts' => -1, 'orderby' => 'title', 'order' => 'ASC']);
            foreach ($forms as $form) {
                printf(
                    '<option value="%d" %s>%s</option>',
                    $form->ID,
                    selected($ct['cf7_form_id'], $form->ID, false),
                    esc_html($form->post_title)
                );
            }
        }
        ?>
    </select>
</div>
