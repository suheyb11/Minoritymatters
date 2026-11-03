<?php
if (!defined('ABSPATH')) exit;
// /about

$milestones = [
  ['2010', 'Minority Matters starts, offering educational support to children and young people.'],
  ['Growing', 'Parents come to us with wider issues, and we begin working with local authorities.'],
  ['2015', 'We start safeguarding training for supplementary school and madrasah teachers.'],
  ['2021', "We call on London's mayoral candidates to end child criminal exploitation."],
];
$values = mm_rows('mm_value');
$who_we_are = mm_paragraphs(mm_setting('whoWeAre'));
$founder_photo = mm_setting('founderPhoto');

get_header();
mm_page_header('about', '', 0.65);
?>

<section class="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
  <div<?php echo mm_reveal(); ?>>
    <p class="max-w-5xl font-display text-3xl font-semibold leading-snug text-ink/45 sm:text-5xl sm:leading-tight"><?php mm_highlight(mm_setting('aboutLead')); ?></p>
  </div>
  <?php if ($who_we_are) : ?>
    <div class="mt-16 grid items-center gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
      <div<?php echo mm_reveal(); ?>>
        <h2 class="font-display text-4xl font-bold text-pink">Who we are</h2>
        <?php foreach ($who_we_are as $i => $p) : ?>
          <p class="mt-5 leading-relaxed <?php echo $i === 0 ? 'text-xl text-ink' : 'text-lg text-muted'; ?>"><?php mm_e($p); ?></p>
        <?php endforeach; ?>

        <?php // FounderTeaser: a small card that links to the founder video page ?>
        <a href="<?php echo esc_url(mm_url('/our-founder')); ?>" class="group mt-10 flex max-w-md items-center gap-5 rounded-2xl border border-grey/40 bg-white p-3 pr-6 transition hover:border-pink hover:shadow-md">
          <span class="relative aspect-video w-36 shrink-0 overflow-hidden rounded-xl bg-plum sm:w-40">
            <?php if ($founder_photo) mm_fill_img($founder_photo, '', 'object-cover transition duration-500 motion-safe:group-hover:scale-110'); ?>
            <span class="absolute inset-0 bg-plum/35" aria-hidden="true"></span>
            <span class="absolute inset-0 m-auto flex h-12 w-12 items-center justify-center">
              <?php mm_play_ring(false, true); ?>
              <span class="flex h-8 w-8 items-center justify-center rounded-full bg-pink pl-0.5 text-white"><?php mm_play_icon('h-4 w-4'); ?></span>
            </span>
          </span>
          <span>
            <span class="block text-sm font-semibold text-pink">Hear from our founder</span>
            <span class="mt-0.5 block font-display text-xl font-semibold leading-tight text-ink group-hover:text-pink"><?php mm_e(mm_setting('founderName')); ?></span>
          </span>
        </a>
      </div>
      <div<?php echo mm_reveal(0.1); ?>>
        <?php mm_glow_photo('/images/photos/group-trip.jpg', 'A large group of young people from Minority Matters smiling and waving on a grassy hilltop on a trip', 'aspect-[4/3]'); ?>
      </div>
    </div>
  <?php endif; ?>
  <div<?php echo mm_reveal(0.1); ?>>
    <p class="mt-16 max-w-3xl text-lg leading-relaxed text-muted"><?php mm_e(mm_setting('aboutStory')); ?></p>
  </div>
</section>

<!-- Timeline -->
<section class="bg-mist">
  <div class="mx-auto max-w-7xl px-4 py-20 sm:px-6">
    <h2 class="font-display text-4xl font-bold lowercase">our journey</h2>
    <ol class="relative mt-12 grid gap-10 md:grid-cols-4 md:gap-6">
      <span class="absolute left-[7px] top-2 h-[calc(100%-1rem)] w-0.5 bg-grey/60 md:left-0 md:top-[7px] md:h-0.5 md:w-full" aria-hidden="true"></span>
      <?php foreach ($milestones as $i => $m) : ?>
        <li class="relative pl-10 md:pl-0 md:pt-10">
          <div<?php echo mm_reveal($i * 0.12); ?>>
            <span class="absolute left-0 top-1 h-4 w-4 rounded-full border-4 border-pink bg-white md:top-0" aria-hidden="true"></span>
            <p class="font-display text-3xl font-bold text-pink"><?php mm_e($m[0]); ?></p>
            <p class="mt-2 leading-relaxed text-muted"><?php mm_e($m[1]); ?></p>
          </div>
        </li>
      <?php endforeach; ?>
    </ol>
  </div>
</section>

<!-- Vision & mission -->
<section class="mx-auto grid max-w-7xl gap-16 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1fr_1.4fr]">
  <div<?php echo mm_reveal(); ?>>
    <div class="lg:sticky lg:top-28">
      <h2 class="font-display text-4xl font-bold text-pink">Our vision</h2>
      <p class="mt-5 text-xl leading-relaxed text-ink"><?php mm_e(mm_setting('vision')); ?></p>
    </div>
  </div>
  <div>
    <div<?php echo mm_reveal(); ?>>
      <h2 class="font-display text-4xl font-bold text-pink">Our mission</h2>
    </div>
    <?php foreach (mm_paragraphs(mm_setting('mission')) as $p) : ?>
      <div<?php echo mm_reveal(0.05); ?>>
        <p class="mt-5 text-lg leading-relaxed text-muted"><?php mm_e($p); ?></p>
      </div>
    <?php endforeach; ?>
  </div>
</section>

<!-- Icon row, like the original site, with a link to the Values page -->
<section class="border-t border-mist">
  <ul class="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-8 px-4 pb-8 pt-14 sm:px-6">
    <?php foreach ($values as $i => $v) : ?>
      <li<?php echo mm_reveal($i * 0.05); ?>>
        <img src="<?php echo esc_url(mm_img($v['icon'])); ?>" alt="<?php echo esc_attr($v['title']); ?>" title="<?php echo esc_attr($v['title']); ?>" class="h-16 w-16">
      </li>
    <?php endforeach; ?>
  </ul>
  <p class="flex flex-wrap justify-center gap-x-8 gap-y-3 pb-14 text-center">
    <a href="<?php echo esc_url(mm_url('/values')); ?>" class="font-semibold text-pink underline-offset-4 hover:underline">Read about our values</a>
    <a href="<?php echo esc_url(mm_url('/press')); ?>" class="font-semibold text-pink underline-offset-4 hover:underline">Our work in the press</a>
  </p>
</section>

<?php get_footer();
