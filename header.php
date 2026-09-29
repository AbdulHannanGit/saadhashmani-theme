<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php
$fonts = sh_get('options.fonts');
$has_local = !empty($fonts['local_heading']);
if (!$has_local && !empty($fonts['grotesk_url'])) : ?>
<link rel="preconnect" href="https://api.fontshare.com" crossorigin>
<?php endif; ?>
<?php if (!empty($fonts['google_url'])) : ?>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<?php endif; ?>
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
