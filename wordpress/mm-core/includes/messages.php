<?php
// The contact form (/contact) and Admin > Messages.
// A message is a private "mm_message" post: title = name, content = message, meta = email, phone, reason, isRead.

if (!defined('ABSPATH')) exit;

add_action('init', function () {
  register_post_type('mm_message', [
    'labels' => [
      'name' => 'Messages',
      'singular_name' => 'Message',
      'edit_item' => 'Message',
      'all_items' => 'All messages',
      'not_found' => 'No messages yet',
      'search_items' => 'Search messages',
    ],
    'public' => false,
    'show_ui' => true,
    'show_in_menu' => true,
    'menu_position' => 3,
    'menu_icon' => 'dashicons-email',
    'supports' => false, // no title or editor: the Message box shows the message
    'capability_type' => 'post',
    // Messages only come from the form, and hold personal details: only Editors and Administrators see them
    'capabilities' => [
      'create_posts' => 'do_not_allow',
      'edit_posts' => 'edit_others_posts',
      'edit_published_posts' => 'edit_others_posts',
      'edit_private_posts' => 'edit_private_posts',
      'read_private_posts' => 'read_private_posts',
      'delete_posts' => 'delete_others_posts',
      'delete_private_posts' => 'delete_private_posts',
    ],
    'map_meta_cap' => true,
    'show_in_rest' => false,
  ]);
});

// ---------- The form ----------
// The form on /contact posts to admin-post.php?action=mm_contact; we go back to /contact/?sent=1 or ?problem=…

add_action('admin_post_nopriv_mm_contact', 'mm_handle_contact');
add_action('admin_post_mm_contact', 'mm_handle_contact');

function mm_contact_errors() {
  return [
    'reason' => 'Please choose a reason from the list.',
    'missing' => 'Please fill in your name, email and message.',
    'email' => 'Please enter a valid email address.',
    'long' => 'Your message is too long. Please keep it under 5,000 characters.',
    'busy' => 'Too many messages from your connection. Please wait a few minutes and try again.',
  ];
}

function mm_handle_contact() {
  $post = wp_unslash($_POST);
  $field = function ($name) use ($post) { return isset($post[$name]) ? trim((string) $post[$name]) : ''; };

  // Hidden field: bots fill it, people don't. Pretend it worked.
  // (No nonce: anyone may send this form, and a nonce in a cached page would go stale.)
  if ($field('website') !== '') mm_contact_sent();
  // At most 10 messages per visitor in 10 minutes, so the inbox can't be flooded
  if (mm_too_many('contact', 10)) mm_contact_fail('busy');

  $name = sanitize_text_field($field('name'));
  $email = sanitize_text_field($field('email'));
  $phone = sanitize_text_field($field('phone'));
  $message = sanitize_textarea_field(str_replace("\r\n", "\n", $field('message')));
  $reason = $field('reason') !== '' ? $field('reason') : MM_REASONS[0];

  if (!in_array($reason, MM_REASONS, true)) mm_contact_fail('reason');
  if ($name === '' || $email === '' || $message === '') mm_contact_fail('missing');
  if (!is_email($email)) mm_contact_fail('email');
  if (mb_strlen($message) > 5000) mm_contact_fail('long');

  $id = wp_insert_post([
    'post_type' => 'mm_message',
    'post_status' => 'private',
    'post_title' => mb_substr($name, 0, 200),
    'post_content' => $message,
  ]);
  if ($id && !is_wp_error($id)) {
    update_post_meta($id, 'mm_email', mb_substr($email, 0, 200));
    update_post_meta($id, 'mm_phone', mb_substr($phone, 0, 50));
    update_post_meta($id, 'mm_reason', $reason);
    update_post_meta($id, 'mm_isRead', '0');
    mm_contact_notify($name, $email, $phone, $reason, $message);
  }
  mm_contact_sent();
}

// Email the charity a copy of the message. Only when "Contact form email" is filled in under Site settings.
// "Reply" in the email program answers the person who wrote. A failed email never loses the message:
// it is always saved under Messages first.
function mm_contact_notify($name, $email, $phone, $reason, $message) {
  $to = trim(mm_setting('contactNotifyEmail'));
  if ($to === '' || !is_email($to)) return;
  $lines = [
    'New message from the website contact form.',
    '',
    'Name: ' . $name,
    'Email: ' . $email,
  ];
  if ($phone !== '') $lines[] = 'Phone: ' . $phone;
  $lines[] = 'Reason: ' . $reason;
  $lines[] = '';
  $lines[] = $message;
  $lines[] = '';
  $lines[] = 'All messages: ' . mm_panel_url('messages');
  $text = implode("\n", $lines);
  // The name is cleaned of line breaks and brackets so it can't add extra email headers
  $reply = str_replace(["\r", "\n", '<', '>', '"'], '', $name) . ' <' . $email . '>';
  wp_mail($to, 'Website message (' . $reason . '): ' . $name, $text, ['Reply-To: ' . $reply]);
}

// Answer the form: JSON for the theme's JavaScript (it sends ajax=1), or back to /contact without it
function mm_contact_sent() {
  if (!empty($_POST['ajax'])) wp_send_json(['ok' => true, 'error' => '']);
  mm_redirect(add_query_arg('sent', '1', home_url('/contact/')) . '#contact-form');
}

function mm_contact_fail($code) {
  if (!empty($_POST['ajax'])) wp_send_json(['ok' => false, 'error' => mm_contact_errors()[$code]]);
  mm_redirect(add_query_arg('problem', $code, home_url('/contact/')) . '#contact-form');
}

// True when this visitor (by IP address) has used the form $action more than $limit times in 10 minutes.
// Only a hash of the address is kept, for 10 minutes.
function mm_too_many($action, $limit) {
  $ip = isset($_SERVER['REMOTE_ADDR']) ? (string) $_SERVER['REMOTE_ADDR'] : '';
  $key = 'mm_rate_' . $action . '_' . md5($ip . wp_salt('nonce'));
  $count = (int) get_transient($key);
  if ($count >= $limit) return true;
  set_transient($key, $count + 1, 10 * MINUTE_IN_SECONDS);
  return false;
}

function mm_redirect($url) {
  wp_safe_redirect($url, 303);
  exit;
}

// ---------- Admin > Messages ----------

add_filter('manage_mm_message_posts_columns', function () {
  return ['cb' => '<input type="checkbox">', 'mm_name' => 'Name', 'mm_email' => 'Email', 'mm_reason' => 'Reason', 'mm_preview' => 'Message', 'date' => 'Received'];
});

add_action('manage_mm_message_posts_custom_column', function ($column, $post_id) {
  $post = get_post($post_id);
  switch ($column) {
    case 'mm_name':
      $url = get_edit_post_link($post_id);
      echo '<strong><a href="' . esc_url($url) . '">' . esc_html($post->post_title) . '</a></strong>';
      if (get_post_meta($post_id, 'mm_isRead', true) !== '1') echo ' <span class="mm-status mm-status-attended">new</span>';
      break;
    case 'mm_email':
      $email = get_post_meta($post_id, 'mm_email', true);
      echo '<a href="mailto:' . esc_attr($email) . '">' . esc_html($email) . '</a>';
      break;
    case 'mm_reason':
      echo esc_html(get_post_meta($post_id, 'mm_reason', true));
      break;
    case 'mm_preview':
      echo esc_html(wp_trim_words($post->post_content, 18));
      break;
  }
}, 10, 2);

// Unread messages are shown in bold, and their number is shown next to "Messages" in the menu
add_filter('post_class', function ($classes, $class, $post_id) {
  if (is_admin() && get_post_type($post_id) === 'mm_message' && get_post_meta($post_id, 'mm_isRead', true) !== '1') $classes[] = 'mm-unread';
  return $classes;
}, 10, 3);

add_action('admin_menu', function () {
  global $menu;
  $unread = count(get_posts([
    'post_type' => 'mm_message',
    'post_status' => 'any',
    'numberposts' => -1,
    'fields' => 'ids',
    'meta_query' => [['key' => 'mm_isRead', 'value' => '1', 'compare' => '!=']],
  ]));
  if (!$unread) return;
  foreach ($menu as $i => $item) {
    if (isset($item[2]) && $item[2] === 'edit.php?post_type=mm_message') {
      $menu[$i][0] .= ' <span class="awaiting-mod"><span class="pending-count">' . $unread . '</span></span>';
    }
  }
}, 99);

// The message screen: the message itself, a reply button and "Mark as unread"
add_action('add_meta_boxes_mm_message', function ($post) {
  remove_meta_box('submitdiv', 'mm_message', 'side');
  add_meta_box('mm_message', 'Message', 'mm_message_box', 'mm_message', 'normal', 'high');
  add_meta_box('mm_message_actions', 'Actions', 'mm_message_actions_box', 'mm_message', 'side', 'high');
  // Opening a message marks it as read
  update_post_meta($post->ID, 'mm_isRead', '1');
});

function mm_message_box($post) {
  $email = get_post_meta($post->ID, 'mm_email', true);
  $phone = get_post_meta($post->ID, 'mm_phone', true);
  echo '<table class="form-table" role="presentation"><tbody>';
  echo '<tr><th>Name</th><td>' . esc_html($post->post_title) . '</td></tr>';
  echo '<tr><th>Email</th><td><a href="mailto:' . esc_attr($email) . '">' . esc_html($email) . '</a></td></tr>';
  if ($phone) echo '<tr><th>Phone</th><td><a href="tel:' . esc_attr(preg_replace('/\s/', '', $phone)) . '">' . esc_html($phone) . '</a></td></tr>';
  echo '<tr><th>Reason</th><td>' . esc_html(get_post_meta($post->ID, 'mm_reason', true)) . '</td></tr>';
  echo '<tr><th>Received</th><td>' . esc_html(get_the_date('j F Y, H:i', $post)) . '</td></tr>';
  echo '</tbody></table>';
  echo '<div class="mm-message-body">' . esc_html($post->post_content) . '</div>';
}

function mm_message_actions_box($post) {
  $email = get_post_meta($post->ID, 'mm_email', true);
  $subject = rawurlencode('Re: your message to Minority Matters');
  echo '<p><a class="button button-primary" href="mailto:' . esc_attr($email) . '?subject=' . $subject . '">Reply by email</a></p>';
  $unread = wp_nonce_url(admin_url('admin-post.php?action=mm_message_unread&id=' . $post->ID), 'mm_message_unread_' . $post->ID);
  echo '<p><a class="button" href="' . esc_url($unread) . '">Mark as unread</a></p>';
  echo '<p><a class="submitdelete deletion" href="' . esc_url(get_delete_post_link($post->ID)) . '">Move to Trash</a></p>';
}

add_action('admin_post_mm_message_unread', function () {
  $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
  check_admin_referer('mm_message_unread_' . $id);
  if (!current_user_can('edit_post', $id)) wp_die('Not allowed');
  update_post_meta($id, 'mm_isRead', '0');
  mm_redirect(admin_url('edit.php?post_type=mm_message'));
});
