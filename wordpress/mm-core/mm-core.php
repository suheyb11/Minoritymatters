<?php
/**
 * Plugin Name: Minority Matters Core
 * Description: The content of the Minority Matters website: programmes, projects, events and bookings, values, press, funders, contact messages and site settings. Works together with the "Minority Matters" theme.
 * Version: 1.5.0
 * Requires at least: 6.4
 * Requires PHP: 7.4
 * Author: Minority Matters
 * Text Domain: mm-core
 */

// All the website's own content lives in this plugin, so it stays when the theme changes.
//
//   includes/fields.php      the fields of every content type (one list, used by the admin, the importer and the theme)
//   includes/post-types.php  the content types (Programmes, Projects, Events, â€¦) and their admin boxes
//   includes/data.php        read functions and text/date helpers used by the theme
//   includes/settings.php    Site settings page (home text, contact details, founder video, â€¦)
//   includes/messages.php    the contact form and Admin > Messages
//   includes/conversations.php  messages grouped by person in /admin/messages, and replies sent from there
//   includes/mail.php        sending email through Google (SMTP) from the charity's own address
//   includes/inbox-sync.php  bringing people's email answers from the Google mailbox (IMAP) into /admin/messages
//   includes/bookings.php    event bookings: the form, Admin > Events > Bookings, CSV download, calendar file
//   includes/import.php      Tools > Import website data (backup/data.json from the old website)
//   includes/manager.php     the website's own admin panel at /admin (logic; the pages are in the theme's admin/ folder)
//   includes/setup.php       first activation: pages, menu order, permalinks, bookings table

if (!defined('ABSPATH')) exit;

define('MM_CORE_VERSION', '1.5.2'); // change it with every update: the web addresses and roles are then refreshed
define('MM_CORE_FILE', __FILE__);
define('MM_CORE_DIR', plugin_dir_path(__FILE__));
define('MM_CORE_URL', plugin_dir_url(__FILE__));

require_once MM_CORE_DIR . 'includes/fields.php';
require_once MM_CORE_DIR . 'includes/data.php';
require_once MM_CORE_DIR . 'includes/post-types.php';
require_once MM_CORE_DIR . 'includes/settings.php';
require_once MM_CORE_DIR . 'includes/messages.php';
require_once MM_CORE_DIR . 'includes/conversations.php';
require_once MM_CORE_DIR . 'includes/mail.php';
require_once MM_CORE_DIR . 'includes/inbox-sync.php';
require_once MM_CORE_DIR . 'includes/bookings.php';
require_once MM_CORE_DIR . 'includes/import.php';
require_once MM_CORE_DIR . 'includes/manager.php';
require_once MM_CORE_DIR . 'includes/setup.php';

register_activation_hook(__FILE__, 'mm_activate');
