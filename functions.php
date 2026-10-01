<?php
/**
 * Saad Hashmani theme bootstrap.
 */
defined('ABSPATH') || exit;

define('SH_VERSION', '3.0.0');
define('SH_SCHEMA', 3);
define('SH_DIR', get_template_directory());
define('SH_URI', get_template_directory_uri());

require_once SH_DIR . '/inc/defaults.php';
require_once SH_DIR . '/inc/helpers.php';
require_once SH_DIR . '/inc/migrate.php';
require_once SH_DIR . '/inc/setup.php';
require_once SH_DIR . '/inc/enqueue.php';
require_once SH_DIR . '/inc/seo.php';
require_once SH_DIR . '/inc/contact.php';

if (is_admin() || wp_doing_ajax()) {
    require_once SH_DIR . '/inc/admin-fields.php';
    require_once SH_DIR . '/inc/theme-settings.php';
    require_once SH_DIR . '/inc/demo-import.php';
}
