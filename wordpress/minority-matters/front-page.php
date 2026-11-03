<?php
if (!defined('ABSPATH')) exit;
// The home page

$pillars = [
  ['Promotion', '/images/icons/promotion.svg', 'We foster social inclusion and encourage community cohesion.'],
  ['Empowerment', '/images/icons/empowerment.svg', 'We empower young people to improve their own position by building confidence and a positive self-image.'],
  ['Safeguarding', '/images/icons/safeguarding.svg', 'We focus on safeguarding of children in minority communities.'],
];

$areas = array_values(array_filter(mm_rows('mm_service'), function ($s) { return $s['kind'] === 'area'; })); // the 5 main service areas
$who_we_are = mm_paragraphs(mm_setting('whoWeAre'));
$values = mm_rows('mm_value');
$press = array_slice(mm_rows('mm_press'), 0, 3);
$posts = get_posts(['numberposts' => 2, 'post_status' => 'publish']);
$logos = array_values(array_filter(mm_rows('mm_funder'), function ($f) { return $f['showLogo'] && $f['logo']; }));

// ---------- The stats band: 2 fixed numbers + 2 from the newest period's projects ----------
$periods = mm_project_periods();
$latest_period = $periods ? $periods[0] : '';
$this_year = $latest_period ? mm_projects($latest_period) : [];
$stats = array_filter([
  ['value' => (int) gmdate('Y') - 2010, 'suffix' => '+', 'label' => 'years serving our community', 'focus' => false],
  ['value' => array_sum(array_column($this_year, 'peopleReached')), 'suffix' => '', 'label' => 'people took part in ' . $latest_period, 'focus' => true],
  ['value' => count($this_year), 'suffix' => '', 'label' => 'projects delivered this year', 'focus' => false],
  ['value' => 150, 'suffix' => '+', 'label' => 'teachers trained in safeguarding', 'focus' => false],
], function ($s) { return $s['value'] > 0; });

// ---------- The slim "Next event" bar under the hero (hidden when there is no upcoming event) ----------
$next_event = mm_next_event();

// ---------- The featured story (chosen in Projects → "Feature on the home page") ----------
$story = mm_featured_project();
$story_text = '';
$story_stats = [];
if ($story) {
  $body = mm_paragraphs($story['body']);
  $story_text = implode(' ', array_filter([$story['summary'], $body ? $body[0] : ''], 'strlen'));
  $story_stats = array_slice(mm_stats($story['stats']), 0, 3);
}

get_header();
?>

<!-- ---------- Hero ---------- -->
<section class="relative overflow-hidden">
  <div class="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-12 sm:px-6 md:grid-cols-[1.2fr_1fr] md:pt-20">
    <div>
      <div<?php echo mm_reveal(); ?>>
        <p class="font-display text-2xl font-semibold lowercase text-pink sm:text-3xl">welcome to</p>
      </div>
      <div<?php echo mm_reveal(0.15); ?>>
        <h1 class="mt-4 font-display font-bold lowercase leading-[0.82]">
          <span class="block text-[clamp(3.5rem,10vw,7rem)] text-grey">minority</span>
          <span class="block text-[clamp(4.5rem,15vw,11rem)] text-pink">matters</span>
        </h1>
      </div>
      <div<?php echo mm_reveal(0.3); ?>>
        <?php if (mm_setting('tagline')) : ?>
          <p class="mt-8 max-w-lg text-lg leading-relaxed text-muted"><?php mm_e(mm_setting('tagline')); ?></p>
        <?php endif; ?>
        <div class="mt-8 flex flex-wrap gap-3">
          <a href="<?php echo esc_url(mm_url('/our-work')); ?>" class="rounded-full bg-ink px-6 py-3.5 font-semibold text-white transition-colors hover:bg-pink">See our work</a>
          <a<?php echo mm_donate_attrs(); ?> class="rounded-full border-2 border-pink px-6 py-3 font-semibold text-pink transition-colors hover:bg-pink hover:text-white">Donate to our work</a>
        </div>
      </div>
    </div>
    <div class="flex justify-center md:justify-end">
      <?php // HeroRing: the pink arc sweeps around the circle and stops at the logo position, while the values change in the middle ?>
      <div class="relative aspect-square w-full max-w-[460px]">
        <svg viewBox="0 0 100 100" class="absolute inset-0 h-full w-full" aria-hidden="true">
          <circle class="hero-track" cx="50" cy="50" r="46" fill="none" stroke="#b2b2b2" stroke-width="2.2" pathLength="100" stroke-dasharray="100 100"/>
          <g class="hero-sweep">
            <circle class="hero-arc" cx="50" cy="50" r="46" fill="none" stroke="#e71d73" stroke-width="4.5" pathLength="100" stroke-dasharray="17 100" transform="rotate(-90 50 50)"/>
          </g>
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center px-12 text-center">
          <p class="text-sm text-muted">we stand for</p>
          <div class="relative mt-2 h-14 w-full">
            <p class="hero-word absolute inset-0 font-display text-3xl font-semibold text-pink sm:text-4xl" data-words="<?php echo esc_attr(wp_json_encode(array_column($values, 'title'))); ?>"><?php mm_e($values ? $values[0]['title'] : ''); ?></p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<?php if ($next_event) : ?>
  <!-- ---------- Next event: one line that links to the event (wraps to two lines on phones) ---------- -->
  <aside aria-label="Next event" class="border-y border-[#e5e3e8]">
    <a href="<?php echo esc_url(get_permalink($next_event['id'])); ?>" class="group mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 sm:px-6">
      <span class="min-w-0 flex-1 basis-64">
        <span class="font-semibold text-pink">Next event:</span>
        <span class="font-semibold text-ink group-hover:text-pink"><?php mm_e($next_event['title']); ?></span>
        <span class="text-muted"> · <?php mm_e(mm_event_date($next_event['startsAt'], $next_event['endsAt'])); ?><?php if ($next_event['location']) : ?> · <?php mm_e($next_event['location']); ?><?php endif; ?></span>
      </span>
      <span class="shrink-0 rounded-full bg-pink px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-pink-dark"><?php echo $next_event['bookingType'] === 'none' ? 'See details' : 'Book a place'; ?></span>
    </a>
  </aside>
<?php endif; ?>

<!-- ---------- Welcome + three pillars ---------- -->
<section class="bg-mist">
  <div class="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
    <div class="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
      <div<?php echo mm_reveal(); ?>>
        <h2 class="font-display text-4xl font-bold leading-tight text-pink sm:text-5xl"><?php mm_e(mm_setting('introHeading')); ?></h2>
        <p class="mt-4 font-display text-2xl leading-snug text-ink/60"><?php mm_e(mm_setting('introSubtitle')); ?></p>
      </div>
      <div<?php echo mm_reveal(0.1); ?>>
        <p class="text-lg leading-relaxed text-muted"><?php mm_e(mm_setting('introText')); ?></p>
      </div>
    </div>

    <div class="mt-16 grid gap-6 md:grid-cols-3">
      <?php foreach ($pillars as $i => $p) : ?>
        <div<?php echo mm_reveal($i * 0.1); ?>>
          <div class="h-full rounded-3xl bg-white p-8">
            <img src="<?php echo esc_url(mm_img($p[1])); ?>" alt="" class="h-20 w-20">
            <h3 class="mt-6 font-display text-2xl font-semibold text-pink"><?php mm_e($p[0]); ?></h3>
            <p class="mt-2 leading-relaxed text-muted"><?php mm_e($p[2]); ?></p>
          </div>
        </div>
      <?php endforeach; ?>
    </div>
  </div>
</section>

<!-- ---------- Stats band ---------- -->
<section class="border-b border-mist" aria-labelledby="stats-title">
  <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
    <h2 id="stats-title" class="font-display text-xl font-semibold text-ink">Since 2010 in Islington, Camden and Hackney</h2>
    <dl class="mt-8 grid grid-cols-2 gap-y-10 lg:grid-cols-4 lg:divide-x lg:divide-[#e5e3e8]">
      <?php foreach ($stats as $s) : ?>
        <div class="flex flex-col-reverse justify-end gap-2 pr-4 lg:px-8 lg:first:pl-0">
          <dt class="text-muted"><?php mm_e($s['label']); ?></dt>
          <dd class="font-display text-5xl font-bold leading-none sm:text-6xl lg:text-7xl <?php echo $s['focus'] ? 'text-pink' : 'text-ink'; ?>"><?php mm_count_up($s['value'], $s['suffix']); ?></dd>
        </div>
      <?php endforeach; ?>
    </dl>
    <a href="<?php echo esc_url(mm_url('/impact')); ?>" class="mt-10 inline-block font-semibold text-pink underline-offset-4 hover:underline">See what we delivered this year</a>
  </div>
</section>

<?php if ($who_we_are) : ?>
  <!-- ---------- Who we are: text on white + a big feathered photo that links to the founder video ---------- -->
  <section class="overflow-x-clip bg-white py-20 lg:py-28" aria-labelledby="who-title">
    <div class="mx-auto grid max-w-7xl items-center gap-6 px-4 sm:px-6 lg:grid-cols-12 lg:gap-8">
      <div<?php echo mm_reveal(0, 'lg:col-span-5'); ?>>
        <span class="block h-1 w-12 rounded-full bg-pink" aria-hidden="true"></span>
        <h2 id="who-title" class="mt-6 font-display text-4xl font-bold text-pink md:text-5xl">Who we are</h2>
        <p class="mt-5 text-lg leading-relaxed text-ink"><?php mm_e($who_we_are[0]); ?></p>
        <?php if (isset($who_we_are[1])) : ?><p class="mt-4 leading-relaxed text-muted"><?php mm_e($who_we_are[1]); ?></p><?php endif; ?>
        <div class="mt-8 flex flex-wrap gap-3">
          <a href="<?php echo esc_url(mm_url('/our-work')); ?>" class="rounded-full bg-ink px-6 py-3.5 font-semibold text-white transition-colors hover:bg-pink">See our work</a>
          <a href="<?php echo esc_url(mm_url('/our-founder')); ?>" class="inline-flex items-center gap-2 rounded-full border-2 border-pink px-6 py-3 font-semibold text-pink transition-colors hover:bg-pink hover:text-white">
            <?php mm_play_icon('h-4 w-4'); ?> Watch our founder
          </a>
        </div>
      </div>

      <div<?php echo mm_reveal(0.1, 'lg:col-span-7 lg:-mr-12', 0, 0, 0.97); ?>>
        <a href="<?php echo esc_url(mm_url('/our-founder')); ?>" aria-label="<?php echo esc_attr('Watch: ' . mm_setting('founderName') . ' on Minority Matters'); ?>" class="group relative block">
          <?php mm_glow_photo(
            mm_setting('founderPhoto') ?: '/images/photos/hands-together.jpg',
            "Children's hands stacked together in the middle of a circle, as a sign of teamwork",
            'aspect-[4/3]',
            'transition-transform duration-700 motion-safe:group-hover:scale-[1.03] motion-safe:group-focus-visible:scale-[1.03]'
          ); ?>
          <span class="absolute inset-0 m-auto flex h-24 w-24 items-center justify-center" aria-hidden="true">
            <?php mm_play_ring(false, true, '#ffffff', 2); ?>
            <span class="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-pink pl-1 text-white shadow-lg"><?php mm_play_icon('h-7 w-7'); ?></span>
          </span>
          <span class="absolute bottom-[6%] left-[6%] rounded-full bg-white/80 px-4 py-2 backdrop-blur-sm" aria-hidden="true">
            <span class="block text-sm text-ink/70">Hear from our founder</span>
            <span class="block font-semibold leading-tight text-ink"><?php mm_e(mm_setting('founderName')); ?></span>
          </span>
        </a>
      </div>
    </div>
  </section>
<?php endif; ?>

<?php if ($story) : ?>
  <!-- ---------- Featured story (Projects → "Feature on the home page") ---------- -->
  <section class="bg-white pb-20 lg:pb-28" aria-labelledby="story-title">
    <div class="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
      <div<?php echo mm_reveal(); ?>>
        <div class="photo-frame aspect-[4/3] bg-mist">
          <?php if ($story['coverImage']) mm_fill_img($story['coverImage'], mm_cover_alt($story)); ?>
        </div>
      </div>
      <div<?php echo mm_reveal(0.1); ?>>
        <p class="text-sm font-semibold text-pink">Featured story</p>
        <h2 id="story-title" class="mt-2 font-display text-4xl font-bold leading-tight text-ink sm:text-5xl"><?php mm_e($story['featuredHeadline'] ?: $story['title']); ?></h2>
        <p class="mt-5 line-clamp-4 text-lg leading-relaxed text-muted"><?php mm_e($story_text); ?></p>
        <?php if ($story_stats) : ?>
          <ul class="mt-6 flex flex-wrap gap-2">
            <?php foreach ($story_stats as $s) : ?>
              <li class="flex items-baseline gap-1.5 rounded-full bg-pink-soft px-4 py-2">
                <span class="font-display text-xl font-bold text-pink"><?php mm_e($s['number']); ?></span>
                <span class="text-sm text-ink"><?php mm_e($s['label']); ?></span>
              </li>
            <?php endforeach; ?>
          </ul>
        <?php endif; ?>
        <div class="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
          <a href="<?php echo esc_url(get_permalink($story['id'])); ?>" class="rounded-full bg-ink px-6 py-3.5 font-semibold text-white transition-colors hover:bg-pink">Read the story</a>
          <?php if ($this_year) : ?>
            <a href="<?php echo esc_url(mm_url('/impact')); ?>" class="font-semibold text-pink underline-offset-4 hover:underline">See all <?php echo count($this_year); ?> projects</a>
          <?php endif; ?>
        </div>
      </div>
    </div>
  </section>
<?php endif; ?>

<!-- ---------- Our work preview ---------- -->
<section>
  <div class="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
    <div class="flex flex-wrap items-end justify-between gap-6">
      <div<?php echo mm_reveal(); ?>>
        <h2 class="font-display text-5xl font-bold lowercase text-ink sm:text-6xl">our work</h2>
        <p class="mt-3 max-w-xl text-lg text-muted">Our five main service areas — built with the community, for the community.</p>
      </div>
      <a href="<?php echo esc_url(mm_url('/our-work')); ?>" class="font-semibold text-pink underline-offset-4 hover:underline">See all our work</a>
    </div>

    <ul class="mt-12 grid gap-4 md:grid-cols-2">
      <?php foreach ($areas as $i => $s) : ?>
        <li<?php echo mm_reveal(min($i * 0.05, 0.25)); ?>>
          <a href="<?php echo esc_url(mm_url('/our-work') . '#' . $s['slug']); ?>" class="group flex h-full items-start gap-5 rounded-2xl border border-mist p-6 transition-colors hover:border-pink hover:bg-pink-soft/40">
            <img src="<?php echo esc_url(mm_img($s['icon'])); ?>" alt="" class="h-12 w-12 shrink-0">
            <span>
              <span class="block font-display text-xl font-semibold leading-snug group-hover:text-pink"><?php mm_e($s['title']); ?></span>
              <span class="mt-1 block text-muted"><?php mm_e($s['summary']); ?></span>
            </span>
          </a>
        </li>
      <?php endforeach; ?>
    </ul>
  </div>
</section>

<!-- ---------- CCE statement ---------- -->
<section class="bg-plum text-white">
  <div class="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.5fr_1fr] lg:items-end">
    <div<?php echo mm_reveal(); ?>>
      <blockquote class="font-display text-4xl font-semibold leading-tight sm:text-5xl">“No child or young person wants to be enslaved, hurt and criminally exploited.”</blockquote>
    </div>
    <div<?php echo mm_reveal(0.15); ?>>
      <p class="text-lg leading-relaxed text-white/75">We support families whose children have been groomed into county lines, and campaign to change how services respond to young victims.</p>
      <a href="<?php echo esc_url(mm_url('/our-work') . '#cce-victims-families-support'); ?>" class="mt-6 inline-block rounded-full bg-pink px-6 py-3.5 font-semibold text-white transition-colors hover:bg-white hover:text-pink">How we support families</a>
    </div>
  </div>
</section>

<!-- ---------- Press + blog ---------- -->
<section class="bg-mist">
  <div class="mx-auto grid max-w-7xl gap-16 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.6fr_1fr]">
    <div>
      <div class="flex items-end justify-between gap-4">
        <h2 class="font-display text-4xl font-bold lowercase">in the press</h2>
        <a href="<?php echo esc_url(mm_url('/press')); ?>" class="font-semibold text-pink underline-offset-4 hover:underline">All press</a>
      </div>
      <ul class="mt-8 grid gap-5 sm:grid-cols-3">
        <?php foreach ($press as $item) : ?>
          <li>
            <a href="<?php echo esc_url($item['url']); ?>" target="_blank" rel="noopener noreferrer" class="group block">
              <div class="photo-frame aspect-[4/3]">
                <?php if ($item['image']) : ?>
                  <img src="<?php echo esc_url(mm_img($item['image'])); ?>" alt="" loading="lazy" class="h-full w-full object-cover grayscale transition duration-500 group-hover:grayscale-0 motion-safe:group-hover:scale-[1.04]">
                <?php endif; ?>
              </div>
              <p class="mt-3 text-sm font-semibold text-pink"><?php mm_e($item['source']); ?></p>
              <p class="mt-1 font-medium leading-snug group-hover:underline"><?php mm_e($item['title']); ?></p>
            </a>
          </li>
        <?php endforeach; ?>
      </ul>
    </div>

    <div>
      <div class="flex items-end justify-between gap-4">
        <h2 class="font-display text-4xl font-bold lowercase">from the blog</h2>
        <a href="<?php echo esc_url(mm_url('/blog')); ?>" class="font-semibold text-pink underline-offset-4 hover:underline">All posts</a>
      </div>
      <ul class="mt-8 space-y-4">
        <?php foreach ($posts as $post_item) : ?>
          <li>
            <a href="<?php echo esc_url(get_permalink($post_item)); ?>" class="group block rounded-2xl bg-white p-6">
              <p class="text-sm text-muted"><?php mm_e(get_the_date('j F Y', $post_item)); ?></p>
              <p class="mt-2 font-display text-xl font-semibold leading-snug group-hover:text-pink"><?php mm_e(get_the_title($post_item)); ?></p>
            </a>
          </li>
        <?php endforeach; ?>
      </ul>
    </div>
  </div>
</section>

<?php if ($logos) : ?>
  <!-- ---------- Funders ---------- -->
  <section aria-labelledby="funders-title">
    <div class="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
      <h2 id="funders-title" class="text-center text-sm font-semibold text-pink">Supported by our funders and partners</h2>
    </div>
    <div class="marquee overflow-hidden py-10">
      <div class="marquee-track flex w-max items-center gap-16">
        <?php foreach (array_merge($logos, $logos) as $i => $f) : $copy = $i >= count($logos); ?>
          <img src="<?php echo esc_url(mm_img($f['logo'])); ?>" alt="<?php echo $copy ? '' : esc_attr($f['title']); ?>"<?php echo $copy ? ' aria-hidden="true"' : ''; ?> loading="lazy" class="h-12 w-auto max-w-[200px] object-contain opacity-80 grayscale transition hover:opacity-100 hover:grayscale-0">
        <?php endforeach; ?>
      </div>
    </div>
  </section>
<?php endif; ?>

<!-- ---------- Call to action ---------- -->
<section class="px-4 pb-20 sm:px-6">
  <?php mm_cta(
    'Stand with our community',
    'Your donation funds tutoring, parent programmes and support for families affected by exploitation.',
    ['label' => 'Donate', 'donate' => true],
    ['label' => 'Get in touch', 'href' => mm_url('/contact')]
  ); ?>
</section>

<?php get_footer();
