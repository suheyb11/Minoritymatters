<?php
if (!defined('ABSPATH')) exit;
// The admin panel at /admin/<section>/. The plugin sends every /admin address here (includes/manager.php).

require_once __DIR__ . '/ui.php';

$section = (string) get_query_var('mm_panel');

if ($section === 'login') {
  if (current_user_can('mm_manage')) mm_redirect(mm_panel_url());
  require __DIR__ . '/login.php';
  return;
}

mm_panel_guard(); // not logged in -> /admin/login; logged in without access -> "no access"

if (array_key_exists($section, MM_PANEL_TYPES)) {
  require __DIR__ . '/content.php';
} elseif (in_array($section, ['dashboard', 'messages', 'settings', 'users', 'account'], true)) {
  require __DIR__ . '/' . $section . '.php';
} else {
  mm_redirect(mm_panel_url());
}
