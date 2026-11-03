<?php
if (!defined('ABSPATH')) exit;
// /admin/: numbers and the latest messages

global $wpdb;
$count = function ($type) {
  return count(get_posts(['post_type' => $type, 'post_status' => ['publish', 'draft', 'private'], 'numberposts' => -1, 'fields' => 'ids']));
};
$new_bookings = (int) $wpdb->get_var($wpdb->prepare(
  'SELECT COUNT(*) FROM ' . mm_bookings_table() . ' WHERE created_at >= %s',
  gmdate('Y-m-d H:i:s', time() - 7 * DAY_IN_SECONDS)
));
$cards = [
  ['Messages', $count('mm_message'), 'messages'],
  ['Programmes', $count('mm_service'), 'services'],
  ['Projects', $count('mm_project'), 'projects'],
  ['Upcoming events', count(mm_upcoming_events()), 'events'],
  ['New bookings (last 7 days)', $new_bookings, 'events'],
  ['Blog posts', $count('post'), 'blog'],
  ['Press items', $count('mm_press'), 'press'],
  ['Values', $count('mm_value'), 'values'],
  ['Funders', $count('mm_funder'), 'funders'],
];
$latest = get_posts(['post_type' => 'mm_message', 'post_status' => 'any', 'numberposts' => 5]);

mm_panel_start('dashboard', 'Dashboard');
?>
<h1 class="font-display text-3xl font-bold">Welcome back</h1>
<p class="mt-1 text-muted">Manage the content of minoritymatters.org.uk from here.</p>

<ul class="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
  <?php foreach ($cards as $c) : ?>
    <li>
      <a href="<?php echo esc_url(mm_panel_url($c[2])); ?>" class="block rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md">
        <p class="font-display text-4xl font-bold text-pink"><?php echo (int) $c[1]; ?></p>
        <p class="mt-1 text-sm font-semibold text-muted"><?php mm_e($c[0]); ?></p>
      </a>
    </li>
  <?php endforeach; ?>
</ul>

<section class="mt-10 rounded-2xl border border-gray-200 bg-white p-6" data-live="latest-messages">
  <div class="flex items-center justify-between">
    <h2 class="font-display text-xl font-bold">Latest messages</h2>
    <a href="<?php echo esc_url(mm_panel_url('messages')); ?>" class="text-sm font-semibold text-pink">See all</a>
  </div>
  <?php if (!$latest) : ?>
    <p class="mt-4 text-muted">No messages yet. Messages sent from the contact page will appear here.</p>
  <?php else : ?>
    <ul class="mt-4 divide-y divide-gray-200">
      <?php foreach ($latest as $m) : ?>
        <li>
          <a href="<?php echo esc_url(mm_panel_url('messages', ['with' => mm_email_key(get_post_meta($m->ID, 'mm_email', true))])); ?>" class="-mx-2 flex items-start justify-between gap-4 rounded-lg px-2 py-3 hover:bg-mist">
          <div class="min-w-0">
            <p class="font-semibold">
              <?php mm_e($m->post_title); ?>
              <?php if (get_post_meta($m->ID, 'mm_isRead', true) !== '1') : ?><span class="ml-2 rounded-full bg-pink px-2 py-0.5 text-xs text-white">New</span><?php endif; ?>
              <?php mm_reason_badge(get_post_meta($m->ID, 'mm_reason', true)); ?>
            </p>
            <p class="line-clamp-1 text-sm text-muted"><?php mm_e($m->post_content); ?></p>
          </div>
          <span class="shrink-0 text-xs text-muted"><?php mm_e(get_the_date('j F Y', $m)); ?></span>
          </a>
        </li>
      <?php endforeach; ?>
    </ul>
  <?php endif; ?>
</section>
<?php mm_panel_end();
