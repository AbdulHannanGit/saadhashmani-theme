<?php
/**
 * Fallback for anything that is not the one-page front page (posts, archives, 404).
 */
defined('ABSPATH') || exit;
get_header();
?>
<main class="sh-page">
    <p><a href="<?php echo esc_url(home_url('/')); ?>">&larr; <?php echo esc_html(get_bloginfo('name')); ?></a></p>
    <?php if (have_posts()) : while (have_posts()) : the_post(); ?>
        <article <?php post_class(); ?>>
            <?php if (is_singular()) : ?>
                <h1><?php the_title(); ?></h1>
                <?php the_content(); ?>
            <?php else : ?>
                <h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
                <?php the_excerpt(); ?>
            <?php endif; ?>
        </article>
    <?php endwhile; the_posts_pagination(); else : ?>
        <h1><?php esc_html_e('Nothing found', 'saadhashmani'); ?></h1>
    <?php endif; ?>
</main>
<?php
get_footer();
