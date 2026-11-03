<?php
// Read functions and small helpers used by the theme (the same ones lib/db.ts had in the old website).
// A "row" is a plain array with the same keys as the old database: id, title, slug, sortOrder, published + the fields.

if (!defined('ABSPATH')) exit;

// ---------- Rows ----------

// One post -> a row. Numbers become int (or null when empty), checkboxes bool, dates DateTimeImmutable (UTC) or null.
function mm_row($post) {
  $post = get_post($post);
  $row = [
    'id' => $post->ID,
    'title' => $post->post_title,
    'slug' => $post->post_name,
    'sortOrder' => (int) $post->menu_order,
    'published' => $post->post_status === 'publish',
  ];
  foreach (mm_fields($post->post_type) as $key => $field) {
    $value = get_post_meta($post->ID, 'mm_' . $key, true);
    if ($value === '' && isset($field['default'])) $value = $field['default'];
    switch ($field['type']) {
      case 'number':
        $row[$key] = ($value === '' || $value === null) ? null : (int) $value;
        break;
      case 'checkbox':
        $row[$key] = $value === '1';
        break;
      case 'datetime':
        $row[$key] = mm_utc((string) $value);
        break;
      default:
        $row[$key] = (string) $value;
    }
  }
  return $row;
}

// Every row of a content type, in the admin's order (Order field, then oldest first)
function mm_rows($type, $include_hidden = false) {
  $posts = get_posts([
    'post_type' => $type,
    'post_status' => $include_hidden ? ['publish', 'draft', 'pending', 'private', 'future'] : 'publish',
    'numberposts' => -1,
    'orderby' => ['menu_order' => 'ASC', 'ID' => 'ASC'],
    'suppress_filters' => true,
  ]);
  return array_map('mm_row', $posts);
}

// One published row by slug, or null
function mm_row_by_slug($type, $slug) {
  $posts = get_posts(['post_type' => $type, 'name' => $slug, 'post_status' => 'publish', 'numberposts' => 1, 'suppress_filters' => true]);
  return $posts ? mm_row($posts[0]) : null;
}

// ---------- Site settings ----------

function mm_setting($key) {
  $settings = mm_settings();
  return isset($settings[$key]) ? (string) $settings[$key] : '';
}

// ---------- Text helpers ----------

// Split text into paragraphs (blank line = new paragraph)
function mm_paragraphs($text) {
  $parts = preg_split('/\n\s*\n/', str_replace("\r\n", "\n", (string) $text));
  return array_values(array_filter(array_map('trim', $parts), 'strlen'));
}

// Split text into lines (one bullet per line)
function mm_lines($text) {
  $parts = explode("\n", str_replace("\r\n", "\n", (string) $text));
  return array_values(array_filter(array_map('trim', $parts), 'strlen'));
}

// "93|boys aged 11–16" (one per line) -> [['number' => '93', 'label' => 'boys aged 11–16']]
function mm_stats($text) {
  return array_map(function ($line) {
    $parts = explode('|', $line);
    $number = trim(array_shift($parts));
    return ['number' => $number, 'label' => trim(implode('|', $parts))];
  }, mm_lines($text));
}

// Gallery lines: "path" or "path | description" -> [['src' => …, 'alt' => …]]
function mm_gallery($text, $title) {
  $lines = mm_lines($text);
  $count = count($lines);
  $out = [];
  foreach ($lines as $i => $line) {
    $parts = explode('|', $line);
    $src = trim(array_shift($parts));
    $alt = trim(implode('|', $parts));
    $out[] = ['src' => $src, 'alt' => $alt !== '' ? $alt : sprintf('%s, photo %d of %d', $title, $i + 1, $count)];
  }
  return $out;
}

// "Hello World!" -> "hello-world"
function mm_slug($text) {
  return trim(preg_replace('/[^a-z0-9]+/', '-', strtolower((string) $text)), '-');
}

// The address of an image. The old website stored two kinds of short addresses:
//   "/images/…"  pictures that come with the theme (theme folder assets/images)
//   "/media/…"   pictures uploaded in the old admin (copied to wp-content/uploads/mm-media, see HOSTINGER.md)
// Anything else (a full https:// link from the Media Library) is used as it is.
function mm_img($src) {
  $src = (string) $src;
  if (strpos($src, '/images/') === 0) return get_template_directory_uri() . '/assets' . $src;
  if (strpos($src, '/media/') === 0) return wp_get_upload_dir()['baseurl'] . '/mm-media/' . substr($src, 7);
  return $src;
}

// ---------- Projects (Impact) ----------

function mm_projects($period = '') {
  $projects = mm_rows('mm_project');
  if ($period === '') return $projects;
  return array_values(array_filter($projects, function ($p) use ($period) { return $p['period'] === $period; }));
}

// The different periods, newest first ("2025–26" before "2024–25")
function mm_project_periods() {
  $periods = array_unique(array_filter(array_column(mm_projects(), 'period'), 'strlen'));
  rsort($periods);
  return array_values($periods);
}

// The home page "Featured story": the featured project, or else the newest published one
function mm_featured_project() {
  $projects = mm_projects();
  foreach ($projects as $p) if ($p['isFeatured']) return $p;
  if (!$projects) return null;
  usort($projects, function ($a, $b) { return $b['id'] - $a['id']; });
  return $projects[0];
}

// The cover photo's description comes from its line in the gallery, if it is there
function mm_cover_alt($project) {
  foreach (mm_gallery($project['gallery'], $project['title']) as $g) {
    if ($g['src'] === $project['coverImage']) return $g['alt'];
  }
  return $project['title'];
}

// ---------- Dates in London time ----------
// Dates are saved in UTC ("2027-02-14 11:00:00") and always shown in London time.

function mm_london_zone() {
  static $zone = null;
  if ($zone === null) $zone = new DateTimeZone('Europe/London');
  return $zone;
}

// "2027-02-14 11:00:00" (UTC) -> DateTimeImmutable, or null when empty or not a date
function mm_utc($value) {
  $value = trim((string) $value);
  if ($value === '') return null;
  try {
    return new DateTimeImmutable($value, new DateTimeZone('UTC'));
  } catch (Exception $e) {
    return null;
  }
}

function mm_london($date, $format) {
  return $date->setTimezone(mm_london_zone())->format($format);
}

// "Sat 14 Feb 2027"
function mm_event_day($date) {
  return mm_london($date, 'D j M Y');
}

// "11:00"
function mm_time($date) {
  return mm_london($date, 'H:i');
}

// "21 April 2021"
function mm_format_date($date) {
  return mm_london($date, 'j F Y');
}

// "Sat 14 Feb 2027 · 11:00–14:00" (or "Sat 14 Feb 2027 · 11:00 – Sun 15 Feb 2027 · 16:00" over two days)
function mm_event_date($starts, $ends) {
  $start = mm_event_day($starts) . ' · ' . mm_time($starts);
  if (!$ends) return $start;
  if (mm_event_day($ends) === mm_event_day($starts)) return $start . '–' . mm_time($ends);
  return $start . ' – ' . mm_event_day($ends) . ' · ' . mm_time($ends);
}

// "2027-02-14T11:00" typed in London time -> "2027-02-14 11:00:00" in UTC, or "" when empty
function mm_from_london_input($value) {
  $value = trim((string) $value);
  if (!preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/', $value)) return '';
  $date = DateTimeImmutable::createFromFormat('Y-m-d\TH:i', substr($value, 0, 16), mm_london_zone());
  return $date ? $date->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s') : '';
}

// DateTimeImmutable -> "2027-02-14T11:00" in London time (the value an <input type="datetime-local"> needs)
function mm_to_london_input($date) {
  return $date ? mm_london($date, 'Y-m-d\TH:i') : '';
}

// ---------- Events ----------

function mm_now() {
  return new DateTimeImmutable('now', new DateTimeZone('UTC'));
}

// An event is "upcoming" until it ends (or until it starts, when it has no end time)
function mm_is_finished($event) {
  $end = $event['endsAt'] ? $event['endsAt'] : $event['startsAt'];
  return !$end || $end < mm_now();
}

function mm_events_sorted($events, $newest_first = false) {
  usort($events, function ($a, $b) use ($newest_first) {
    $ta = $a['startsAt'] ? $a['startsAt']->getTimestamp() : 0;
    $tb = $b['startsAt'] ? $b['startsAt']->getTimestamp() : 0;
    return $newest_first ? $tb - $ta : $ta - $tb;
  });
  return $events;
}

function mm_upcoming_events() {
  return mm_events_sorted(array_values(array_filter(mm_rows('mm_event'), function ($e) { return $e['startsAt'] && !mm_is_finished($e); })));
}

function mm_past_events($limit) {
  $past = array_values(array_filter(mm_rows('mm_event'), function ($e) { return $e['startsAt'] && mm_is_finished($e); }));
  return array_slice(mm_events_sorted($past, true), 0, $limit);
}

function mm_next_event() {
  $upcoming = mm_upcoming_events();
  return $upcoming ? $upcoming[0] : null;
}

// Published events linked to an Impact project, oldest first
function mm_events_for_project($slug) {
  return mm_events_sorted(array_values(array_filter(mm_rows('mm_event'), function ($e) use ($slug) { return $e['startsAt'] && $e['projectSlug'] === $slug; })));
}

// Places left, or null when there is no limit (or when booking is not done through our form)
function mm_places_left($event, $taken) {
  if ($event['capacity'] === null || $event['bookingType'] !== 'form') return null;
  return max(0, $event['capacity'] - $taken);
}

// "11–16", "11+", "up to 16" or ""
function mm_age_range($event) {
  $min = $event['ageMin'];
  $max = $event['ageMax'];
  if ($min !== null && $max !== null) return $min . '–' . $max;
  if ($min !== null) return $min . '+';
  if ($max !== null) return 'up to ' . $max;
  return '';
}

// "Girls 11–16"
function mm_audience_line($event) {
  return trim($event['audience'] . ' ' . mm_age_range($event));
}

// "Young women" -> "young-women" (used in /events/?for=…)
function mm_audience_slug($audience) {
  return strtolower(preg_replace('/\s+/', '-', $audience));
}
