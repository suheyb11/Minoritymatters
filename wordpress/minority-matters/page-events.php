<?php
if (!defined('ABSPATH')) exit;
// /events: upcoming events grouped by month (with audience filter chips) and the list of past events.
// /events/?for=girls opens with "Girls" chosen. Events for "Everyone" are shown under every filter.

$upcoming = mm_upcoming_events();
$past = mm_past_events(20);
$instagram = mm_setting('instagramUrl');

$chips = array_merge(['All'], array_values(array_filter(MM_EVENT_AUDIENCES, function ($a) use ($upcoming) {
  return in_array($a, array_column($upcoming, 'audience'), true);
})));
$wanted = isset($_GET['for']) && is_string($_GET['for']) ? sanitize_key(wp_unslash($_GET['for'])) : '';
$audience = 'All';
foreach ($chips as $c) if ($c !== 'All' && mm_audience_slug($c) === $wanted) $audience = $c;

// Month heading => events
$months = [];
foreach ($upcoming as $e) $months[mm_london($e['startsAt'], 'F Y')][] = $e;

get_header();
mm_page_header('events', 'Activities, trips and sessions for children, young people and families in Islington and Camden.', 0.28);
?>

<section aria-labelledby="upcoming-title" class="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20" data-events>
  <h2 id="upcoming-title" class="font-display text-4xl font-bold lowercase sm:text-5xl">upcoming</h2>

  <?php if ($upcoming) : ?>
    <?php if (count($chips) > 2) : ?>
      <div role="group" aria-label="Show events for" class="mt-6 flex flex-wrap gap-2">
        <?php foreach ($chips as $c) : ?>
          <a href="<?php echo esc_url($c === 'All' ? mm_url('/events') : add_query_arg('for', mm_audience_slug($c), mm_url('/events'))); ?>" data-audience="<?php echo esc_attr($c); ?>" data-audience-slug="<?php echo esc_attr(mm_audience_slug($c)); ?>" aria-pressed="<?php echo $c === $audience ? 'true' : 'false'; ?>" class="rounded-full px-4 py-2 text-sm font-semibold transition-colors bg-mist text-ink hover:bg-pink-soft aria-pressed:bg-pink aria-pressed:text-white"><?php mm_e($c); ?></a>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>
    <p class="sr-only" aria-live="polite" data-filter-status></p>
    <p class="mt-10 text-lg text-muted" data-no-events hidden>No upcoming events for <span data-no-events-name></span> right now.</p>

    <div class="mt-10 space-y-12">
      <?php $n = 0; foreach ($months as $month => $events) : ?>
        <section aria-label="<?php echo esc_attr($month); ?>" data-month>
          <h3 class="font-display text-2xl font-semibold text-ink"><?php mm_e($month); ?></h3>
          <ul class="mt-4 space-y-4">
            <?php foreach ($events as $e) :
              $show = $audience === 'All' || $e['audience'] === $audience || $e['audience'] === 'Everyone';
              $left = mm_places_left($e, mm_places_taken($e['id']));
            ?>
              <li class="reveal-rise" style="animation-delay:<?php echo min($n++, 8) * 0.06; ?>s" data-event-audience="<?php echo esc_attr($e['audience']); ?>"<?php echo $show ? '' : ' hidden'; ?>>
                <?php mm_event_card($e, $left); ?>
              </li>
            <?php endforeach; ?>
          </ul>
        </section>
      <?php endforeach; ?>
    </div>
  <?php else : ?>
    <p class="mt-6 max-w-xl text-lg text-muted">
      No upcoming events right now.
      <?php if ($instagram) : ?>
        Follow us on <a href="<?php echo esc_url($instagram); ?>" target="_blank" rel="noopener noreferrer" class="font-semibold text-pink underline-offset-4 hover:underline">Instagram</a> or
      <?php endif; ?>
      <a href="<?php echo esc_url(mm_url('/contact')); ?>" class="font-semibold text-pink underline-offset-4 hover:underline"><?php echo $instagram ? 'contact us' : 'Contact us'; ?></a>
      to hear about the next one.
    </p>
  <?php endif; ?>
</section>

<?php if ($past) : ?>
  <section aria-labelledby="past-title" class="border-t border-mist">
    <div class="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <h2 id="past-title" class="font-display text-3xl font-bold lowercase">past events</h2>
      <ul class="mt-6 divide-y divide-[#e5e3e8]">
        <?php foreach ($past as $e) : ?>
          <li class="flex flex-wrap items-baseline gap-x-6 gap-y-1 py-4">
            <time datetime="<?php echo esc_attr($e['startsAt']->format('c')); ?>" class="w-full shrink-0 text-sm text-muted sm:w-36"><?php mm_e(mm_event_day($e['startsAt'])); ?></time>
            <a href="<?php echo esc_url(get_permalink($e['id'])); ?>" class="min-w-0 flex-1 font-semibold hover:text-pink"><?php mm_e($e['title']); ?></a>
            <?php if ($e['projectSlug']) : ?>
              <a href="<?php echo esc_url(mm_url('/impact/' . $e['projectSlug'])); ?>" class="text-sm font-semibold text-pink hover:underline">See what happened</a>
            <?php endif; ?>
          </li>
        <?php endforeach; ?>
      </ul>
    </div>
  </section>
<?php endif; ?>

<?php get_footer();
