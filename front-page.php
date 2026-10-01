<?php
/**
 * One-page front page. Sections are fixed overlays revealed by app.js as the
 * visitor steps through the spacer; markup lives in template-parts/.
 */
defined('ABSPATH') || exit;
get_header();
$v = sh_view_data();
?>
<main id="home" data-stage-root="true" style="position:relative;background:var(--ink-900,#030405)">
<?php
get_template_part('template-parts/site-header', null, $v);
get_template_part('template-parts/hero', null, $v);
get_template_part('template-parts/section-journey', null, $v);
get_template_part('template-parts/section-ventures', null, $v);
get_template_part('template-parts/section-playbook', null, $v);
get_template_part('template-parts/section-podcast', null, $v);
get_template_part('template-parts/section-receipts', null, $v);
get_template_part('template-parts/section-contact', null, $v);
?>
<div data-spacer="true" style="height:calc(1090*var(--vh,1vh))"></div>
</main>
<?php
get_template_part('template-parts/overlays', null, $v);
get_footer();
