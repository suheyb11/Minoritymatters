<?php
// Tools > Import website data: loads backup/data.json from the old website (npm run data:from-supabase)
// into WordPress. Every table becomes its content type; bookings go into the bookings table.
// Images stay where they were: "/images/…" come with the theme, "/media/…" are the old uploads
// (copy backup/media/* to wp-content/uploads/mm-media/, see HOSTINGER.md).

if (!defined('ABSPATH')) exit;

add_action('admin_menu', function () {
  add_management_page('Import website data', 'Import website data', 'manage_options', 'mm-import', 'mm_import_page');
});

// The old tables and the content type each one becomes
const MM_IMPORT_TYPES = [
  'Service' => 'mm_service',
  'Project' => 'mm_project',
  'Value' => 'mm_value',
  'PressItem' => 'mm_press',
  'Funder' => 'mm_funder',
  'Event' => 'mm_event',
];

function mm_import_page() {
  echo '<div class="wrap"><h1>Import website data</h1>';

  if (isset($_POST['mm_import']) && check_admin_referer('mm_import')) {
    $result = mm_import_upload();
    if (is_wp_error($result)) {
      echo '<div class="notice notice-error"><p>' . esc_html($result->get_error_message()) . '</p></div>';
    } else {
      echo '<div class="notice notice-success"><p>Import finished.</p><ul>';
      foreach ($result as $table => $count) echo '<li>' . esc_html($table) . ': ' . (int) $count . '</li>';
      echo '</ul></div>';
    }
  }

  $existing = count(get_posts(['post_type' => array_values(MM_IMPORT_TYPES), 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids']));
  echo '<p>Choose <code>backup/data.json</code> from the old website (made with <code>npm run data:from-supabase</code>).</p>';
  echo '<form method="post" enctype="multipart/form-data">';
  wp_nonce_field('mm_import');
  echo '<p><input type="file" name="mm_file" accept=".json,application/json" required></p>';
  if ($existing) {
    echo '<p><label><input type="checkbox" name="mm_replace" value="1"> Delete the website content that is here now first (programmes, projects, events and bookings, values, press, funders, messages, and imported blog posts)</label></p>';
    echo '<p class="description">There is already content. Without this box ticked, the import stops so nothing is added twice.</p>';
  }
  submit_button('Import', 'primary', 'mm_import');
  echo '</form></div>';
}

function mm_import_upload() {
  if (empty($_FILES['mm_file']['tmp_name']) || !is_uploaded_file($_FILES['mm_file']['tmp_name'])) {
    return new WP_Error('mm_import', 'Please choose the data.json file.');
  }
  $data = json_decode(file_get_contents($_FILES['mm_file']['tmp_name']), true);
  if (!is_array($data) || !isset($data['Setting'])) return new WP_Error('mm_import', 'This is not a backup/data.json file from the old website.');

  $existing = get_posts(['post_type' => array_values(MM_IMPORT_TYPES), 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids']);
  if ($existing && empty($_POST['mm_replace'])) {
    return new WP_Error('mm_import', 'There is already content. Tick the box to delete it first, then import again.');
  }
  if (function_exists('set_time_limit')) @set_time_limit(300);
  if ($existing || !empty($_POST['mm_replace'])) mm_import_delete_all();
  return mm_import($data);
}

// Deletes everything the importer adds (used before importing again)
function mm_import_delete_all() {
  global $wpdb;
  $types = array_merge(array_values(MM_IMPORT_TYPES), ['mm_message', 'mm_reply']);
  foreach (get_posts(['post_type' => $types, 'post_status' => 'any', 'numberposts' => -1, 'fields' => 'ids']) as $id) {
    wp_delete_post($id, true);
  }
  foreach (get_posts(['post_type' => 'post', 'post_status' => 'any', 'numberposts' => -1, 'fields' => 'ids', 'meta_key' => 'mm_old_id']) as $id) {
    wp_delete_post($id, true);
  }
  $wpdb->query('DELETE FROM ' . mm_bookings_table());
}

// ISO text from the backup ("2027-02-14T11:00:00.000Z") -> "2027-02-14 11:00:00" in UTC, or "" when empty
function mm_import_date($value) {
  if (!$value) return '';
  $time = strtotime((string) $value);
  return $time ? gmdate('Y-m-d H:i:s', $time) : '';
}

// A value from the backup -> the text saved in post meta, by field type
function mm_import_value($field, $value) {
  switch ($field['type']) {
    case 'checkbox':
      return $value ? '1' : '0';
    case 'number':
      return $value === null || $value === '' ? '' : (string) (int) $value;
    case 'datetime':
      return mm_import_date($value);
    default:
      return $value === null ? '' : (string) $value;
  }
}

function mm_import($data) {
  global $wpdb;
  $counts = [];

  // ---------- Site settings ----------
  $settings = [];
  $old = isset($data['Setting'][0]) ? $data['Setting'][0] : [];
  foreach (mm_settings_fields() as $fields) {
    foreach ($fields as $key => $field) $settings[$key] = isset($old[$key]) ? (string) $old[$key] : mm_setting($key);
  }
  update_option('mm_settings', $settings);
  $counts['Site settings'] = 1;

  // ---------- Content types ----------
  $event_ids = []; // old event id -> new post id (for the bookings)
  foreach (MM_IMPORT_TYPES as $table => $type) {
    $rows = isset($data[$table]) && is_array($data[$table]) ? $data[$table] : [];
    foreach ($rows as $row) {
      $published = !array_key_exists('published', $row) || $row['published'];
      $id = wp_insert_post([
        'post_type' => $type,
        'post_status' => $published ? 'publish' : 'draft',
        'post_title' => isset($row['title']) ? $row['title'] : (isset($row['name']) ? $row['name'] : ''),
        'post_name' => isset($row['slug']) ? $row['slug'] : '',
        'menu_order' => isset($row['sortOrder']) ? (int) $row['sortOrder'] : 0,
      ], true);
      if (is_wp_error($id)) continue;
      foreach (mm_fields($type) as $key => $field) {
        if (array_key_exists($key, $row)) update_post_meta($id, 'mm_' . $key, mm_import_value($field, $row[$key]));
      }
      update_post_meta($id, 'mm_old_id', (int) $row['id']);
      if ($type === 'mm_event') $event_ids[(int) $row['id']] = $id;
    }
    $counts[$table] = count($rows);
  }

  // ---------- Blog posts ----------
  $posts = isset($data['Post']) && is_array($data['Post']) ? $data['Post'] : [];
  foreach ($posts as $row) {
    $gmt = mm_import_date(isset($row['publishedAt']) ? $row['publishedAt'] : '');
    if ($gmt === '') $gmt = gmdate('Y-m-d H:i:s');
    $id = wp_insert_post([
      'post_type' => 'post',
      'post_status' => !empty($row['published']) ? 'publish' : 'draft',
      'post_title' => $row['title'],
      'post_name' => $row['slug'],
      'post_excerpt' => isset($row['excerpt']) ? $row['excerpt'] : '',
      'post_content' => isset($row['body']) ? $row['body'] : '',
      'post_date_gmt' => $gmt,
      'post_date' => get_date_from_gmt($gmt),
    ], true);
    if (is_wp_error($id)) continue;
    update_post_meta($id, 'mm_author', isset($row['author']) ? $row['author'] : 'Minority Matters');
    update_post_meta($id, 'mm_coverImage', isset($row['coverImage']) ? $row['coverImage'] : '');
    update_post_meta($id, 'mm_old_id', (int) $row['id']);
  }
  $counts['Post'] = count($posts);

  // ---------- Contact messages ----------
  $messages = isset($data['Message']) && is_array($data['Message']) ? $data['Message'] : [];
  foreach ($messages as $row) {
    $gmt = mm_import_date(isset($row['createdAt']) ? $row['createdAt'] : '');
    if ($gmt === '') $gmt = gmdate('Y-m-d H:i:s');
    $id = wp_insert_post([
      'post_type' => 'mm_message',
      'post_status' => 'private',
      'post_title' => $row['name'],
      'post_content' => $row['message'],
      'post_date_gmt' => $gmt,
      'post_date' => get_date_from_gmt($gmt),
    ], true);
    if (is_wp_error($id)) continue;
    update_post_meta($id, 'mm_email', $row['email']);
    update_post_meta($id, 'mm_phone', isset($row['phone']) ? $row['phone'] : '');
    update_post_meta($id, 'mm_reason', isset($row['reason']) ? $row['reason'] : MM_REASONS[0]);
    update_post_meta($id, 'mm_isRead', !empty($row['isRead']) ? '1' : '0');
  }
  $counts['Message'] = count($messages);

  // ---------- Bookings ----------
  $bookings = isset($data['Booking']) && is_array($data['Booking']) ? $data['Booking'] : [];
  $saved = 0;
  foreach ($bookings as $row) {
    if (!isset($event_ids[(int) $row['eventId']])) continue;
    $saved += (int) $wpdb->insert(mm_bookings_table(), [
      'event_id' => $event_ids[(int) $row['eventId']],
      'name' => (string) $row['name'],
      'email' => (string) $row['email'],
      'phone' => isset($row['phone']) ? (string) $row['phone'] : '',
      'adults' => (int) $row['adults'],
      'children' => (int) $row['children'],
      'child_ages' => isset($row['childAges']) ? (string) $row['childAges'] : '',
      'notes' => isset($row['notes']) ? (string) $row['notes'] : '',
      'status' => in_array($row['status'], MM_BOOKING_STATUSES, true) ? $row['status'] : 'confirmed',
      'created_at' => mm_import_date($row['createdAt']) ?: gmdate('Y-m-d H:i:s'),
    ], ['%d', '%s', '%s', '%s', '%d', '%d', '%s', '%s', '%s', '%s']);
  }
  $counts['Booking'] = $saved;

  flush_rewrite_rules();
  return $counts;
}
