<?php
// How the website sends email (contact form copies, booking notices, replies from /admin/messages).
//
// The charity's email is Google Workspace. Email that the web server sends by itself, from
// "wordpress@minoritymatters.org.uk", is not signed by Google, so Gmail and Outlook put it in Spam.
// With "Email sending" filled in (/admin/settings, Administrators only), every email goes out through
// Google's mail server (SMTP) from the charity's own address, for example info@minoritymatters.org.uk.
// Google signs it, so it reaches the inbox, and a copy appears in that mailbox's "Sent" folder.
//
// The settings are one WordPress option, "mm_mail": from, user, pass (encrypted), host, port.

if (!defined('ABSPATH')) exit;

function mm_mail_settings() {
  $saved = get_option('mm_mail', []);
  $saved = is_array($saved) ? $saved : [];
  return array_merge(['from' => '', 'user' => '', 'pass' => '', 'host' => 'smtp.gmail.com', 'port' => 587], $saved);
}

// The password is kept encrypted with this site's secret keys (wp-config.php), not as plain text
function mm_mail_encrypt($text) {
  if ($text === '' || !function_exists('openssl_encrypt')) return $text;
  $key = hash('sha256', wp_salt('auth'), true);
  $iv = random_bytes(16);
  return 'enc:' . base64_encode($iv . openssl_encrypt($text, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv));
}

function mm_mail_decrypt($text) {
  if (strpos((string) $text, 'enc:') !== 0 || !function_exists('openssl_decrypt')) return (string) $text;
  $raw = base64_decode(substr($text, 4));
  $key = hash('sha256', wp_salt('auth'), true);
  $plain = openssl_decrypt(substr($raw, 16), 'aes-256-cbc', $key, OPENSSL_RAW_DATA, substr($raw, 0, 16));
  return $plain === false ? '' : $plain;
}

function mm_mail_ready() {
  $m = mm_mail_settings();
  return is_email($m['user']) && $m['pass'] !== '';
}

// Every email says it comes from "Minority Matters" at the charity's address
add_filter('wp_mail_from_name', function ($name) {
  return $name === 'WordPress' ? 'Minority Matters' : $name;
});
add_filter('wp_mail_from', function ($from) {
  $m = mm_mail_settings();
  $address = is_email($m['from']) ? $m['from'] : (is_email($m['user']) ? $m['user'] : '');
  return $address && strpos($from, 'wordpress@') === 0 ? $address : $from;
});

// Send through Google (or another SMTP server) when it is set up
add_action('phpmailer_init', function ($mailer) {
  if (!mm_mail_ready()) return;
  $m = mm_mail_settings();
  $mailer->isSMTP();
  $mailer->Host = $m['host'];
  $mailer->Port = (int) $m['port'];
  $mailer->SMTPAuth = true;
  $mailer->SMTPSecure = (int) $m['port'] === 465 ? 'ssl' : 'tls';
  $mailer->Username = $m['user'];
  $mailer->Password = mm_mail_decrypt($m['pass']);
  $mailer->Timeout = 20;
  $mailer->Sender = $mailer->From; // the "return path", so bounces come back to the charity
});

// The last email error, so the panel can show what went wrong
add_action('wp_mail_failed', function ($error) {
  set_transient('mm_mail_error', $error->get_error_message(), 10 * MINUTE_IN_SECONDS);
});

// ---------- /admin/settings: save the email sending settings, and send a test (Administrators only) ----------

add_action('admin_post_mm_panel_mail', function () {
  mm_panel_check('mm_panel_mail');
  if (!current_user_can('manage_options')) wp_die('Only an Administrator can change how email is sent.', 'Minority Matters', ['response' => 403]);
  $post = wp_unslash($_POST);
  $old = mm_mail_settings();
  $port = isset($post['port']) ? (int) $post['port'] : 587;
  $new = [
    'from' => sanitize_email(isset($post['from']) ? $post['from'] : ''),
    'user' => sanitize_email(isset($post['user']) ? $post['user'] : ''),
    // An empty password box keeps the saved password (it is never shown again)
    'pass' => isset($post['pass']) && $post['pass'] !== '' ? mm_mail_encrypt(preg_replace('/\s+/', '', $post['pass'])) : $old['pass'],
    'host' => sanitize_text_field(isset($post['host']) && $post['host'] !== '' ? $post['host'] : 'smtp.gmail.com'),
    'port' => in_array($port, [25, 465, 587, 2525], true) ? $port : 587,
  ];
  if (!empty($post['forget'])) $new['pass'] = '';
  update_option('mm_mail', $new, false);
  mm_redirect(mm_panel_url('settings', ['mail' => 'saved']) . '#mail');
});

add_action('admin_post_mm_panel_mail_test', function () {
  mm_panel_check('mm_panel_mail_test');
  if (!current_user_can('manage_options')) wp_die('Not allowed', 'Minority Matters', ['response' => 403]);
  $to = sanitize_email(isset($_POST['to']) ? wp_unslash($_POST['to']) : '');
  if (!is_email($to)) mm_redirect(mm_panel_url('settings', ['mail' => 'bad-to']) . '#mail');
  delete_transient('mm_mail_error');
  $ok = wp_mail($to, 'Test email from the Minority Matters website', "This is a test email from the website.\n\nIf it arrived in your inbox (not Spam), email sending works.\n\n" . home_url('/'));
  mm_redirect(mm_panel_url('settings', ['mail' => $ok ? 'sent' : 'failed', 'to' => $to]) . '#mail');
});
