<?php
if (!defined('ABSPATH')) exit;
// /admin/<section>/ for Our work, Projects, Events, Blog, Press, Values and Funders:
// the list, and the form to add or edit one (?new=1 or ?edit=<id>). Events also show their bookings (?bookings=<id>).
// The fields come from the plugin (mm_fields in includes/fields.php), so the form always matches the content.

$type = MM_PANEL_TYPES[$section];
$config = [
  'services' => ['Our work', 'Add programme or area', 'The 5 service areas (shown on the home page) and the programmes (the list that opens and closes on Our work).'],
  'projects' => ['Projects', 'Add project', 'Projects are shown on the Impact page. The big total there adds up "People reached" for every project in the same period.'],
  'events' => ['Events', 'Add event', 'Events are shown on the Events page. Bookings made with the form are listed under each event.'],
  'blog' => ['Blog', 'Add post', ''],
  'press' => ['Press', 'Add press item', ''],
  'values' => ['Values', 'Add value', ''],
  'funders' => ['Funders', 'Add funder', 'Tick "Show the logo on the home page" to show a funder in the logo strip.'],
][$section];
list($title, $add_label, $intro) = $config;

// ---------- Rows ----------
if ($type === 'post') {
  $rows = array_map(function ($p) {
    return [
      'id' => $p->ID,
      'title' => $p->post_title,
      'slug' => $p->post_name,
      'sortOrder' => 0,
      'published' => $p->post_status === 'publish',
      'excerpt' => $p->post_excerpt,
      'body' => $p->post_content,
      'date' => get_the_date('Y-m-d', $p),
      'author' => get_post_meta($p->ID, 'mm_author', true) ?: 'Minority Matters',
      'coverImage' => get_post_meta($p->ID, 'mm_coverImage', true),
    ];
  }, get_posts(['post_type' => 'post', 'post_status' => ['publish', 'draft', 'pending', 'future', 'private'], 'numberposts' => -1]));
} else {
  $rows = mm_rows($type, true);
  if ($type === 'mm_event') $rows = mm_events_sorted($rows, true);
}

$edit_id = isset($_GET['edit']) ? (int) $_GET['edit'] : 0;
$editing = null;
foreach ($rows as $row) if ($row['id'] === $edit_id) $editing = $row;
$show_form = $editing || !empty($_GET['new']);
$bookings_id = $type === 'mm_event' && isset($_GET['bookings']) ? (int) $_GET['bookings'] : 0;

// The raw saved value of a field (what the form shows)
$value = function ($key, $field) use ($editing) {
  if (!$editing) return isset($field['default']) ? (string) $field['default'] : '';
  $saved = get_post_meta($editing['id'], 'mm_' . $key, true);
  return $saved === '' && isset($field['default']) ? (string) $field['default'] : (string) $saved;
};

// The picture shown in the list
$thumb = function ($row) {
  foreach (['coverImage', 'image', 'logo', 'icon'] as $k) if (!empty($row[$k])) return mm_img($row[$k]);
  return '';
};

mm_panel_start($section, $title);

// ======================= Bookings of one event =======================
if ($bookings_id) {
  global $wpdb;
  $event_post = get_post($bookings_id);
  if (!$event_post || $event_post->post_type !== 'mm_event') mm_redirect(mm_panel_url('events'));
  $event = mm_row($event_post);
  $totals = mm_booking_totals($bookings_id);
  $left = mm_places_left($event, $totals['confirmed'] + $totals['attended']);
  $bookings = $wpdb->get_results($wpdb->prepare('SELECT * FROM ' . mm_bookings_table() . ' WHERE event_id = %d ORDER BY created_at ASC, id ASC', $bookings_id));
  $back = mm_panel_url('events', ['bookings' => $bookings_id]);
  $csv = wp_nonce_url(admin_url('admin-post.php?action=mm_bookings_csv&event=' . $bookings_id), 'mm_bookings_csv_' . $bookings_id);
  $attended = wp_nonce_url(add_query_arg(['action' => 'mm_mark_attended', 'event' => $bookings_id, 'back' => rawurlencode($back)], admin_url('admin-post.php')), 'mm_mark_attended_' . $bookings_id);
  ?>
  <a href="<?php echo esc_url(mm_panel_url('events')); ?>" class="text-sm font-semibold text-pink hover:underline">Back to events</a>
  <h1 class="mt-4 font-display text-3xl font-bold">Bookings: <?php mm_e($event['title']); ?></h1>
  <p class="mt-1 text-muted">
    <?php if ($event['startsAt']) mm_e(mm_event_date($event['startsAt'], $event['endsAt']) . ' · '); ?>
    <?php echo (int) $totals['confirmed']; ?> confirmed, <?php echo (int) $totals['waitlist']; ?> on the waiting list, <?php echo (int) $totals['attended']; ?> attended
    <?php if ($left !== null) echo ' · ' . (int) $left . ' places left'; ?>
  </p>
  <div class="mt-6 mb-8 flex flex-wrap gap-2">
    <a href="<?php echo esc_url($csv); ?>" class="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-ink hover:bg-gray-100">Download CSV</a>
    <a href="<?php echo esc_url($attended); ?>" data-confirm="Mark every confirmed booking as attended?" class="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-ink hover:bg-gray-100">Mark all confirmed as attended</a>
    <a href="<?php echo esc_url(mm_panel_url('events', ['edit' => $bookings_id])); ?>" class="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-ink hover:bg-gray-100">Edit event</a>
  </div>
  <?php mm_panel_notice(); ?>
  <?php if (!$bookings) : ?>
    <p class="text-muted">No bookings yet.</p>
  <?php else : ?>
    <div class="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
      <table class="w-full text-left text-sm">
        <thead class="border-b border-gray-200 bg-mist text-xs uppercase tracking-wide text-muted">
          <tr><th class="p-3">Name</th><th class="p-3">Contact</th><th class="p-3">Places</th><th class="p-3">Notes</th><th class="p-3">Booked</th><th class="p-3">Status</th><th class="p-3"></th></tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <?php foreach ($bookings as $b) :
            $booked = mm_utc($b->created_at);
            $delete = wp_nonce_url(add_query_arg(['action' => 'mm_delete_booking', 'id' => $b->id, 'back' => rawurlencode($back)], admin_url('admin-post.php')), 'mm_delete_booking_' . $b->id);
          ?>
            <tr class="align-top">
              <td class="p-3 font-semibold"><?php mm_e($b->name); ?></td>
              <td class="p-3"><a href="mailto:<?php echo esc_attr($b->email); ?>" class="text-pink hover:underline"><?php mm_e($b->email); ?></a><?php if ($b->phone !== '') : ?><br><?php mm_e($b->phone); ?><?php endif; ?></td>
              <td class="p-3"><?php mm_e($b->adults . ' adults, ' . $b->children . ' children' . ($b->child_ages !== '' ? ' (ages ' . $b->child_ages . ')' : '')); ?></td>
              <td class="p-3 whitespace-pre-line"><?php mm_e($b->notes); ?></td>
              <td class="p-3 whitespace-nowrap"><?php if ($booked) mm_e(mm_event_date($booked, null)); ?></td>
              <td class="p-3">
                <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" class="flex items-center gap-2">
                  <input type="hidden" name="action" value="mm_booking_status">
                  <input type="hidden" name="id" value="<?php echo (int) $b->id; ?>">
                  <input type="hidden" name="back" value="<?php echo esc_url($back); ?>">
                  <?php wp_nonce_field('mm_booking_status_' . $b->id); ?>
                  <select name="status" class="rounded-lg border border-[#d9d6dd] bg-white px-2 py-1.5 text-sm" data-autosubmit>
                    <?php foreach (MM_BOOKING_STATUSES as $s) : ?>
                      <option value="<?php echo esc_attr($s); ?>"<?php selected($b->status, $s); ?>><?php mm_e($s); ?></option>
                    <?php endforeach; ?>
                  </select>
                  <noscript><button class="text-sm font-semibold text-pink">Save</button></noscript>
                </form>
              </td>
              <td class="p-3"><a href="<?php echo esc_url($delete); ?>" data-confirm="Delete this booking? This cannot be undone." class="font-semibold text-red-600 hover:underline">Delete</a></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  <?php endif; ?>
  <?php
  mm_panel_end();
  return;
}

// ======================= List + form =======================
mm_panel_title($title, mm_panel_url($section, ['new' => 1]) . '#form', $add_label);
if ($intro) echo '<p class="-mt-4 mb-8 max-w-2xl text-sm text-muted">' . esc_html($intro) . '</p>';
mm_panel_notice();

if ($show_form) : ?>
  <?php mm_panel_form('mm_panel_save', 'mb-10 space-y-4 rounded-2xl border border-gray-200 bg-white p-6 scroll-mt-6', true); ?>
    <span id="form"></span>
    <h2 class="font-display text-xl font-bold"><?php echo $editing ? 'Edit' : 'New'; ?></h2>
    <input type="hidden" name="section" value="<?php echo esc_attr($section); ?>">
    <input type="hidden" name="id" value="<?php echo $editing ? (int) $editing['id'] : ''; ?>">

    <label class="block">
      <?php mm_panel_label($type === 'mm_funder' ? 'Name' : 'Title', true); ?>
      <input name="title" value="<?php echo esc_attr($editing ? $editing['title'] : ''); ?>" required class="field">
    </label>

    <?php if ($type === 'post') : ?>
      <label class="block">
        <?php mm_panel_label('Summary'); ?>
        <textarea name="excerpt" rows="2" class="field leading-relaxed"><?php echo esc_textarea($editing ? $editing['excerpt'] : ''); ?></textarea>
        <span class="mt-1 block text-xs text-muted">Shown on the blog list.</span>
      </label>
      <label class="block">
        <?php mm_panel_label('Text'); ?>
        <textarea name="body" rows="14" class="field leading-relaxed"><?php echo esc_textarea($editing ? $editing['body'] : ''); ?></textarea>
        <span class="mt-1 block text-xs text-muted">Leave an empty line between paragraphs.</span>
      </label>
      <label class="block">
        <?php mm_panel_label('Date'); ?>
        <input type="date" name="date" value="<?php echo esc_attr($editing ? $editing['date'] : gmdate('Y-m-d')); ?>" class="field">
      </label>
    <?php endif; ?>

    <?php foreach (mm_fields($type) as $key => $field) {
      mm_panel_field('fields[' . $key . ']', $key, $field, $value($key, $field));
    } ?>

    <div class="grid gap-4 sm:grid-cols-2">
      <label class="block">
        <?php mm_panel_label('Web address (slug)'); ?>
        <input name="slug" value="<?php echo esc_attr($editing ? $editing['slug'] : ''); ?>" class="field">
        <span class="mt-1 block text-xs text-muted">Leave empty to create it from the title.</span>
      </label>
      <?php if ($type !== 'post') : ?>
        <label class="block">
          <?php mm_panel_label('Order'); ?>
          <input type="number" name="order" value="<?php echo (int) ($editing ? $editing['sortOrder'] : count($rows) + 1); ?>" class="field">
          <span class="mt-1 block text-xs text-muted">Lower numbers show first.</span>
        </label>
      <?php endif; ?>
    </div>
    <label class="flex items-center gap-3 text-sm font-semibold">
      <input type="checkbox" name="published" value="1"<?php checked(!$editing || $editing['published']); ?> class="h-5 w-5 accent-[#e71d73]">
      Show on website
    </label>
    <div class="flex gap-3 pt-2">
      <button type="submit" class="rounded-full bg-pink px-6 py-2.5 font-semibold text-white transition-colors hover:bg-pink-dark">Save</button>
      <a href="<?php echo esc_url(mm_panel_url($section)); ?>" class="rounded-full px-5 py-2.5 font-semibold text-muted hover:bg-mist">Cancel</a>
    </div>
  </form>
<?php endif; ?>

<?php if (!$rows) : ?><p class="text-muted">Nothing here yet.</p><?php endif; ?>

<ul class="divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
  <?php foreach ($rows as $row) :
    $img = $thumb($row);
    $meta = '';
    if ($type === 'mm_service') $meta = $row['kind'] === 'area' ? 'Service area' : 'Programme';
    if ($type === 'mm_project') $meta = trim($row['category'] . ' · ' . $row['period'] . ' · ' . (int) $row['peopleReached'] . ' people', ' ·');
    if ($type === 'mm_event' && $row['startsAt']) $meta = mm_event_date($row['startsAt'], $row['endsAt']) . ($row['location'] ? ' · ' . $row['location'] : '');
    if ($type === 'post') $meta = $row['date'];
    if ($type === 'mm_press') $meta = $row['source'];
    if ($type === 'mm_value') $meta = $row['text'];
  ?>
    <li class="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap">
      <?php if ($img) : ?>
        <img src="<?php echo esc_url($img); ?>" alt="" loading="lazy" class="h-12 w-16 shrink-0 rounded-md bg-mist object-<?php echo in_array($type, ['mm_funder', 'mm_value', 'mm_service'], true) ? 'contain' : 'cover'; ?>">
      <?php else : ?>
        <span class="h-12 w-16 shrink-0 rounded-md bg-mist"></span>
      <?php endif; ?>
      <div class="min-w-0 flex-1">
        <p class="font-semibold">
          <?php mm_e($row['title']); ?>
          <?php if (!$row['published']) mm_panel_badge('Hidden'); ?>
          <?php if ($type === 'mm_project' && $row['isFeatured']) mm_panel_badge('On home page', 'bg-pink text-white'); ?>
          <?php if ($type === 'mm_funder' && $row['showLogo']) mm_panel_badge('Logo on home page', 'bg-pink-soft text-pink'); ?>
          <?php if ($type === 'mm_event' && $row['startsAt'] && mm_is_finished($row)) mm_panel_badge('Finished'); ?>
        </p>
        <?php if ($meta !== '') : ?><p class="truncate text-sm text-muted"><?php mm_e($meta); ?></p><?php endif; ?>
      </div>
      <div class="flex shrink-0 items-center gap-1">
        <?php if ($type === 'mm_event' && $row['bookingType'] === 'form') :
          $t = mm_booking_totals($row['id']); ?>
          <a href="<?php echo esc_url(mm_panel_url('events', ['bookings' => $row['id']])); ?>" class="rounded-full px-3 py-1.5 text-sm font-semibold text-ink hover:bg-gray-100">Bookings (<?php echo (int) ($t['confirmed'] + $t['attended']); ?><?php echo $t['waitlist'] ? ' + ' . (int) $t['waitlist'] . ' waiting' : ''; ?>)</a>
        <?php endif; ?>
        <?php if ($row['published'] && in_array($type, ['mm_project', 'mm_event', 'post'], true)) : ?>
          <a href="<?php echo esc_url(get_permalink($row['id'])); ?>" target="_blank" rel="noopener" class="rounded-full px-3 py-1.5 text-sm font-semibold text-muted hover:bg-gray-100">View</a>
        <?php endif; ?>
        <a href="<?php echo esc_url(mm_panel_url($section, ['edit' => $row['id']]) . '#form'); ?>" class="rounded-full px-3 py-1.5 text-sm font-semibold text-pink hover:bg-pink-soft">Edit</a>
        <?php mm_panel_delete('mm_panel_delete', ['section' => $section, 'id' => $row['id']], $type === 'mm_event' ? 'Delete this event and all its bookings? This cannot be undone.' : 'Delete this item? This cannot be undone.'); ?>
      </div>
    </li>
  <?php endforeach; ?>
</ul>
<?php mm_panel_end();
