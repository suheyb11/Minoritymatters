<?php
// The website's own admin panel at /admin (like the old website), for "Website managers".
// This file has the logic: the role, the web addresses, logging in and out, and saving.
// The pages themselves are in the theme (minority-matters/admin/).
//
// Who can do what:
//   Website manager (role mm_manager)  /admin only: all content, messages, bookings, site settings. No WordPress admin.
//   Administrator                      /admin and the WordPress admin; also adds and removes Website managers (/admin/users).
// Both have the capability "mm_manage", which every page and action of the panel checks.

if (!defined('ABSPATH')) exit;

// The panel sections that edit a content type, and the type each one edits
const MM_PANEL_TYPES = [
  'services' => 'mm_service',
  'projects' => 'mm_project',
  'events' => 'mm_event',
  'blog' => 'post',
  'press' => 'mm_press',
  'values' => 'mm_value',
  'funders' => 'mm_funder',
];

// ---------- The role ----------

function mm_add_roles() {
  add_role('mm_manager', 'Website manager', ['read' => true, 'upload_files' => true, 'mm_manage' => true]);
  $admin = get_role('administrator');
  if ($admin && !$admin->has_cap('mm_manage')) $admin->add_cap('mm_manage');
}

// After an update of the plugin: add the role and refresh the web addresses once
add_action('init', function () {
  if (get_option('mm_core_version') === MM_CORE_VERSION) return;
  mm_add_roles();
  mm_create_pages(); // pages added in an update (for example /donate) are created
  mm_add_givey_link();
  flush_rewrite_rules();
  update_option('mm_core_version', MM_CORE_VERSION);
}, 99);

// Version 1.2 added a second donate link: fill in the charity's Givey page once (it can be changed in Site settings)
function mm_add_givey_link() {
  if (get_option('mm_givey_added')) return;
  $settings = get_option('mm_settings', []);
  if (is_array($settings) && empty($settings['donateGiveyUrl'])) {
    $settings['donateGiveyUrl'] = 'https://www.givey.com/share?charity_id=minoritymattersltd&client_id=lSaVLTJm5um0uTE2q4VeEIbfxmLAy6x6vHOKfdKU';
    update_option('mm_settings', $settings);
  }
  update_option('mm_givey_added', 1);
}

// Website managers never see the WordPress admin or the black admin bar
add_action('admin_init', function () {
  if (wp_doing_ajax() || current_user_can('manage_options') || !current_user_can('mm_manage')) return;
  $script = isset($_SERVER['SCRIPT_NAME']) ? basename((string) $_SERVER['SCRIPT_NAME']) : '';
  if ($script === 'admin-post.php' || $script === 'async-upload.php') return;
  wp_safe_redirect(mm_panel_url());
  exit;
});
add_filter('show_admin_bar', function ($show) {
  return current_user_can('mm_manage') && !current_user_can('manage_options') ? false : $show;
});
// After logging in on wp-login.php, managers go to the panel too
add_filter('login_redirect', function ($to, $requested, $user) {
  if ($user instanceof WP_User && $user->has_cap('mm_manage') && !$user->has_cap('manage_options')) return mm_panel_url();
  return $to;
}, 10, 3);

// ---------- Web addresses: /admin/, /admin/<section>/ ----------

add_action('init', function () {
  add_rewrite_rule('^admin/?$', 'index.php?mm_panel=dashboard', 'top');
  add_rewrite_rule('^admin/([a-z-]+)/?$', 'index.php?mm_panel=$matches[1]', 'top');
});
add_filter('query_vars', function ($vars) {
  $vars[] = 'mm_panel';
  return $vars;
});

// The same, without depending on the saved rewrite rules: some hosts keep an old copy of them in a cache,
// and then /admin would go to /wp-admin and /admin/<section>/ would be "page not found".
add_action('parse_request', function ($wp) {
  if (preg_match('#^admin(?:/([a-z-]+))?$#', trim((string) $wp->request, '/'), $m)) {
    $wp->query_vars = ['mm_panel' => isset($m[1]) ? $m[1] : 'dashboard'];
  }
});

// "/admin/projects/?edit=12" -> the full address
function mm_panel_url($section = '', $args = []) {
  $url = home_url('/admin/' . ($section !== '' && $section !== 'dashboard' ? $section . '/' : ''));
  return $args ? add_query_arg($args, $url) : $url;
}

// The panel pages are drawn by the theme (admin/panel.php). They are never cached or indexed.
add_filter('template_include', function ($template) {
  $section = get_query_var('mm_panel');
  if (!$section) return $template;
  $file = get_template_directory() . '/admin/panel.php';
  if (!file_exists($file)) return $template;
  if (!defined('DONOTCACHEPAGE')) define('DONOTCACHEPAGE', true);
  do_action('litespeed_control_set_nocache', 'Minority Matters admin panel');
  nocache_headers();
  header('X-Robots-Tag: noindex, nofollow', true);
  header('X-Frame-Options: SAMEORIGIN', true);
  return $file;
}, 99);

// No "/admin" → "/wp-admin" guessing by WordPress (our panel lives there)
add_filter('redirect_canonical', function ($redirect) {
  return get_query_var('mm_panel') ? false : $redirect;
});

// Only for the panel pages and actions: stop unless the visitor may manage the website
function mm_panel_guard() {
  if (!is_user_logged_in()) mm_redirect(mm_panel_url('login'));
  if (!current_user_can('mm_manage')) wp_die('You do not have access to the website admin.', 'Minority Matters', ['response' => 403]);
}

// Every panel action: logged in, allowed, and the form came from our panel
function mm_panel_check($action) {
  if (!current_user_can('mm_manage')) wp_die('Not allowed', 'Minority Matters', ['response' => 403]);
  check_admin_referer($action);
}

// ---------- Log in / log out ----------

add_action('admin_post_nopriv_mm_login', 'mm_panel_login');
add_action('admin_post_mm_login', 'mm_panel_login');

function mm_panel_login() {
  // At most 10 tries per visitor in 10 minutes, so passwords can't be guessed
  if (mm_too_many('login', 10)) mm_redirect(mm_panel_url('login', ['problem' => 'busy']));
  $login = isset($_POST['login']) ? sanitize_text_field(wp_unslash($_POST['login'])) : '';
  $password = isset($_POST['password']) ? (string) wp_unslash($_POST['password']) : '';
  $user = wp_signon(['user_login' => $login, 'user_password' => $password, 'remember' => !empty($_POST['remember'])], is_ssl());
  if (is_wp_error($user)) mm_redirect(mm_panel_url('login', ['problem' => 'wrong']));
  if (!$user->has_cap('mm_manage')) {
    wp_logout();
    mm_redirect(mm_panel_url('login', ['problem' => 'access']));
  }
  mm_redirect(mm_panel_url());
}

add_action('admin_post_mm_logout', function () {
  check_admin_referer('mm_logout');
  wp_logout();
  mm_redirect(mm_panel_url('login', ['out' => '1']));
});

// ---------- Saving content (every section uses the same form) ----------

add_action('admin_post_mm_panel_save', function () {
  mm_panel_check('mm_panel_save');
  require_once ABSPATH . 'wp-admin/includes/file.php';
  require_once ABSPATH . 'wp-admin/includes/media.php';
  require_once ABSPATH . 'wp-admin/includes/image.php';

  $post = wp_unslash($_POST);
  $section = isset($post['section']) ? (string) $post['section'] : '';
  if (!array_key_exists($section, MM_PANEL_TYPES)) wp_die('Unknown section');
  $type = MM_PANEL_TYPES[$section];
  $id = isset($post['id']) ? (int) $post['id'] : 0;
  if ($id && get_post_type($id) !== $type) wp_die('Not found');
  $back = function ($args) use ($section, $id) {
    mm_redirect(mm_panel_url($section, $args + ($id ? ['edit' => $id] : ['new' => 1])) . '#form');
  };

  $title = isset($post['title']) ? sanitize_text_field($post['title']) : '';
  if ($title === '') $back(['problem' => 'title']);
  $fields = isset($post['fields']) && is_array($post['fields']) ? $post['fields'] : [];

  // Images chosen with "Upload" replace the address in the box; gallery uploads go to the end of the list
  foreach (mm_fields($type) as $key => $field) {
    if ($field['type'] === 'image') {
      $url = mm_panel_upload('file_' . $key);
      if (is_wp_error($url)) $back(['problem' => 'image']);
      if ($url) $fields[$key] = $url;
    }
    if ($field['type'] === 'gallery') {
      $urls = mm_panel_upload_many('files_' . $key);
      if (is_wp_error($urls)) $back(['problem' => 'image']);
      if ($urls) $fields[$key] = rtrim(isset($fields[$key]) ? (string) $fields[$key] : '') . "\n" . implode("\n", $urls);
    }
  }

  // Events: a start date, an end after the start, and a link for external booking
  if ($type === 'mm_event') {
    $starts = mm_from_london_input(isset($fields['startsAt']) ? $fields['startsAt'] : '');
    $ends = mm_from_london_input(isset($fields['endsAt']) ? $fields['endsAt'] : '');
    if ($starts === '' || ($ends !== '' && $ends <= $starts)) $back(['problem' => 'date']);
    if (isset($fields['bookingType']) && $fields['bookingType'] === 'external' && !preg_match('#^https?://#', trim((string) (isset($fields['bookingUrl']) ? $fields['bookingUrl'] : '')))) {
      $back(['problem' => 'url']);
    }
  }

  $data = [
    'post_type' => $type,
    'post_title' => $title,
    'post_name' => sanitize_title(isset($post['slug']) && trim($post['slug']) !== '' ? $post['slug'] : $title),
    'menu_order' => isset($post['order']) ? (int) $post['order'] : 0,
    'post_status' => !empty($post['published']) ? 'publish' : 'draft',
  ];
  // Blog posts: the text, the summary and the date are WordPress's own fields
  if ($type === 'post') {
    $data['post_content'] = wp_kses_post(str_replace("\r\n", "\n", isset($post['body']) ? $post['body'] : ''));
    $data['post_excerpt'] = sanitize_textarea_field(isset($post['excerpt']) ? $post['excerpt'] : '');
    $date = isset($post['date']) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $post['date']) ? $post['date'] : '';
    if ($date) {
      $data['post_date'] = $date . ' 09:00:00';
      $data['post_date_gmt'] = get_gmt_from_date($data['post_date']);
      $data['edit_date'] = true;
    }
  }
  if ($id) $data['ID'] = $id;
  $saved = $id ? wp_update_post($data, true) : wp_insert_post($data, true);
  if (is_wp_error($saved)) $back(['problem' => 'failed']);

  foreach (mm_fields($type) as $key => $field) {
    if (!array_key_exists($key, $fields)) continue;
    update_post_meta($saved, 'mm_' . $key, mm_clean_field($field, $fields[$key]));
  }
  mm_unfeature_others($saved);
  mm_redirect(mm_panel_url($section, ['saved' => 1]));
});

// One uploaded image -> its address in the Media Library ("" when no file was chosen)
function mm_panel_upload($name) {
  if (empty($_FILES[$name]['name']) || (isset($_FILES[$name]['error']) && $_FILES[$name]['error'] === UPLOAD_ERR_NO_FILE)) return '';
  if (!mm_panel_is_image($_FILES[$name])) return new WP_Error('mm_upload', 'Not an image');
  $id = media_handle_upload($name, 0);
  return is_wp_error($id) ? $id : wp_get_attachment_url($id);
}

// Several uploaded images (input name="files_x[]") -> their addresses
function mm_panel_upload_many($name) {
  if (empty($_FILES[$name]['name']) || !is_array($_FILES[$name]['name'])) return [];
  $urls = [];
  $files = $_FILES[$name];
  foreach (array_keys($files['name']) as $i) {
    if ($files['name'][$i] === '' || $files['error'][$i] === UPLOAD_ERR_NO_FILE) continue;
    $_FILES['mm_one'] = ['name' => $files['name'][$i], 'type' => $files['type'][$i], 'tmp_name' => $files['tmp_name'][$i], 'error' => $files['error'][$i], 'size' => $files['size'][$i]];
    $url = mm_panel_upload('mm_one');
    if (is_wp_error($url)) return $url;
    if ($url) $urls[] = $url;
  }
  return $urls;
}

// Only real photos (JPG, PNG, GIF, WEBP) up to 8 MB; the file's content is checked, not only its name
function mm_panel_is_image($file) {
  if (!empty($file['error']) || empty($file['tmp_name']) || $file['size'] > 8 * 1024 * 1024) return false;
  $check = wp_check_filetype_and_ext($file['tmp_name'], $file['name']);
  return in_array($check['ext'], ['jpg', 'jpeg', 'png', 'gif', 'webp'], true) && @getimagesize($file['tmp_name']) !== false;
}

add_action('admin_post_mm_panel_delete', function () {
  mm_panel_check('mm_panel_delete');
  $section = isset($_POST['section']) ? (string) wp_unslash($_POST['section']) : '';
  $id = isset($_POST['id']) ? (int) $_POST['id'] : 0;
  if (!array_key_exists($section, MM_PANEL_TYPES) || get_post_type($id) !== MM_PANEL_TYPES[$section]) wp_die('Not found');
  wp_delete_post($id, true); // an event takes its bookings with it (includes/bookings.php)
  mm_redirect(mm_panel_url($section, ['deleted' => 1]));
});

// ---------- Messages ----------

add_action('admin_post_mm_panel_message', function () {
  mm_panel_check('mm_panel_message');
  $id = isset($_POST['id']) ? (int) $_POST['id'] : 0;
  if (get_post_type($id) !== 'mm_message') wp_die('Not found');
  $do = isset($_POST['do']) ? (string) $_POST['do'] : '';
  $with = mm_email_key(get_post_meta($id, 'mm_email', true));
  if ($do === 'delete') {
    wp_delete_post($id, true);
    mm_redirect(mm_panel_url('messages', ['deleted' => 1, 'with' => $with]));
  }
  update_post_meta($id, 'mm_isRead', $do === 'unread' ? '0' : '1');
  // "Mark as unread" goes back to the list (opening the conversation would mark it read again)
  mm_redirect(mm_panel_url('messages', $do === 'unread' ? [] : ['with' => $with]));
});

// ---------- Site settings ----------

add_action('admin_post_mm_panel_settings', function () {
  mm_panel_check('mm_panel_settings');
  $input = isset($_POST['settings']) && is_array($_POST['settings']) ? wp_unslash($_POST['settings']) : [];
  $url = mm_panel_upload('file_founderPhoto');
  if (is_wp_error($url)) mm_redirect(mm_panel_url('settings', ['problem' => 'image']));
  if ($url) $input['founderPhoto'] = $url;
  update_option('mm_settings', mm_sanitize_settings($input));
  mm_redirect(mm_panel_url('settings', ['saved' => 1]));
});

// ---------- Website managers (Administrators only) ----------

add_action('admin_post_mm_panel_user_add', function () {
  mm_panel_check('mm_panel_user_add');
  if (!current_user_can('create_users')) wp_die('Only an Administrator can add people.', 'Minority Matters', ['response' => 403]);
  $post = wp_unslash($_POST);
  $name = sanitize_text_field(isset($post['name']) ? $post['name'] : '');
  $email = sanitize_email(isset($post['email']) ? $post['email'] : '');
  $password = isset($post['password']) ? (string) $post['password'] : '';
  if ($name === '' || !is_email($email)) mm_redirect(mm_panel_url('users', ['problem' => 'missing']));
  if (strlen($password) < 12) mm_redirect(mm_panel_url('users', ['problem' => 'short']));
  if (email_exists($email)) mm_redirect(mm_panel_url('users', ['problem' => 'exists']));
  $id = wp_insert_user([
    'user_login' => $email,
    'user_email' => $email,
    'user_pass' => $password,
    'display_name' => $name,
    'first_name' => $name,
    'role' => 'mm_manager',
  ]);
  if (is_wp_error($id)) mm_redirect(mm_panel_url('users', ['problem' => 'failed']));
  mm_redirect(mm_panel_url('users', ['saved' => 1]));
});

add_action('admin_post_mm_panel_user_remove', function () {
  mm_panel_check('mm_panel_user_remove');
  if (!current_user_can('delete_users')) wp_die('Only an Administrator can remove people.', 'Minority Matters', ['response' => 403]);
  $id = isset($_POST['id']) ? (int) $_POST['id'] : 0;
  $user = get_userdata($id);
  // Only Website managers can be removed here (never an Administrator, never yourself)
  if (!$user || $id === get_current_user_id() || !in_array('mm_manager', (array) $user->roles, true)) wp_die('Not allowed');
  require_once ABSPATH . 'wp-admin/includes/user.php';
  wp_delete_user($id, get_current_user_id()); // anything they wrote now belongs to you
  mm_redirect(mm_panel_url('users', ['deleted' => 1]));
});

// My account: change your own password
add_action('admin_post_mm_panel_password', function () {
  mm_panel_check('mm_panel_password');
  $user = wp_get_current_user();
  $current = isset($_POST['current']) ? (string) wp_unslash($_POST['current']) : '';
  $new = isset($_POST['new']) ? (string) wp_unslash($_POST['new']) : '';
  if (!wp_check_password($current, $user->user_pass, $user->ID)) mm_redirect(mm_panel_url('account', ['problem' => 'wrong']));
  if (strlen($new) < 12) mm_redirect(mm_panel_url('account', ['problem' => 'short']));
  wp_set_password($new, $user->ID);
  // wp_set_password logs everyone out: log this person straight back in
  wp_set_auth_cookie($user->ID, false, is_ssl());
  mm_redirect(mm_panel_url('account', ['saved' => 1]));
});
