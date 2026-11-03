<?php
// Conversations in /admin/messages: every contact form message and every reply sent from the panel,
// grouped by the person's email address, like an email inbox.
// A reply is a private "mm_reply" post: title = subject, content = text, meta = email, sent (1 = the email went out).
// When the person answers by email, their answer arrives in the charity's normal mailbox (the Reply-To address).

if (!defined('ABSPATH')) exit;

add_action('init', function () {
  register_post_type('mm_reply', [
    'label' => 'Replies',
    'public' => false,
    'show_ui' => false,
    'supports' => ['title', 'editor', 'author'],
    'show_in_rest' => false,
  ]);
});

function mm_email_key($email) {
  return strtolower(trim((string) $email));
}

// All conversations, newest activity first:
// [email => ['email', 'name', 'last' (UTC), 'unread', 'count', 'preview', 'reason', 'replied']]
function mm_conversations() {
  $threads = [];
  foreach (get_posts(['post_type' => 'mm_message', 'post_status' => 'any', 'numberposts' => -1, 'orderby' => 'date', 'order' => 'DESC']) as $m) {
    $key = mm_email_key(get_post_meta($m->ID, 'mm_email', true));
    if ($key === '') continue;
    if (!isset($threads[$key])) {
      $threads[$key] = [
        'email' => $key,
        'name' => $m->post_title,
        'last' => $m->post_date_gmt,
        'unread' => 0,
        'count' => 0,
        'preview' => $m->post_content,
        'reason' => get_post_meta($m->ID, 'mm_reason', true),
        'replied' => false,
      ];
    }
    $threads[$key]['count']++;
    if (get_post_meta($m->ID, 'mm_isRead', true) !== '1') $threads[$key]['unread']++;
  }
  foreach (get_posts(['post_type' => 'mm_reply', 'post_status' => 'any', 'numberposts' => -1, 'orderby' => 'date', 'order' => 'ASC']) as $r) {
    $key = mm_email_key(get_post_meta($r->ID, 'mm_email', true));
    if (!isset($threads[$key])) continue;
    $threads[$key]['replied'] = true;
    if ($r->post_date_gmt >= $threads[$key]['last']) {
      $threads[$key]['last'] = $r->post_date_gmt;
      $threads[$key]['preview'] = 'You: ' . $r->post_content;
    }
  }
  uasort($threads, function ($a, $b) { return strcmp($b['last'], $a['last']); });
  return $threads;
}

// One conversation, oldest first: [['type' => 'in'|'out', 'post' => WP_Post]]
function mm_conversation($email) {
  $key = mm_email_key($email);
  $items = [];
  foreach (['mm_message' => 'in', 'mm_reply' => 'out'] as $type => $direction) {
    $posts = get_posts([
      'post_type' => $type,
      'post_status' => 'any',
      'numberposts' => -1,
      'meta_query' => [['key' => 'mm_email', 'value' => $key]], // MySQL compares without caring about capitals
    ]);
    foreach ($posts as $p) {
      if (mm_email_key(get_post_meta($p->ID, 'mm_email', true)) === $key) $items[] = ['type' => $direction, 'post' => $p];
    }
  }
  usort($items, function ($a, $b) { return strcmp($a['post']->post_date_gmt, $b['post']->post_date_gmt) ?: $a['post']->ID - $b['post']->ID; });
  return $items;
}

// ---------- Send a reply from the panel ----------

add_action('admin_post_mm_panel_reply', function () {
  mm_panel_check('mm_panel_reply');
  $post = wp_unslash($_POST);
  $email = mm_email_key(isset($post['with']) ? $post['with'] : '');
  $back = function ($args) use ($email) {
    mm_redirect(mm_panel_url('messages', $args + ['with' => $email]) . '#reply');
  };

  // Only people who wrote to us through the website can be answered here (the panel is not an open mail server)
  $conversation = $email !== '' ? mm_conversation($email) : [];
  $incoming = array_values(array_filter($conversation, function ($i) { return $i['type'] === 'in'; }));
  if (!$incoming || !is_email($email)) wp_die('Conversation not found', 'Minority Matters', ['response' => 404]);

  $subject = sanitize_text_field(isset($post['subject']) ? $post['subject'] : '');
  if ($subject === '') $subject = 'Re: your message to Minority Matters';
  $body = sanitize_textarea_field(str_replace("\r\n", "\n", isset($post['body']) ? $post['body'] : ''));
  if (trim($body) === '') $back(['problem' => 'empty']);
  if (mb_strlen($body) > 10000) $back(['problem' => 'long']);
  $files = mm_reply_files();
  if (is_string($files)) $back(['problem' => $files]);

  // The email: the reply, a signature, and the person's last message underneath
  $user = wp_get_current_user();
  $last = end($incoming)['post'];
  $text = $body . "\n\n"
    . "--\n" . $user->display_name . "\nMinority Matters\n" . home_url('/') . "\n\n"
    . '----- Your message of ' . get_the_date('j F Y', $last) . " -----\n"
    . $last->post_content;
  $reply_to = trim(mm_setting('contactNotifyEmail')) ?: trim(mm_setting('email'));
  $headers = is_email($reply_to) ? ['Reply-To: Minority Matters <' . $reply_to . '>'] : [];
  $sent = wp_mail($email, $subject, $text, $headers, mm_attachment_paths($files));

  // Saved either way, so the conversation shows what was written
  $id = wp_insert_post([
    'post_type' => 'mm_reply',
    'post_status' => 'private',
    'post_title' => $subject,
    'post_content' => $body,
    'post_author' => $user->ID,
  ]);
  if ($id && !is_wp_error($id)) {
    update_post_meta($id, 'mm_email', $email);
    update_post_meta($id, 'mm_sent', $sent ? '1' : '0');
    if ($files) update_post_meta($id, 'mm_files', $files);
  }
  foreach ($incoming as $i) update_post_meta($i['post']->ID, 'mm_isRead', '1');
  $back($sent ? ['sent' => 1] : ['problem' => 'mail']);
});

// Delete a whole conversation (the messages and the replies)
add_action('admin_post_mm_panel_conversation_delete', function () {
  mm_panel_check('mm_panel_conversation_delete');
  $email = mm_email_key(isset($_POST['with']) ? wp_unslash($_POST['with']) : '');
  foreach (mm_conversation($email) as $item) wp_delete_post($item['post']->ID, true);
  mm_redirect(mm_panel_url('messages', ['deleted' => 1]));
});

// ---------- Files sent with a reply ----------
// They are kept in wp-content/uploads/mm-attachments/<random>/<name>, a folder the web server never serves
// (.htaccess), so only people who may use the panel can download them (admin-post.php?action=mm_panel_file).

const MM_ATTACH_MAX = 5;
const MM_ATTACH_SIZE = 10 * MB_IN_BYTES; // each file
const MM_ATTACH_TOTAL = 20 * MB_IN_BYTES; // together (Gmail accepts emails up to 25 MB)
const MM_ATTACH_TYPES = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'rtf', 'txt', 'csv', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'zip'];

function mm_attach_dir() {
  $dir = wp_upload_dir()['basedir'] . '/mm-attachments';
  if (!is_dir($dir)) {
    wp_mkdir_p($dir);
    file_put_contents($dir . '/.htaccess', "Require all denied\nDeny from all\n");
    file_put_contents($dir . '/index.php', "<?php // Silence\n");
  }
  return $dir;
}

// The uploaded files of the reply form, checked and saved: [['name', 'file' (inside mm-attachments), 'size']],
// or the problem code ('files', 'file-type', 'file-size', 'file-failed') when one is not allowed
function mm_reply_files() {
  if (empty($_FILES['files']['name']) || !is_array($_FILES['files']['name'])) return [];
  $up = $_FILES['files'];
  $chosen = [];
  foreach ($up['name'] as $i => $name) {
    if ($up['error'][$i] === UPLOAD_ERR_NO_FILE) continue;
    if (in_array($up['error'][$i], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true) || $up['size'][$i] > MM_ATTACH_SIZE) return 'file-size';
    if ($up['error'][$i] !== UPLOAD_ERR_OK || !is_uploaded_file($up['tmp_name'][$i])) return 'file-failed';
    $name = sanitize_file_name(wp_unslash($name));
    if (!in_array(strtolower(pathinfo($name, PATHINFO_EXTENSION)), MM_ATTACH_TYPES, true)) return 'file-type';
    $chosen[] = ['name' => $name, 'tmp' => $up['tmp_name'][$i], 'size' => (int) $up['size'][$i]];
  }
  if (count($chosen) > MM_ATTACH_MAX) return 'files';
  if (array_sum(array_column($chosen, 'size')) > MM_ATTACH_TOTAL) return 'file-size';

  $saved = [];
  foreach ($chosen as $f) {
    $folder = wp_generate_password(24, false, false);
    $dir = mm_attach_dir() . '/' . $folder;
    if (!wp_mkdir_p($dir) || !move_uploaded_file($f['tmp'], $dir . '/' . $f['name'])) return 'file-failed';
    $saved[] = ['name' => $f['name'], 'file' => $folder . '/' . $f['name'], 'size' => $f['size']];
  }
  return $saved;
}

function mm_attachment_paths($files) {
  $dir = mm_attach_dir();
  return array_map(function ($f) use ($dir) { return $dir . '/' . $f['file']; }, $files ?: []);
}

// The download link of one file of a reply
function mm_attachment_url($reply_id, $n) {
  return add_query_arg(['action' => 'mm_panel_file', 'id' => (int) $reply_id, 'n' => (int) $n], admin_url('admin-post.php'));
}

add_action('admin_post_mm_panel_file', function () {
  if (!current_user_can('mm_manage')) wp_die('Not allowed', 'Minority Matters', ['response' => 403]);
  $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
  $n = isset($_GET['n']) ? (int) $_GET['n'] : -1;
  $files = get_post_type($id) === 'mm_reply' ? get_post_meta($id, 'mm_files', true) : [];
  $f = is_array($files) && isset($files[$n]) ? $files[$n] : null;
  $base = realpath(mm_attach_dir());
  $path = $f ? realpath($base . '/' . $f['file']) : false;
  if (!$path || strpos($path, $base . DIRECTORY_SEPARATOR) !== 0) wp_die('File not found', 'Minority Matters', ['response' => 404]);
  nocache_headers();
  header('Content-Type: application/octet-stream');
  header('Content-Disposition: attachment; filename="' . str_replace('"', '', $f['name']) . '"');
  header('Content-Length: ' . filesize($path));
  header('X-Content-Type-Options: nosniff');
  readfile($path);
  exit;
});

// Deleting a reply (for example with "Delete conversation") deletes its files too
add_action('before_delete_post', function ($id) {
  if (get_post_type($id) !== 'mm_reply') return;
  $files = get_post_meta($id, 'mm_files', true);
  foreach (is_array($files) ? $files : [] as $f) {
    $path = mm_attach_dir() . '/' . $f['file'];
    if (is_file($path)) unlink($path);
    if (is_dir(dirname($path))) @rmdir(dirname($path));
  }
});

// ---------- Live updates: the panel asks every few seconds whether anything changed ----------

// A short fingerprint of the inbox: it changes when a message or reply is added, deleted or (un)read
function mm_inbox_stamp() {
  global $wpdb;
  $posts = $wpdb->get_results("SELECT post_type, COUNT(*) AS n, MAX(ID) AS last, MAX(post_modified_gmt) AS changed FROM {$wpdb->posts} WHERE post_type IN ('mm_message', 'mm_reply') GROUP BY post_type ORDER BY post_type", ARRAY_A);
  $unread = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->postmeta} m JOIN {$wpdb->posts} p ON p.ID = m.post_id WHERE p.post_type = 'mm_message' AND m.meta_key = 'mm_isRead' AND m.meta_value <> '1'");
  return substr(md5(wp_json_encode([$posts, $unread])), 0, 12);
}

// The address panel.js asks (admin-post.php?action=mm_panel_poll), with its security code
function mm_poll_url() {
  return add_query_arg(['action' => 'mm_panel_poll', '_wpnonce' => wp_create_nonce('mm_panel_poll')], admin_url('admin-post.php'));
}

add_action('admin_post_mm_panel_poll', function () {
  nocache_headers();
  if (!current_user_can('mm_manage') || !wp_verify_nonce(isset($_GET['_wpnonce']) ? $_GET['_wpnonce'] : '', 'mm_panel_poll')) {
    wp_send_json(['stamp' => ''], 403);
  }
  mm_sync_replies(); // new email answers too (at most once a minute)
  wp_send_json(['stamp' => mm_inbox_stamp()]);
});
