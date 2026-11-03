<?php
if (!defined('ABSPATH')) exit;
// /events/<event>: the details, the booking box and the description.
// The booking form is saved by mm_handle_booking in the plugin (includes/bookings.php).

$event = mm_row(get_queried_object());
$left = mm_places_left($event, mm_places_taken($event['id']));
$finished = mm_is_finished($event);
$closed = $event['bookingClosesAt'] && $event['bookingClosesAt'] < mm_now();
$ages = mm_age_range($event);
$is_free = strtolower(trim($event['price'])) === 'free';
$date_line = $event['startsAt'] ? mm_event_date($event['startsAt'], $event['endsAt']) : '';
$maps = 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode(implode(', ', array_filter([$event['location'], $event['address']], 'strlen')));
$url = get_permalink($event['id']);

// After a booking without JavaScript we come back here with ?booked=… or ?booking_error=…
$booked = isset($_GET['booked']) && is_string($_GET['booked']) ? sanitize_key($_GET['booked']) : '';
$errors = mm_booking_errors();
$code = isset($_GET['booking_error']) && is_string($_GET['booking_error']) ? $_GET['booking_error'] : '';
$booking_error = isset($errors[$code]) ? $errors[$code] : '';

// Information for search engines (schema.org Event), so the event can show up in Google
$json_ld = [
  '@context' => 'https://schema.org',
  '@type' => 'Event',
  'name' => $event['title'],
  'description' => $event['summary'],
  'startDate' => $event['startsAt'] ? $event['startsAt']->format('c') : '',
  'endDate' => ($event['endsAt'] ?: $event['startsAt']) ? ($event['endsAt'] ?: $event['startsAt'])->format('c') : '',
  'eventStatus' => 'https://schema.org/EventScheduled',
  'eventAttendanceMode' => 'https://schema.org/OfflineEventAttendanceMode',
  'location' => ['@type' => 'Place', 'name' => $event['location'] ?: $event['address'], 'address' => $event['address'] ?: $event['location']],
  'organizer' => ['@type' => 'Organization', 'name' => 'Minority Matters', 'url' => home_url('/')],
  'url' => $url,
];
if ($is_free) $json_ld['isAccessibleForFree'] = true;
if ($event['coverImage']) $json_ld['image'] = [mm_abs_url(mm_img($event['coverImage']))];

$details = [['When', $date_line]];
if ($event['audience'] || $ages) $details[] = ['Who', $event['audience'] . ($ages ? ', ages ' . $ages : '')];
$details[] = ['Price', $event['price'] ?: 'Free'];
if ($left !== null && !$finished) $details[] = ['Places', $left > 0 ? $left . ' ' . ($left === 1 ? 'place' : 'places') . ' left' : 'Fully booked – join the waiting list'];

get_header();
?>
<article>
  <script type="application/ld+json"><?php echo wp_json_encode($json_ld, JSON_HEX_TAG | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); ?></script>

  <header class="bg-mist">
    <div class="mx-auto max-w-7xl px-4 pb-14 pt-16 sm:px-6 sm:pt-24">
      <a href="<?php echo esc_url(mm_url('/events')); ?>" class="text-sm font-semibold text-pink hover:underline">Back to all events</a>
      <div<?php echo mm_reveal(); ?>>
        <?php if ($event['startsAt']) : ?>
          <p class="mt-6 font-semibold text-pink"><time datetime="<?php echo esc_attr($event['startsAt']->format('c')); ?>"><?php mm_e($date_line); ?></time></p>
        <?php endif; ?>
        <h1 class="mt-3 max-w-4xl font-display text-4xl font-bold leading-tight text-ink sm:text-6xl"><?php mm_e($event['title']); ?></h1>
        <?php if ($event['summary']) : ?><p class="mt-5 max-w-2xl text-lg text-muted"><?php mm_e($event['summary']); ?></p><?php endif; ?>
      </div>
    </div>
  </header>

  <?php // On phones: details, then the booking box, then the text. On desktop the booking box sticks in the right column. ?>
  <div class="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
    <div class="lg:col-start-1">
      <dl class="space-y-5">
        <?php foreach ($details as $d) : ?>
          <div class="sm:grid sm:grid-cols-[8rem_1fr] sm:gap-8">
            <dt class="font-semibold text-ink"><?php mm_e($d[0]); ?></dt>
            <dd class="text-lg text-muted"><?php mm_e($d[1]); ?></dd>
          </div>
        <?php endforeach; ?>
        <?php if ($event['location'] || $event['address']) : ?>
          <div class="sm:grid sm:grid-cols-[8rem_1fr] sm:gap-8">
            <dt class="font-semibold text-ink">Where</dt>
            <dd class="text-lg text-muted">
              <?php if ($event['location']) : ?><span class="block text-ink"><?php mm_e($event['location']); ?></span><?php endif; ?>
              <?php if ($event['address']) : ?><span class="block"><?php mm_e($event['address']); ?></span><?php endif; ?>
              <a href="<?php echo esc_url($maps); ?>" target="_blank" rel="noopener noreferrer" class="mt-1 inline-block text-base font-semibold text-pink underline-offset-4 hover:underline">Open in Google Maps</a>
            </dd>
          </div>
        <?php endif; ?>
      </dl>
      <?php if (!$finished) : ?>
        <a href="<?php echo esc_url(trailingslashit($url) . 'ics/'); ?>" class="mt-8 inline-flex rounded-full border-2 border-ink px-5 py-2.5 font-semibold text-ink transition-colors hover:border-pink hover:bg-pink hover:text-white">Add to calendar</a>
      <?php endif; ?>
    </div>

    <aside aria-labelledby="booking-title" class="lg:col-start-2 lg:row-span-2 lg:row-start-1">
      <div class="rounded-3xl bg-pink-soft p-6 sm:p-8 lg:sticky lg:top-28">
        <h2 id="booking-title" class="scroll-mt-28 font-display text-2xl font-bold text-ink"><?php echo $finished ? 'This event has finished.' : 'Book a place'; ?></h2>

        <?php if ($finished) : ?>
          <?php if ($event['projectSlug']) : ?>
            <a href="<?php echo esc_url(mm_url('/impact/' . $event['projectSlug'])); ?>" class="mt-4 inline-block font-semibold text-pink hover:underline">See what happened</a>
          <?php endif; ?>
        <?php elseif ($event['bookingType'] === 'none') : ?>
          <p class="mt-3 text-lg text-ink">No booking needed – just come along.</p>
        <?php elseif ($closed) : ?>
          <p class="mt-3 text-lg text-ink">Booking has closed.</p>
        <?php elseif ($event['bookingType'] === 'external' && $event['bookingUrl']) : ?>
          <a href="<?php echo esc_url($event['bookingUrl']); ?>" target="_blank" rel="noopener noreferrer" class="mt-5 inline-flex rounded-full bg-pink px-7 py-3.5 font-semibold text-white transition-colors hover:bg-pink-dark">Book a place</a>
          <p class="mt-3 text-sm text-muted">You'll book on our partner's booking page.</p>
        <?php elseif ($event['bookingType'] === 'form') : ?>
          <?php if ($event['bookingClosesAt']) : ?>
            <p class="mt-2 text-sm text-muted">Booking closes <?php mm_e(mm_event_day($event['bookingClosesAt'])); ?>.</p>
          <?php endif; ?>
          <?php get_template_part('parts/booking-form', null, ['event' => $event, 'left' => $left, 'booked' => $booked, 'error' => $booking_error]); ?>
        <?php else : ?>
          <p class="mt-3 text-lg text-ink">Please <a href="<?php echo esc_url(mm_url('/contact')); ?>" class="font-semibold text-pink hover:underline">contact us</a> to book.</p>
        <?php endif; ?>
      </div>
    </aside>

    <div class="lg:col-start-1">
      <?php if ($event['coverImage']) : ?>
        <div class="photo-frame relative mb-10 aspect-[16/10] bg-mist">
          <?php mm_fill_img($event['coverImage'], '', 'object-cover', true); ?>
        </div>
      <?php endif; ?>
      <?php foreach (mm_paragraphs($event['body']) as $p) : ?>
        <p class="mb-6 max-w-3xl text-lg leading-[1.75] text-ink/85"><?php mm_e($p); ?></p>
      <?php endforeach; ?>
    </div>
  </div>
</article>
<?php get_footer();
