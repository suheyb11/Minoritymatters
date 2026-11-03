<?php
if (!defined('ABSPATH')) exit;
// /impact: year switcher, the big total, a category filter and the project grid.
// Every period is in the page, so switching years is instant; /impact/?period=2024–25 opens another one.

// The 3 highlight numbers next to the big total: the biggest number of each of these projects
$highlight_slugs = ['girls-baking-art', 'football-mentoring', 'welfare-advice'];

$periods = [];
foreach (mm_project_periods() as $period) {
  $projects = mm_projects($period);
  $highlights = [];
  foreach ($highlight_slugs as $slug) {
    foreach ($projects as $p) {
      if ($p['slug'] !== $slug) continue;
      $stats = mm_stats($p['stats']);
      usort($stats, function ($a, $b) { return (float) $b['number'] <=> (float) $a['number']; });
      if ($stats) $highlights[] = $stats[0] + ['id' => $p['id'], 'title' => $p['title']];
    }
  }
  $periods[] = ['period' => $period, 'projects' => $projects, 'highlights' => $highlights];
}
$wanted = isset($_GET['period']) && is_string($_GET['period']) ? sanitize_text_field(wp_unslash($_GET['period'])) : '';
$current = $periods ? $periods[0]['period'] : '';
foreach ($periods as $p) if ($p['period'] === $wanted) $current = $wanted;

get_header();
mm_page_header('our impact', 'What we delivered with families, children and young people across Islington and Camden this year.', 0.8);
?>

<div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24" data-impact>
  <?php if (!$periods) : ?>
    <p class="text-lg text-muted">Projects will appear here soon.</p>
  <?php endif; ?>

  <?php if (count($periods) > 1) : ?>
    <div role="group" aria-label="Choose a year" class="mb-12 flex flex-wrap gap-2">
      <?php foreach ($periods as $p) : $on = $p['period'] === $current; ?>
        <a href="<?php echo esc_url(add_query_arg('period', rawurlencode($p['period']), mm_url('/impact'))); ?>" data-period-button="<?php echo esc_attr($p['period']); ?>" aria-pressed="<?php echo $on ? 'true' : 'false'; ?>" class="rounded-full px-5 py-2.5 font-semibold transition-colors bg-mist text-ink hover:bg-pink-soft aria-pressed:bg-ink aria-pressed:text-white"><?php mm_e($p['period']); ?></a>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>

  <?php foreach ($periods as $data) :
    $total = array_sum(array_column($data['projects'], 'peopleReached'));
    $chips = array_merge(['All'], array_values(array_filter(MM_PROJECT_CATEGORIES, function ($c) use ($data) {
      return in_array($c, array_column($data['projects'], 'category'), true);
    })));
  ?>
    <div data-period="<?php echo esc_attr($data['period']); ?>"<?php echo $data['period'] === $current ? '' : ' hidden'; ?>>
      <!-- ---------- The big total ---------- -->
      <section aria-label="<?php echo esc_attr($data['period'] . ' in numbers'); ?>" class="grid gap-12 border-b border-grey/40 pb-16 lg:grid-cols-[1.1fr_1fr] lg:items-end">
        <div>
          <p class="font-display text-[clamp(5rem,16vw,10rem)] font-bold leading-[0.85] text-pink"><?php mm_count_up($total); ?></p>
          <p class="mt-4 font-display text-3xl font-semibold text-ink">people taking part</p>
          <p class="mt-1 text-lg text-muted">in <?php mm_e($data['period']); ?></p>
          <p class="mt-4 max-w-md text-sm text-muted">Counted per project; some people joined more than one project.</p>
        </div>
        <dl class="grid grid-cols-2 gap-x-8 gap-y-10">
          <div class="flex flex-col-reverse gap-1">
            <dt class="text-muted">projects delivered</dt>
            <dd class="font-display text-5xl font-bold text-ink"><?php mm_count_up(count($data['projects'])); ?></dd>
          </div>
          <?php foreach ($data['highlights'] as $h) : ?>
            <div class="flex flex-col-reverse gap-1">
              <dt class="text-muted">
                <?php mm_e($h['label']); ?>
                <a href="<?php echo esc_url(get_permalink($h['id'])); ?>" class="mt-0.5 block text-sm font-semibold text-pink hover:underline"><?php mm_e($h['title']); ?></a>
              </dt>
              <dd class="font-display text-5xl font-bold text-ink"><?php mm_stat_number($h['number']); ?></dd>
            </div>
          <?php endforeach; ?>
        </dl>
      </section>

      <!-- ---------- Category filter + project grid ---------- -->
      <section aria-label="Our projects" class="pt-16">
        <h2 class="font-display text-4xl font-bold lowercase sm:text-5xl">our projects</h2>
        <div role="group" aria-label="Filter projects by category" class="mt-6 flex flex-wrap gap-2">
          <?php foreach ($chips as $c) : ?>
            <button type="button" data-filter="<?php echo esc_attr($c); ?>" aria-pressed="<?php echo $c === 'All' ? 'true' : 'false'; ?>" class="rounded-full px-4 py-2 text-sm font-semibold transition-colors bg-mist text-ink hover:bg-pink-soft aria-pressed:bg-pink aria-pressed:text-white"><?php mm_e($c); ?></button>
          <?php endforeach; ?>
        </div>
        <p class="sr-only" aria-live="polite" data-filter-status></p>

        <ul class="relative mt-10 grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
          <?php foreach ($data['projects'] as $i => $p) : ?>
            <li data-category="<?php echo esc_attr($p['category']); ?>"<?php echo mm_reveal(min($i, 8) * 0.06, '', 0, 24); ?>>
              <?php mm_project_card($p); ?>
            </li>
          <?php endforeach; ?>
        </ul>
      </section>
    </div>
  <?php endforeach; ?>
</div>

<!-- ---------- Thank you ---------- -->
<section class="px-4 pb-20 sm:px-6">
  <div<?php echo mm_reveal(0, 'mx-auto max-w-7xl'); ?>>
    <a href="<?php echo esc_url(mm_url('/our-funders')); ?>" class="group flex flex-col gap-6 rounded-[2rem] bg-mist px-8 py-12 transition-colors hover:bg-pink-soft sm:px-14 md:flex-row md:items-center md:justify-between">
      <span>
        <span class="block font-display text-4xl font-bold text-pink sm:text-5xl">Thank you</span>
        <span class="mt-3 block max-w-2xl text-lg leading-relaxed text-ink">Special thanks to our trustees, staff, volunteers, tutors, youth workers, partners and parent contributors.</span>
      </span>
      <span class="shrink-0 font-semibold text-pink underline-offset-4 group-hover:underline">See our funders</span>
    </a>
  </div>
</section>

<?php get_footer();
