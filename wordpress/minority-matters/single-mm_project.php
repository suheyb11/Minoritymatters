<?php
if (!defined('ABSPATH')) exit;
// /impact/<project>: one project with its numbers, story, sessions, photos and the previous/next project

$project = mm_row(get_queried_object());
$stats = mm_stats($project['stats']);
$gallery = mm_gallery($project['gallery'], $project['title']);
$service = $project['relatedService'] ? mm_row_by_slug('mm_service', $project['relatedService']) : null;
$sessions = mm_events_for_project($project['slug']);

// Previous / next project in the same period
$siblings = mm_projects($project['period']);
$at = array_search($project['id'], array_column($siblings, 'id'), true);
$previous = $at !== false && $at > 0 ? $siblings[$at - 1] : null;
$next = $at !== false && $at < count($siblings) - 1 ? $siblings[$at + 1] : null;

get_header();
?>
<article>
  <header class="bg-mist">
    <div class="mx-auto max-w-7xl px-4 pb-14 pt-16 sm:px-6 sm:pt-24">
      <a href="<?php echo esc_url(mm_url('/impact')); ?>" class="text-sm font-semibold text-pink hover:underline">Back to our impact</a>
      <div<?php echo mm_reveal(); ?>>
        <p class="mt-6 font-semibold text-pink"><?php mm_e($project['category']); ?> <span class="text-muted">· <?php mm_e($project['period']); ?></span></p>
        <h1 class="mt-3 max-w-4xl font-display text-4xl font-bold leading-tight text-ink sm:text-6xl"><?php mm_e($project['title']); ?></h1>
        <?php if ($project['summary']) : ?><p class="mt-5 max-w-2xl text-lg text-muted"><?php mm_e($project['summary']); ?></p><?php endif; ?>
      </div>
    </div>
  </header>

  <?php if ($project['coverImage']) : ?>
    <div class="mx-auto max-w-5xl px-4 pt-12 sm:px-6">
      <div class="photo-frame aspect-[16/10] bg-mist">
        <?php mm_fill_img($project['coverImage'], mm_cover_alt($project), 'object-cover', true); ?>
      </div>
    </div>
  <?php endif; ?>

  <div class="mx-auto max-w-3xl px-4 py-14 sm:px-6">
    <?php if ($stats) : ?>
      <ul class="mb-12 flex flex-wrap gap-3">
        <?php foreach ($stats as $s) : ?>
          <li class="flex items-baseline gap-2 rounded-full bg-pink-soft px-5 py-3">
            <span class="font-display text-3xl font-bold text-pink"><?php mm_stat_number($s['number']); ?></span>
            <span class="text-ink"><?php mm_e($s['label']); ?></span>
          </li>
        <?php endforeach; ?>
      </ul>
    <?php endif; ?>

    <?php foreach (mm_paragraphs($project['body']) as $p) : ?>
      <p class="mb-6 text-lg leading-[1.75] text-ink/85"><?php mm_e($p); ?></p>
    <?php endforeach; ?>

    <?php if ($sessions) : ?>
      <section aria-labelledby="sessions-title" class="mt-12">
        <h2 id="sessions-title" class="font-display text-2xl font-bold text-ink">Sessions in this project</h2>
        <ul class="mt-4 divide-y divide-[#e5e3e8]">
          <?php foreach ($sessions as $e) : ?>
            <li class="flex flex-wrap items-baseline gap-x-6 gap-y-1 py-3">
              <time datetime="<?php echo esc_attr($e['startsAt']->format('c')); ?>" class="w-full shrink-0 text-sm text-muted sm:w-36"><?php mm_e(mm_event_day($e['startsAt'])); ?></time>
              <a href="<?php echo esc_url(get_permalink($e['id'])); ?>" class="min-w-0 flex-1 font-semibold hover:text-pink"><?php mm_e($e['title']); ?></a>
            </li>
          <?php endforeach; ?>
        </ul>
      </section>
    <?php endif; ?>

    <?php if ($service) : ?>
      <p class="mt-10 text-lg">
        <span class="text-muted">Part of: </span>
        <a href="<?php echo esc_url(mm_url('/our-work') . '#' . $service['slug']); ?>" class="font-semibold text-pink underline-offset-4 hover:underline"><?php mm_e($service['title']); ?></a>
      </p>
    <?php endif; ?>
  </div>

  <?php if ($gallery) : ?>
    <!-- Gallery: clicking a photo opens it big (assets/js/app.js) -->
    <section aria-labelledby="photos-title" class="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <h2 id="photos-title" class="mb-8 font-display text-4xl font-bold lowercase">photos</h2>
      <ul class="columns-1 gap-6 sm:columns-2 lg:columns-3" data-gallery>
        <?php foreach ($gallery as $i => $img) : ?>
          <li class="mb-6 break-inside-avoid">
            <button type="button" data-src="<?php echo esc_url(mm_img($img['src'])); ?>" data-alt="<?php echo esc_attr($img['alt']); ?>" aria-label="<?php echo esc_attr(sprintf('Open photo %d of %d: %s', $i + 1, count($gallery), $img['alt'])); ?>" class="group block w-full cursor-zoom-in rounded-2xl">
              <span class="photo-frame block">
                <img src="<?php echo esc_url(mm_img($img['src'])); ?>" alt="" width="1200" height="900" loading="lazy" decoding="async" class="block h-auto w-full transition-transform duration-500 motion-safe:group-hover:scale-[1.04]">
              </span>
            </button>
          </li>
        <?php endforeach; ?>
      </ul>
    </section>
  <?php endif; ?>

  <?php if ($previous || $next) : ?>
    <nav aria-label="More projects" class="mx-auto grid max-w-7xl gap-4 px-4 pb-16 sm:grid-cols-2 sm:px-6">
      <?php if ($previous) : ?>
        <a href="<?php echo esc_url(get_permalink($previous['id'])); ?>" class="group rounded-2xl border border-mist p-6 transition-colors hover:border-pink">
          <span class="block text-sm text-muted">Previous project</span>
          <span class="mt-1 block font-display text-xl font-semibold group-hover:text-pink"><?php mm_e($previous['title']); ?></span>
        </a>
      <?php else : ?>
        <span></span>
      <?php endif; ?>
      <?php if ($next) : ?>
        <a href="<?php echo esc_url(get_permalink($next['id'])); ?>" class="group rounded-2xl border border-mist p-6 text-right transition-colors hover:border-pink">
          <span class="block text-sm text-muted">Next project</span>
          <span class="mt-1 block font-display text-xl font-semibold group-hover:text-pink"><?php mm_e($next['title']); ?></span>
        </a>
      <?php endif; ?>
    </nav>
  <?php endif; ?>

  <section class="px-4 pb-20 sm:px-6">
    <?php mm_cta(
      'Support our work',
      'Your donation helps us run projects like this for local families.',
      ['label' => 'Donate', 'donate' => true],
      ['label' => 'Contact us', 'href' => mm_url('/contact')]
    ); ?>
  </section>
</article>
<?php get_footer();
