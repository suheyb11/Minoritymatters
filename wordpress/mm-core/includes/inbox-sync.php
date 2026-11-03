<?php
// Brings email answers into /admin/messages: when someone who wrote through the website answers a reply
// by email, their email arrives in the charity's Google mailbox (info@…). This file reads that mailbox (IMAP,
// with the same Google account and App password as "Email sending") and adds those answers to the person's
// conversation, so the whole history is in one place.
//
// Only emails FROM people who already have a conversation are copied; everything else in the mailbox is
// left alone. The mailbox is opened read-only, so nothing there is marked as read, moved or deleted.
// It runs when /admin/messages is opened (at most once a minute) and every 10 minutes (WordPress cron).

if (!defined('ABSPATH')) exit;

const MM_REPLY_REASON = 'Email reply';

// ---------- A small IMAP client (only what we need: log in, find, read) ----------

class MM_Imap {
  private $fp;
  private $tag = 0;

  public function __construct($host, $port, $user, $pass) {
    $context = stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true, 'SNI_enabled' => true]]);
    $this->fp = @stream_socket_client('ssl://' . $host . ':' . (int) $port, $errno, $errstr, 15, STREAM_CLIENT_CONNECT, $context);
    if (!$this->fp) throw new Exception('Could not connect to ' . $host . ($errstr ? ' (' . $errstr . ')' : ''));
    stream_set_timeout($this->fp, 20);
    $this->line(); // the server's greeting
    $this->command('LOGIN ' . $this->quote($user) . ' ' . $this->quote($pass));
  }

  public function quote($text) {
    return '"' . addcslashes((string) $text, '"\\') . '"';
  }

  private function line() {
    $line = fgets($this->fp);
    if ($line === false) throw new Exception('The mail server stopped answering.');
    return $line;
  }

  // Sends one command; returns the untagged answer lines, with every {n} literal joined into its line
  public function command($command) {
    $tag = 'A' . (++$this->tag);
    fwrite($this->fp, $tag . ' ' . $command . "\r\n");
    $lines = [];
    while (true) {
      $line = $this->line();
      // A literal: "... {1234}\r\n" followed by exactly 1234 bytes
      while (preg_match('/\{(\d+)\}\r\n$/', $line, $m)) {
        $size = (int) $m[1];
        $data = '';
        while (strlen($data) < $size) {
          $chunk = fread($this->fp, $size - strlen($data));
          if ($chunk === false || $chunk === '') throw new Exception('The mail server stopped answering.');
          $data .= $chunk;
        }
        $line .= $data . $this->line();
      }
      if (strpos($line, $tag . ' ') === 0) {
        if (!preg_match('/^' . $tag . ' OK/i', $line)) throw new Exception(trim(substr($line, strlen($tag) + 1)));
        return $lines;
      }
      $lines[] = $line;
    }
  }

  // The "All Mail" folder (special-use \All), so answers are found even after they were archived; else the inbox
  public function all_mail_folder() {
    foreach ($this->command('LIST "" "*"') as $line) {
      if (stripos($line, '\\All') !== false && preg_match('/"([^"]+)"\s*$/', trim($line), $m)) return $m[1];
    }
    return 'INBOX';
  }

  public function examine($folder) {
    $this->command('EXAMINE ' . $this->quote($folder)); // read-only
  }

  public function search_from($email, $since_timestamp) {
    $lines = $this->command('UID SEARCH SINCE ' . gmdate('j-M-Y', $since_timestamp) . ' FROM ' . $this->quote($email));
    foreach ($lines as $line) {
      if (preg_match('/^\* SEARCH ?(.*)$/', trim($line), $m)) return array_values(array_filter(array_map('intval', preg_split('/\s+/', $m[1]))));
    }
    return [];
  }

  // The whole email (headers + body), without marking it as read
  public function fetch($uid) {
    $lines = $this->command('UID FETCH ' . (int) $uid . ' BODY.PEEK[]');
    foreach ($lines as $line) {
      if (preg_match('/BODY\[\] \{(\d+)\}\r\n/', $line, $m, PREG_OFFSET_CAPTURE)) {
        return substr($line, $m[0][1] + strlen($m[0][0]), (int) $m[1][0]);
      }
    }
    return '';
  }

  public function close() {
    try {
      $this->command('LOGOUT');
    } catch (Exception $e) {
      // the server may close first
    }
    fclose($this->fp);
  }
}

// ---------- Reading an email ----------

// Raw email -> ['headers' => [name => value], 'text' => the plain text]
function mm_mime_parse($raw) {
  $raw = str_replace("\r\n", "\n", (string) $raw);
  $split = strpos($raw, "\n\n");
  $head = $split === false ? $raw : substr($raw, 0, $split);
  $body = $split === false ? '' : substr($raw, $split + 2);
  $headers = [];
  foreach (explode("\n", preg_replace("/\n[ \t]+/", ' ', $head)) as $line) {
    $colon = strpos($line, ':');
    if ($colon === false) continue;
    $name = strtolower(trim(substr($line, 0, $colon)));
    if (!isset($headers[$name])) $headers[$name] = trim(substr($line, $colon + 1));
  }
  return ['headers' => $headers, 'text' => mm_mime_text($headers, $body)];
}

// The readable text of a part: the first text/plain, or else text/html without its tags
function mm_mime_text($headers, $body) {
  $type = isset($headers['content-type']) ? $headers['content-type'] : 'text/plain';
  if (preg_match('#^multipart/#i', $type) && preg_match('/boundary="?([^";]+)"?/i', $type, $m)) {
    $parts = explode('--' . $m[1], $body);
    $html = '';
    foreach (array_slice($parts, 1) as $part) {
      if (strpos($part, '--') === 0) break; // the closing boundary
      $parsed = mm_mime_parse(ltrim($part, "\n"));
      $part_type = isset($parsed['headers']['content-type']) ? $parsed['headers']['content-type'] : 'text/plain';
      if (stripos($part_type, 'text/plain') === 0 || stripos($part_type, 'multipart/') === 0) {
        if (trim($parsed['text']) !== '') return $parsed['text'];
      } elseif (stripos($part_type, 'text/html') === 0 && $html === '') {
        $html = $parsed['text'];
      }
    }
    return $html;
  }
  $encoding = isset($headers['content-transfer-encoding']) ? strtolower($headers['content-transfer-encoding']) : '';
  if ($encoding === 'base64') $body = base64_decode(preg_replace('/\s+/', '', $body));
  if ($encoding === 'quoted-printable') $body = quoted_printable_decode($body);
  if (preg_match('/charset="?([^";\s]+)"?/i', $type, $m) && strtolower($m[1]) !== 'utf-8' && strtolower($m[1]) !== 'us-ascii') {
    $converted = @mb_convert_encoding($body, 'UTF-8', $m[1]);
    if ($converted !== false) $body = $converted;
  }
  if (stripos($type, 'text/html') === 0) {
    $body = preg_replace('#<(br|/p|/div|/li|/tr)[^>]*>#i', "\n", $body);
    $body = html_entity_decode(wp_strip_all_tags($body), ENT_QUOTES, 'UTF-8');
  }
  return $body;
}

// "=?UTF-8?B?…?=" (encoded words in headers) -> readable text
function mm_mime_header($value) {
  if (function_exists('iconv_mime_decode')) {
    $decoded = @iconv_mime_decode((string) $value, ICONV_MIME_DECODE_CONTINUE_ON_ERROR, 'UTF-8');
    if ($decoded !== false) return $decoded;
  }
  return function_exists('mb_decode_mimeheader') ? mb_decode_mimeheader((string) $value) : (string) $value;
}

// The answer only: everything from the quoted earlier email ("On … wrote:", "> …", Outlook's "From:") is cut off
function mm_strip_quoted($text) {
  $lines = explode("\n", str_replace("\r\n", "\n", (string) $text));
  $out = [];
  foreach ($lines as $i => $line) {
    $t = trim($line);
    $next = isset($lines[$i + 1]) ? trim($lines[$i + 1]) : '';
    if (preg_match('/^On .{5,200}wrote:$/i', $t)) break; // Gmail, Apple Mail
    if (preg_match('/^On .{5,200}/i', $t) && preg_match('/wrote:$/i', $next) && strlen($t . $next) < 300) break; // the same on two lines
    if (preg_match('/^-{2,}\s*(Original Message|Your message of)/i', $t)) break; // Outlook, and our own quote
    if (preg_match('/^_{10,}$/', $t)) break; // Outlook's line
    if (preg_match('/^From: .+/i', $t) && preg_match('/^(Sent|Date): /i', $next)) break; // Outlook's header block
    if (strpos($t, '>') === 0) continue; // a quoted line
    $out[] = rtrim($line);
  }
  $text = trim(implode("\n", $out));
  return preg_replace("/\n{3,}/", "\n\n", $text);
}

// ---------- Copying answers into conversations ----------

// Returns the number of answers added, or a WP_Error. $force skips the once-a-minute limit.
function mm_sync_replies($force = false) {
  if (!mm_mail_ready()) return 0;
  if (!$force && get_transient('mm_sync_recent')) return 0;
  set_transient('mm_sync_recent', 1, MINUTE_IN_SECONDS);

  // People who wrote through the website, with when they first wrote (only the last 6 months)
  $people = [];
  foreach (get_posts(['post_type' => 'mm_message', 'post_status' => 'any', 'numberposts' => -1, 'date_query' => [['after' => '6 months ago']], 'orderby' => 'date', 'order' => 'ASC']) as $m) {
    $email = mm_email_key(get_post_meta($m->ID, 'mm_email', true));
    if (is_email($email) && !isset($people[$email]) && get_post_meta($m->ID, 'mm_reason', true) !== MM_REPLY_REASON) {
      $people[$email] = ['since' => strtotime($m->post_date_gmt . ' UTC') - DAY_IN_SECONDS, 'name' => $m->post_title];
    }
  }
  // Only people we have answered can answer back
  $answered = [];
  foreach (get_posts(['post_type' => 'mm_reply', 'post_status' => 'any', 'numberposts' => -1, 'fields' => 'ids']) as $id) {
    $answered[mm_email_key(get_post_meta($id, 'mm_email', true))] = true;
  }
  $people = array_intersect_key($people, $answered);
  if (!$people) return 0;

  $settings = mm_mail_settings();
  $own = mm_email_key($settings['from'] ?: $settings['user']);
  $seen = get_option('mm_imap_seen', []);
  $seen = is_array($seen) ? $seen : [];
  $added = 0;
  try {
    $imap = new MM_Imap(isset($settings['imap_host']) && $settings['imap_host'] ? $settings['imap_host'] : 'imap.gmail.com', 993, $settings['user'], mm_mail_decrypt($settings['pass']));
    $folder = $imap->all_mail_folder();
    $imap->examine($folder);
    $started = time();
    foreach ($people as $email => $person) {
      if ($email === $own || time() - $started > 25) continue; // never our own address; stop before PHP times out
      foreach ($imap->search_from($email, $person['since']) as $uid) {
        $key = $folder . ':' . $uid;
        if (isset($seen[$key])) continue;
        $seen[$key] = 1;
        $mail = mm_mime_parse($imap->fetch($uid));
        $added += mm_add_email_reply($email, $person['name'], $mail) ? 1 : 0;
      }
    }
    $imap->close();
    delete_transient('mm_imap_error');
  } catch (Exception $e) {
    set_transient('mm_imap_error', $e->getMessage(), HOUR_IN_SECONDS);
    update_option('mm_imap_seen', array_slice($seen, -5000, null, true), false);
    return new WP_Error('mm_imap', $e->getMessage());
  }
  update_option('mm_imap_seen', array_slice($seen, -5000, null, true), false);
  return $added;
}

// Adds one email answer to the person's conversation (once: the email's Message-ID is remembered)
function mm_add_email_reply($email, $name, $mail) {
  $headers = $mail['headers'];
  $message_id = isset($headers['message-id']) ? trim($headers['message-id']) : '';
  if ($message_id !== '' && get_posts(['post_type' => 'mm_message', 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids', 'meta_key' => 'mm_msgid', 'meta_value' => $message_id])) {
    return false;
  }
  $text = sanitize_textarea_field(mm_strip_quoted($mail['text']));
  if ($text === '') return false;
  $time = isset($headers['date']) ? strtotime($headers['date']) : false;
  $gmt = gmdate('Y-m-d H:i:s', $time ?: time());
  $id = wp_insert_post([
    'post_type' => 'mm_message',
    'post_status' => 'private',
    'post_title' => $name,
    'post_content' => mb_substr($text, 0, 20000),
    'post_date_gmt' => $gmt,
    'post_date' => get_date_from_gmt($gmt),
  ]);
  if (!$id || is_wp_error($id)) return false;
  update_post_meta($id, 'mm_email', $email);
  update_post_meta($id, 'mm_reason', MM_REPLY_REASON);
  update_post_meta($id, 'mm_isRead', '0');
  update_post_meta($id, 'mm_msgid', $message_id);
  update_post_meta($id, 'mm_subject', sanitize_text_field(mm_mime_header(isset($headers['subject']) ? $headers['subject'] : '')));
  return true;
}

// Every 10 minutes (WordPress runs this when the website gets visits)
add_filter('cron_schedules', function ($schedules) {
  $schedules['mm_ten_minutes'] = ['interval' => 10 * MINUTE_IN_SECONDS, 'display' => 'Every 10 minutes'];
  return $schedules;
});
add_action('init', function () {
  if (!wp_next_scheduled('mm_sync_replies')) wp_schedule_event(time() + 60, 'mm_ten_minutes', 'mm_sync_replies');
});
add_action('mm_sync_replies', function () {
  mm_sync_replies();
});

// "Check for email replies" button in /admin/messages
add_action('admin_post_mm_panel_sync', function () {
  mm_panel_check('mm_panel_sync');
  $result = mm_sync_replies(true);
  $with = isset($_POST['with']) ? mm_email_key(wp_unslash($_POST['with'])) : '';
  $args = is_wp_error($result) ? ['problem' => 'imap'] : ['checked' => (int) $result];
  if ($with) $args['with'] = $with;
  mm_redirect(mm_panel_url('messages', $args));
});
