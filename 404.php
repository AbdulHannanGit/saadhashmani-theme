<?php
/**
 * 404: the hero still behind a short "off the record" message, with a way home and a way to the contact form.
 */
defined('ABSPATH') || exit;

$sh_poster = sh_get('hero.poster');
$sh_still  = sh_img($sh_poster);
$sh_set    = sh_srcset($sh_poster, 'full', '100vw');
$sh_logo   = sh_get('options.logo');
$sh_first  = trim((string) sh_get('hero.first_name'));
$sh_name   = trim($sh_first . ' ' . sh_get('hero.last_name')) ?: get_bloginfo('name');
$sh_email  = (string) sh_get('contact.email');
$sh_home   = home_url('/');

// The still is the largest paint on this page: fetch it before the stylesheet asks for it.
if ($sh_still) {
    add_action('wp_head', function () use ($sh_still, $sh_poster) {
        $set = is_numeric($sh_poster) ? wp_get_attachment_image_srcset((int) $sh_poster, 'full') : '';
        echo '<link rel="preload" as="image" href="' . esc_url($sh_still) . '"' . ($set ? ' imagesrcset="' . esc_attr($set) . '" imagesizes="100vw"' : '') . ' fetchpriority="high">' . "\n";
    }, 1);
}

get_header();
?>
<main class="sh-404" aria-labelledby="sh-404-title">
    <div class="sh-404__bg" aria-hidden="true">
        <?php if ($sh_still) : ?><img src="<?php echo esc_url($sh_still); ?>"<?php echo $sh_set; ?> alt="" fetchpriority="high" decoding="async"><?php endif; ?>
        <span class="sh-404__vignette"></span>
        <span class="sh-404__scrim"></span>
        <span class="sh-404__grain"></span>
    </div>

    <header class="sh-404__top">
        <a class="sh-404__brand" href="<?php echo esc_url($sh_home); ?>" aria-label="<?php echo esc_attr(sprintf(__('%s home', 'saadhashmani'), $sh_name)); ?>">
            <?php if ($sh_logo && sh_img($sh_logo)) : ?>
                <img src="<?php echo esc_url(sh_img($sh_logo, 'medium_large')); ?>"<?php echo sh_srcset($sh_logo, 'full', '200px'); ?> alt="<?php echo esc_attr($sh_name); ?>" height="52">
            <?php else : ?>
                <span><?php echo esc_html($sh_name); ?></span>
            <?php endif; ?>
        </a>
        <span class="sh-404__code"><?php esc_html_e('Error 404', 'saadhashmani'); ?></span>
    </header>

    <section class="sh-404__body">
        <div class="sh-404__num" aria-hidden="true"><span>4</span><span>0</span><span>4</span></div>
        <p class="sh-404__eyebrow"><?php esc_html_e('Off the record', 'saadhashmani'); ?></p>
        <h1 id="sh-404-title" class="sh-404__title"><?php esc_html_e('This page isn’t part of the story.', 'saadhashmani'); ?></h1>
        <p class="sh-404__text"><?php esc_html_e('The link may be broken, or the page has moved. Everything worth seeing is one step away.', 'saadhashmani'); ?></p>
        <div class="sh-404__actions">
            <a class="sh-404__btn sh-404__btn--primary" href="<?php echo esc_url($sh_home); ?>">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6"></path></svg>
                <?php esc_html_e('Back to home', 'saadhashmani'); ?>
            </a>
            <a class="sh-404__btn sh-404__btn--ghost v-hbtn" href="<?php echo esc_url($sh_home . '#contact'); ?>">
                <?php echo esc_html($sh_first ? sprintf(__('Connect with %s', 'saadhashmani'), $sh_first) : __('Get in touch', 'saadhashmani')); ?>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"></path></svg>
            </a>
        </div>
    </section>

    <footer class="sh-404__foot">
        <?php if ($sh_email) : ?>
            <a href="<?php echo esc_url('mailto:' . $sh_email); ?>"><?php echo esc_html($sh_email); ?></a>
        <?php endif; ?>
        <nav aria-label="<?php esc_attr_e('Social', 'saadhashmani'); ?>">
            <?php foreach (sh_social_links() as $s) : ?>
                <a href="<?php echo esc_url($s['url']); ?>" target="_blank" rel="noopener noreferrer" aria-label="<?php echo esc_attr($s['label']); ?>"><?php echo esc_html($s['short']); ?></a>
            <?php endforeach; ?>
        </nav>
    </footer>
</main>
<?php
get_footer();
