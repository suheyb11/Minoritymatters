<?php
// Event bookings: the booking form on an event page, Admin > Events > Bookings, the CSV download
// and the "Add to calendar" file (/events/<event>/ics/).
// Bookings live in their own table (wp_mm_bookings), so they are never shown on public pages (only counts).

if (!defined('ABSPATH')) exit;

// Bookings hold personal details (names, emails, children's ages): only Website managers and
// Administrators may see, download or change them (the mm_manage capability, see includes/manager.php).
const MM_BOOKINGS_CAP = 'mm_manage';

function mm_bookings_table() {
  global $wpdb;
  return $wpdb->prefix . 'mm_bookings';
}

// Creates (or updates) the table. Run on plugin activation.
function mm_create_bookings_table() {
  global $wpdb;
  require_once ABSPATH . 'wp-admin/includes/upgrade.php';
  $table = mm_bookings_table();
  $charset = $wpdb->get_charset_collate();
  dbDelta("CREATE TABLE $table (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  event_id bigint(20) unsigned NOT NULL,
  name varchar(200) NOT NULL DEFAULT '',
  email varchar(200) NOT NULL DEFAULT '',
  phone varchar(50) NOT NULL DEFAULT '',
  adults int(11) NOT NULL DEFAULT 1,
  children int(11) NOT NULL DEFAULT 0,
  child_ages varchar(200) NOT NULL DEFAULT '',
  notes text NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'confirmed',
  created_at datetime NOT NULL,
  PRIMARY KEY  (id),
  KEY event_id (event_id)
) $charset;");
}

// ---------- Counts ----------

// Places taken = adults + children of confirmed and attended bookings
function mm_places_taken($event_id) {
  global $wpdb;
  $table = mm_bookings_table();
  return (int) $wpdb->get_var($wpdb->prepare(
    "SELECT COALESCE(SUM(adults + children), 0) FROM $table WHERE event_id = %d AND status IN ('confirmed', 'attended')",
    $event_id
  ));
}

// Places per status for one event: ['confirmed' => 18, 'waitlist' => 3, 'cancelled' => 0, 'attended' => 0]
function mm_booking_totals($event_id) {
  global $wpdb;
  $table = mm_bookings_table();
  $totals = array_fill_keys(MM_BOOKING_STATUSES, 0);
  $rows = $wpdb->get_results($wpdb->prepare(
    "SELECT status, SUM(adults + children) AS places FROM $table WHERE event_id = %d GROUP BY status",
    $event_id
  ));
  foreach ((array) $rows as $row) $totals[$row->status] = (int) $row->places;
  return $totals;
}

// ---------- The booking form ----------
// Posts to admin-post.php?action=mm_book. With JavaScript the theme sends it in the background and gets
// JSON back; without JavaScript we go back to the event page with ?booked=… or ?booking_error=….

add_action('admin_post_nopriv_mm_book', 'mm_handle_booking');
add_action('admin_post_mm_book', 'mm_handle_booking');

function mm_handle_booking() {
  $post = wp_unslash($_POST);
  $event_id = isset($post['eventId']) ? (int) $post['eventId'] : 0;
  $event_post = $event_id ? get_post($event_id) : null;
  $back = ($event_post && $event_post->post_type === 'mm_event') ? get_permalink($event_post) : home_url('/events/');

  // Hidden field: bots fill it, people don't. Pretend it worked so the bot moves on.
  if (!empty($post['website'])) mm_booking_reply($back, true, false, 'Thank you.');
  // At most 15 booking attempts per visitor in 10 minutes, so nobody can fill an event with fake bookings
  if (mm_too_many('book', 15)) mm_booking_fail($back, 'busy');

  if (!$event_post || $event_post->post_type !== 'mm_event' || $event_post->post_status !== 'publish') {
    mm_booking_fail($back, 'event');
  }
  $event = mm_row($event_post);

  // ---------- Is this event open for booking? ----------
  if (mm_is_finished($event)) mm_booking_fail($back, 'finished');
  if ($event['bookingClosesAt'] && $event['bookingClosesAt'] < mm_now()) mm_booking_fail($back, 'closed');
  if ($event['bookingType'] !== 'form') mm_booking_fail($back, 'type');

  // ---------- Are the details right? ----------
  $clean = function ($name, $max) use ($post) {
    $value = isset($post[$name]) ? (string) $post[$name] : '';
    return mb_substr(trim(sanitize_textarea_field(str_replace("\r\n", "\n", $value))), 0, $max);
  };
  $count = function ($name) use ($post) {
    $value = isset($post[$name]) ? trim((string) $post[$name]) : '0';
    if ($value === '') $value = '0';
    if (!preg_match('/^\d+$/', $value)) return null;
    return (int) $value <= 10 ? (int) $value : null;
  };
  $name = $clean('name', 200);
  $email = $clean('email', 200);
  $phone = $clean('phone', 50);
  $child_ages = $clean('childAges', 200);
  $notes = $clean('notes', 1000);
  $adults = $count('adults');
  $children = $count('children');

  if ($name === '' || $email === '') mm_booking_fail($back, 'missing');
  if (!is_email($email)) mm_booking_fail($back, 'email');
  if ($adults === null || $children === null) mm_booking_fail($back, 'count');
  if ($adults + $children < 1) mm_booking_fail($back, 'none');
  if (empty($post['consent'])) mm_booking_fail($back, 'consent');

  global $wpdb;
  $table = mm_bookings_table();

  // ---------- Not too many bookings from the same email ----------
  // (MySQL compares text without caring about capital letters, so "Ann@x.com" = "ann@x.com")
  $earlier = (int) $wpdb->get_var($wpdb->prepare(
    "SELECT COUNT(*) FROM $table WHERE event_id = %d AND email = %s AND status <> 'cancelled'",
    $event_id,
    $email
  ));
  if ($earlier >= 3) {
    mm_booking_fail($back, 'limit');
  }

  // ---------- Save: confirmed if there is room, otherwise the waiting list ----------
  // The lock makes two people booking at the same moment wait for each other, so the event can't be overbooked.
  $lock = 'mm_event_' . $event_id;
  $wpdb->get_var($wpdb->prepare('SELECT GET_LOCK(%s, 10)', $lock));
  $places = $adults + $children;
  $fits = $event['capacity'] === null || mm_places_taken($event_id) + $places <= $event['capacity'];
  $status = $fits ? 'confirmed' : 'waitlist';
  $saved = $wpdb->insert($table, [
    'event_id' => $event_id,
    'name' => $name,
    'email' => $email,
    'phone' => $phone,
    'adults' => $adults,
    'children' => $children,
    'child_ages' => $child_ages,
    'notes' => $notes,
    'status' => $status,
    'created_at' => gmdate('Y-m-d H:i:s'),
  ], ['%d', '%s', '%s', '%s', '%d', '%d', '%s', '%s', '%s', '%s']);
  $wpdb->get_var($wpdb->prepare('SELECT RELEASE_LOCK(%s)', $lock));

  if (!$saved) mm_booking_fail($back, 'failed');

  mm_notify_charity($event['title'], $name, $places, $status);

  if ($status === 'waitlist') {
    mm_booking_reply($back, true, true, "You're on the waiting list – we'll contact you if a place opens up.");
  }
  mm_booking_reply($back, true, false, sprintf("You're booked! We've saved your place for %s on %s.", $event['title'], mm_event_day($event['startsAt'])));
}

// The error messages of the booking form. The page address only carries the code (?booking_error=email),
// so nobody can make a link that shows their own text on our page.
function mm_booking_errors() {
  return [
    'event' => "Sorry, we couldn't find this event.",
    'finished' => 'Sorry, this event has finished.',
    'closed' => 'Sorry, booking for this event has closed.',
    'type' => "This event can't be booked with this form.",
    'missing' => 'Please fill in your name and email.',
    'email' => 'Please enter a valid email address.',
    'count' => 'Please choose between 0 and 10 adults and 0 and 10 children.',
    'none' => 'Please book at least 1 place.',
    'consent' => 'Please tick the box to agree to how we use your details.',
    'limit' => "You've already made 3 bookings for this event. Please contact us if you need to change them.",
    'busy' => 'Too many bookings from your connection. Please wait a few minutes and try again.',
    'failed' => 'Sorry, something went wrong. Please try again or contact us.',
  ];
}

// Answer the form when it worked: JSON for the theme's JavaScript, or back to the event page
function mm_booking_reply($back, $ok, $waitlist, $message) {
  if (!empty($_POST['ajax'])) wp_send_json(['ok' => true, 'waitlist' => $waitlist, 'message' => $message, 'error' => '']);
  mm_redirect(add_query_arg('booked', $waitlist ? 'waitlist' : 'confirmed', $back) . '#booking-title');
}

function mm_booking_fail($back, $code) {
  if (!empty($_POST['ajax'])) wp_send_json(['ok' => false, 'waitlist' => false, 'message' => '', 'error' => mm_booking_errors()[$code]]);
  mm_redirect(add_query_arg('booking_error', $code, $back) . '#booking-title');
}

// Email the charity a short notice. Only when "Booking notification email" is filled in under Site settings.
// A failed email never stops the booking.
function mm_notify_charity($event_title, $name, $places, $status) {
  $to = trim(mm_setting('bookingNotifyEmail'));
  if ($to === '' || !is_email($to)) return;
  $subject = 'New booking: ' . $event_title;
  $text = sprintf(
    "%s booked %d %s for %s (%s).\n\nSee all bookings in the admin: Events > Bookings.",
    $name,
    $places,
    $places === 1 ? 'place' : 'places',
    $event_title,
    $status
  );
  wp_mail($to, $subject, $text);
}

// ---------- Admin > Events > Bookings ----------

add_action('admin_menu', function () {
  add_submenu_page('edit.php?post_type=mm_event', 'Bookings', 'Bookings', MM_BOOKINGS_CAP, 'mm-bookings', 'mm_bookings_page');
});

function mm_bookings_page() {
  global $wpdb;
  $table = mm_bookings_table();
  $event_id = isset($_GET['event']) ? (int) $_GET['event'] : 0;
  echo '<div class="wrap">';

  if (!empty($_GET['saved'])) echo '<div class="notice notice-success is-dismissible"><p>Saved.</p></div>';
  if (isset($_GET['deleted_old'])) echo '<div class="notice notice-success is-dismissible"><p>' . (int) $_GET['deleted_old'] . ' old bookings deleted.</p></div>';

  // ---------- No event chosen: every event with its numbers ----------
  if (!$event_id) {
    echo '<h1>Bookings</h1><p>Choose an event to see its bookings.</p>';
    echo '<table class="widefat striped"><thead><tr><th>Event</th><th>When</th><th>Places</th><th>Confirmed</th><th>Waiting list</th><th>Attended</th></tr></thead><tbody>';
    foreach (mm_events_sorted(mm_rows('mm_event', true), true) as $event) {
      if ($event['bookingType'] !== 'form') continue;
      $totals = mm_booking_totals($event['id']);
      $url = admin_url('edit.php?post_type=mm_event&page=mm-bookings&event=' . $event['id']);
      echo '<tr><td><a href="' . esc_url($url) . '"><strong>' . esc_html($event['title']) . '</strong></a></td>';
      echo '<td>' . ($event['startsAt'] ? esc_html(mm_event_date($event['startsAt'], $event['endsAt'])) : '—') . '</td>';
      echo '<td>' . ($event['capacity'] === null ? 'unlimited' : (int) $event['capacity']) . '</td>';
      echo '<td>' . $totals['confirmed'] . '</td><td>' . $totals['waitlist'] . '</td><td>' . $totals['attended'] . '</td></tr>';
    }
    echo '</tbody></table>';

    $old = wp_nonce_url(admin_url('admin-post.php?action=mm_delete_old_bookings'), 'mm_delete_old_bookings');
    echo '<h2>Old bookings</h2><p>Bookings hold personal details. Delete the bookings of events that ended more than 12 months ago (the events themselves stay).</p>';
    echo '<p><a class="button" href="' . esc_url($old) . '" onclick="return confirm(\'Delete the bookings of every event that ended more than 12 months ago?\')">Delete old bookings</a></p>';
    echo '</div>';
    return;
  }

  // ---------- One event ----------
  $event_post = get_post($event_id);
  if (!$event_post || $event_post->post_type !== 'mm_event') {
    echo '<h1>Bookings</h1><p>Event not found.</p></div>';
    return;
  }
  $event = mm_row($event_post);
  $totals = mm_booking_totals($event_id);
  $bookings = $wpdb->get_results($wpdb->prepare("SELECT * FROM $table WHERE event_id = %d ORDER BY created_at ASC, id ASC", $event_id));
  $left = mm_places_left($event, $totals['confirmed'] + $totals['attended']);

  echo '<h1>Bookings: ' . esc_html($event['title']) . '</h1>';
  echo '<p>' . ($event['startsAt'] ? esc_html(mm_event_date($event['startsAt'], $event['endsAt'])) : '') . ' · ';
  echo $totals['confirmed'] . ' confirmed, ' . $totals['waitlist'] . ' on the waiting list, ' . $totals['attended'] . ' attended';
  if ($left !== null) echo ' · ' . $left . ' places left';
  echo '</p>';

  $csv = wp_nonce_url(admin_url('admin-post.php?action=mm_bookings_csv&event=' . $event_id), 'mm_bookings_csv_' . $event_id);
  $attended = wp_nonce_url(admin_url('admin-post.php?action=mm_mark_attended&event=' . $event_id), 'mm_mark_attended_' . $event_id);
  echo '<p><a class="button" href="' . esc_url(admin_url('edit.php?post_type=mm_event&page=mm-bookings')) . '">All events</a> ';
  echo '<a class="button" href="' . esc_url(get_edit_post_link($event_id)) . '">Edit event</a> ';
  echo '<a class="button" href="' . esc_url($csv) . '">Download CSV</a> ';
  echo '<a class="button" href="' . esc_url($attended) . '" onclick="return confirm(\'Mark every confirmed booking as attended?\')">Mark all confirmed as attended</a></p>';

  if (!$bookings) {
    echo '<p>No bookings yet.</p></div>';
    return;
  }

  echo '<table class="widefat striped"><thead><tr><th>Name</th><th>Contact</th><th>Places</th><th>Notes</th><th>Booked</th><th>Status</th><th></th></tr></thead><tbody>';
  foreach ($bookings as $b) {
    $places = $b->adults . ' ' . ($b->adults == 1 ? 'adult' : 'adults') . ', ' . $b->children . ' ' . ($b->children == 1 ? 'child' : 'children');
    if ($b->child_ages !== '') $places .= ' (ages ' . $b->child_ages . ')';
    $booked = mm_utc($b->created_at);
    $delete = wp_nonce_url(admin_url('admin-post.php?action=mm_delete_booking&id=' . $b->id), 'mm_delete_booking_' . $b->id);
    echo '<tr><td><strong>' . esc_html($b->name) . '</strong></td>';
    echo '<td><a href="mailto:' . esc_attr($b->email) . '">' . esc_html($b->email) . '</a>' . ($b->phone !== '' ? '<br>' . esc_html($b->phone) : '') . '</td>';
    echo '<td>' . esc_html($places) . '</td>';
    echo '<td>' . nl2br(esc_html($b->notes)) . '</td>';
    echo '<td>' . ($booked ? esc_html(mm_event_date($booked, null)) : '') . '</td>';
    echo '<td><span class="mm-status mm-status-' . esc_attr($b->status) . '">' . esc_html($b->status) . '</span>';
    echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '" style="margin-top:6px">';
    echo '<input type="hidden" name="action" value="mm_booking_status"><input type="hidden" name="id" value="' . (int) $b->id . '">';
    wp_nonce_field('mm_booking_status_' . $b->id);
    echo '<select name="status">';
    foreach (MM_BOOKING_STATUSES as $s) echo '<option value="' . esc_attr($s) . '"' . selected($b->status, $s, false) . '>' . esc_html($s) . '</option>';
    echo '</select> <button class="button button-small">Change</button></form></td>';
    echo '<td><a class="submitdelete" href="' . esc_url($delete) . '" onclick="return confirm(\'Delete this booking?\')">Delete</a></td></tr>';
  }
  echo '</tbody></table></div>';
}

function mm_booking_event_id($booking_id) {
  global $wpdb;
  return (int) $wpdb->get_var($wpdb->prepare('SELECT event_id FROM ' . mm_bookings_table() . ' WHERE id = %d', $booking_id));
}

// Back to the bookings list: the /admin panel sends its own page address as "back"
function mm_back_to_bookings($event_id) {
  $default = admin_url('edit.php?post_type=mm_event&page=mm-bookings&saved=1&event=' . $event_id);
  $back = isset($_REQUEST['back']) ? wp_validate_redirect(wp_unslash((string) $_REQUEST['back']), '') : '';
  mm_redirect($back ? add_query_arg('saved', '1', $back) : $default);
}

add_action('admin_post_mm_booking_status', function () {
  global $wpdb;
  $id = isset($_POST['id']) ? (int) $_POST['id'] : 0;
  check_admin_referer('mm_booking_status_' . $id);
  if (!current_user_can(MM_BOOKINGS_CAP)) wp_die('Not allowed');
  $status = isset($_POST['status']) ? sanitize_key($_POST['status']) : '';
  if (in_array($status, MM_BOOKING_STATUSES, true)) $wpdb->update(mm_bookings_table(), ['status' => $status], ['id' => $id]);
  mm_back_to_bookings(mm_booking_event_id($id));
});

add_action('admin_post_mm_delete_booking', function () {
  global $wpdb;
  $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
  check_admin_referer('mm_delete_booking_' . $id);
  if (!current_user_can(MM_BOOKINGS_CAP)) wp_die('Not allowed');
  $event_id = mm_booking_event_id($id);
  $wpdb->delete(mm_bookings_table(), ['id' => $id]);
  mm_back_to_bookings($event_id);
});

add_action('admin_post_mm_mark_attended', function () {
  global $wpdb;
  $event_id = isset($_GET['event']) ? (int) $_GET['event'] : 0;
  check_admin_referer('mm_mark_attended_' . $event_id);
  if (!current_user_can(MM_BOOKINGS_CAP)) wp_die('Not allowed');
  $wpdb->update(mm_bookings_table(), ['status' => 'attended'], ['event_id' => $event_id, 'status' => 'confirmed']);
  mm_back_to_bookings($event_id);
});

// Deletes the bookings of every event that ended more than 12 months ago (the events themselves stay)
add_action('admin_post_mm_delete_old_bookings', function () {
  global $wpdb;
  check_admin_referer('mm_delete_old_bookings');
  if (!current_user_can(MM_BOOKINGS_CAP)) wp_die('Not allowed');
  $cutoff = mm_now()->modify('-12 months');
  $deleted = 0;
  foreach (mm_rows('mm_event', true) as $event) {
    $end = $event['endsAt'] ? $event['endsAt'] : $event['startsAt'];
    if ($end && $end < $cutoff) $deleted += (int) $wpdb->delete(mm_bookings_table(), ['event_id' => $event['id']]);
  }
  mm_redirect(admin_url('edit.php?post_type=mm_event&page=mm-bookings&deleted_old=' . $deleted));
});

// An event deleted for good takes its bookings with it
add_action('before_delete_post', function ($post_id) {
  global $wpdb;
  if (get_post_type($post_id) === 'mm_event') $wpdb->delete(mm_bookings_table(), ['event_id' => $post_id]);
});

// ---------- CSV download ----------

// Put a value in quotes when it has a comma, quote or line break; quotes inside become "".
// Values starting with = + - @ get a ' in front, so a spreadsheet never runs them as a formula
// (phone numbers like "+44 20 7272 0039" are left as they are).
function mm_csv_cell($value) {
  $text = (string) $value;
  if (preg_match('/^[=+\-@]/', $text) && !preg_match('/^\+[\d\s()]+$/', $text)) $text = "'" . $text;
  return preg_match('/[",\r\n]/', $text) ? '"' . str_replace('"', '""', $text) . '"' : $text;
}

add_action('admin_post_mm_bookings_csv', function () {
  global $wpdb;
  $event_id = isset($_GET['event']) ? (int) $_GET['event'] : 0;
  check_admin_referer('mm_bookings_csv_' . $event_id);
  if (!current_user_can(MM_BOOKINGS_CAP)) wp_die('Not allowed');
  $event_post = get_post($event_id);
  if (!$event_post || $event_post->post_type !== 'mm_event') wp_die('Event not found');

  $rows = [['Name', 'Email', 'Phone', 'Adults', 'Children', "Children's ages", 'Notes', 'Status', 'Booked at']];
  $bookings = $wpdb->get_results($wpdb->prepare('SELECT * FROM ' . mm_bookings_table() . ' WHERE event_id = %d ORDER BY created_at ASC, id ASC', $event_id));
  foreach ($bookings as $b) {
    $booked = mm_utc($b->created_at);
    $rows[] = [$b->name, $b->email, $b->phone, $b->adults, $b->children, $b->child_ages, $b->notes, $b->status, $booked ? mm_event_date($booked, null) : ''];
  }
  nocache_headers();
  header('Content-Type: text/csv; charset=utf-8');
  header('Content-Disposition: attachment; filename="bookings-' . $event_post->post_name . '.csv"');
  // The byte order mark at the start helps Excel read letters like "é" and "£" correctly
  echo "\xEF\xBB\xBF";
  foreach ($rows as $row) echo implode(',', array_map('mm_csv_cell', $row)) . "\r\n";
  exit;
});

// ---------- "Copy" link on events: a hidden draft copy without bookings (handy for sessions that repeat) ----------

add_filter('post_row_actions', function ($actions, $post) {
  if ($post->post_type === 'mm_event' && current_user_can(MM_BOOKINGS_CAP)) {
    $url = wp_nonce_url(admin_url('admin-post.php?action=mm_copy_event&id=' . $post->ID), 'mm_copy_event_' . $post->ID);
    $actions['mm_copy'] = '<a href="' . esc_url($url) . '">Copy</a>';
    $actions['mm_bookings'] = '<a href="' . esc_url(admin_url('edit.php?post_type=mm_event&page=mm-bookings&event=' . $post->ID)) . '">Bookings</a>';
  }
  return $actions;
}, 10, 2);

add_action('admin_post_mm_copy_event', function () {
  $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
  check_admin_referer('mm_copy_event_' . $id);
  if (!current_user_can(MM_BOOKINGS_CAP)) wp_die('Not allowed');
  $source = get_post($id);
  if (!$source || $source->post_type !== 'mm_event') wp_die('Event not found');
  $copy = wp_insert_post([
    'post_type' => 'mm_event',
    'post_status' => 'draft',
    'post_title' => $source->post_title . ' (copy)',
    'menu_order' => $source->menu_order,
  ]);
  foreach (array_keys(mm_fields('mm_event')) as $key) {
    update_post_meta($copy, 'mm_' . $key, get_post_meta($id, 'mm_' . $key, true));
  }
  mm_redirect(get_edit_post_link($copy, 'raw'));
});

// ---------- /events/<event>/ics/: a calendar file for the "Add to calendar" button ----------

add_action('init', function () {
  add_rewrite_endpoint('ics', EP_PERMALINK);
});

// 2027-02-14 11:00 UTC -> "20270214T110000Z"
function mm_ics_date($date) {
  return $date->setTimezone(new DateTimeZone('UTC'))->format('Ymd\THis\Z');
}

// Commas, semicolons, backslashes and line breaks must be escaped in calendar text
function mm_ics_text($text) {
  return str_replace(["\\", ';', ',', "\r\n", "\n"], ["\\\\", '\;', '\,', '\n', '\n'], (string) $text);
}

// Lines longer than 75 bytes are split, and each extra line starts with a space (never inside a letter like "£")
function mm_ics_fold($line) {
  $parts = [];
  $current = '';
  foreach (preg_split('//u', $line, -1, PREG_SPLIT_NO_EMPTY) as $letter) {
    if (strlen($current . $letter) > 75) {
      $parts[] = $current;
      $current = ' ';
    }
    $current .= $letter;
  }
  $parts[] = $current;
  return implode("\r\n", $parts);
}

add_action('template_redirect', function () {
  global $wp_query;
  if (!is_singular('mm_event') || !isset($wp_query->query_vars['ics'])) return;
  $event = mm_row(get_queried_object());
  if (!$event['startsAt']) return;

  $url = get_permalink($event['id']);
  $end = $event['endsAt'] ? $event['endsAt'] : $event['startsAt']->modify('+1 hour'); // no end time: 1 hour
  $lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Minority Matters//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:event-' . $event['id'] . '@minoritymatters.org.uk',
    'DTSTAMP:' . mm_ics_date(mm_now()),
    'DTSTART:' . mm_ics_date($event['startsAt']),
    'DTEND:' . mm_ics_date($end),
    'SUMMARY:' . mm_ics_text($event['title']),
    'LOCATION:' . mm_ics_text(implode(', ', array_filter([$event['location'], $event['address']], 'strlen'))),
    'DESCRIPTION:' . mm_ics_text(implode("\n\n", array_filter([$event['summary'], $url], 'strlen'))),
    'URL:' . $url,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  header('Content-Type: text/calendar; charset=utf-8');
  header('Content-Disposition: attachment; filename="' . $event['slug'] . '.ics"');
  echo implode("\r\n", array_map('mm_ics_fold', $lines)) . "\r\n";
  exit;
});
