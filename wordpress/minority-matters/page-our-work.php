<?php
if (!defined('ABSPATH')) exit;
// /our-work: the 5 main service areas, a big photo, the programmes (open and close) and the referral band

$services = mm_rows('mm_service');
$projects = mm_projects(); // for the "Recent projects" links under each area
$areas = array_values(array_filter($services, function ($s) { return $s['kind'] === 'area'; }));
$programmes = array_values(array_filter($services, function ($s) { return $s['kind'] === 'programme'; }));

// The intro is the second paragraph of "Who we are" ("We have a wide mandate…")
$who_we_are = mm_paragraphs(mm_setting('whoWeAre'));
$intro = isset($who_we_are[1]) ? $who_we_are[1] : (isset($who_we_are[0]) ? $who_we_are[0] : '');
$phone = mm_setting('phone');
$referral = mm_setting('referralText');
$line = mm_setting('communityLine');

get_header();
mm_page_header('our work', $intro, 0.35);
?>

<!-- ---------- Main service areas ---------- -->
<section class="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24" aria-labelledby="areas-title">
  <div<?php echo mm_reveal(); ?>>
    <h2 id="areas-title" class="font-display text-4xl font-bold lowercase sm:text-5xl">what we do</h2>
    <p class="mt-3 max-w-2xl text-lg text-muted">Our five main service areas.</p>
  </div>
  <div class="mt-12">
    <?php // Desktop: a sticky menu on the left (the pink dot follows the area you are reading). Mobile: just the blocks. ?>
    <div class="lg:grid lg:grid-cols-[17rem_1fr] lg:gap-16" data-area-spy>
      <nav aria-label="Service areas" class="hidden lg:block">
        <div class="sticky top-28">
        <span class="absolute left-2.5 top-[1.05rem] z-10 h-2.5 w-2.5 rounded-full bg-pink transition-transform duration-300 ease-out" data-area-dot aria-hidden="true"></span>
        <ul class="space-y-1">
          <?php foreach ($areas as $i => $area) : ?>
            <li>
              <a href="#<?php echo esc_attr($area['slug']); ?>" data-area-link="<?php echo esc_attr($area['slug']); ?>"<?php echo $i === 0 ? ' aria-current="true"' : ''; ?> class="relative block rounded-xl py-2.5 pl-8 pr-3 text-[0.95rem] leading-snug transition-colors text-muted hover:text-ink aria-[current=true]:font-semibold aria-[current=true]:text-ink"><?php mm_e($area['title']); ?></a>
            </li>
          <?php endforeach; ?>
        </ul>
        </div>
      </nav>

      <div class="space-y-6">
        <?php foreach ($areas as $i => $area) :
          $points = mm_lines($area['points']);
          $linked = array_slice(array_values(array_filter($projects, function ($p) use ($area) { return $p['relatedService'] === $area['slug']; })), 0, 4);
        ?>
          <article id="<?php echo esc_attr($area['slug']); ?>" class="scroll-mt-28 rounded-[2rem] bg-mist p-7 sm:p-12">
            <div class="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
              <div class="relative h-24 w-24 shrink-0">
                <?php mm_ring(96, 0.2, 5, '', true); ?>
                <img src="<?php echo esc_url(mm_img($area['icon'])); ?>" alt="" class="absolute inset-0 m-auto h-11 w-11">
              </div>
              <div>
                <p class="font-display text-sm font-semibold text-pink"><?php echo esc_html(str_pad((string) ($i + 1), 2, '0', STR_PAD_LEFT)); ?></p>
                <h3 class="mt-1 font-display text-2xl font-bold leading-tight sm:text-3xl"><?php mm_e($area['title']); ?></h3>
                <p class="mt-3 text-lg text-muted"><?php mm_e($area['summary']); ?></p>
              </div>
            </div>

            <ul class="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <?php foreach ($points as $j => $point) : ?>
                <li class="flex gap-3 leading-relaxed" data-reveal data-y="12" data-delay="<?php echo 0.15 + $j * 0.05; ?>" data-duration="0.4">
                  <span class="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-pink" aria-hidden="true"></span>
                  <span><?php mm_e($point); ?></span>
                </li>
              <?php endforeach; ?>
            </ul>

            <?php if ($linked) : ?>
              <div class="mt-8 border-t border-grey/40 pt-6">
                <h4 class="font-sans text-sm font-semibold text-ink">Recent projects</h4>
                <ul class="mt-3 flex flex-wrap gap-2">
                  <?php foreach ($linked as $p) : ?>
                    <li><a href="<?php echo esc_url(get_permalink($p['id'])); ?>" class="inline-block rounded-full bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-pink hover:text-white"><?php mm_e($p['title']); ?></a></li>
                  <?php endforeach; ?>
                </ul>
              </div>
            <?php endif; ?>
          </article>
        <?php endforeach; ?>
      </div>
    </div>
  </div>
</section>

<!-- ---------- Full-width photo (moves a little as you scroll) ---------- -->
<section class="relative flex min-h-[60svh] items-end overflow-hidden bg-white lg:min-h-[70svh]" data-parallax>
  <?php // Photo + tint + gradient all fade out at the top and bottom (.feather-y), into the white page ?>
  <div class="feather-y absolute inset-0">
    <?php // The photo is a little taller than the section, so it never shows a gap while it moves ?>
    <div class="absolute inset-x-0 -bottom-[10%] -top-[10%]" data-parallax-photo>
      <?php mm_fill_img('/images/photos/group-trip.jpg', 'A large group of young people from Minority Matters smiling and waving on a grassy hilltop on a trip', 'object-cover', false, 'object-position:center 60%'); ?>
    </div>
    <?php // Plum tint + gradient from the bottom, so the white text is always easy to read ?>
    <div class="absolute inset-0 bg-plum/30" aria-hidden="true"></div>
    <div class="absolute inset-0" style="background:linear-gradient(to top, rgba(43,15,29,0.9) 0%, rgba(43,15,29,0.72) 40%, rgba(43,15,29,0.3) 70%, rgba(43,15,29,0) 90%)" aria-hidden="true"></div>
  </div>

  <div class="relative mx-auto w-full max-w-7xl px-4 pb-28 pt-40 sm:px-6 sm:pb-32">
    <div<?php echo mm_reveal(); ?>>
      <?php if ($line) : ?>
        <h2 class="max-w-[14ch] font-display text-[clamp(2.5rem,7vw,5rem)] font-bold leading-[0.95] text-white"><?php mm_e($line); ?></h2>
      <?php endif; ?>
      <span class="mt-7 block h-1 bg-pink" style="width:80px" data-grow-line aria-hidden="true"></span>
      <a href="<?php echo esc_url(mm_url('/our-founder')); ?>" class="mt-8 inline-flex items-center gap-3 rounded-full border-2 border-white px-6 py-3 font-semibold text-white transition-colors hover:bg-white hover:text-plum">
        <?php mm_play_icon('h-4 w-4'); ?> Watch our founder's story
      </a>
    </div>
  </div>
</section>
<div class="h-16 sm:h-24" aria-hidden="true"></div>

<?php if ($programmes) : ?>
  <!-- ---------- Programmes (the first one is open) ---------- -->
  <section class="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24" aria-labelledby="programmes-title">
    <div<?php echo mm_reveal(); ?>>
      <h2 id="programmes-title" class="font-display text-4xl font-bold lowercase sm:text-5xl">our programmes</h2>
      <p class="mt-3 max-w-2xl text-lg text-muted">Select a programme to read more.</p>
    </div>
    <div class="mt-10">
      <ul class="divide-y divide-grey/50 border-y border-grey/50" data-accordion>
        <?php foreach ($programmes as $i => $s) :
          $open = $i === 0;
          $points = mm_lines($s['points']);
        ?>
          <li id="<?php echo esc_attr($s['slug']); ?>" class="reveal-rise scroll-mt-28" style="animation-delay:<?php echo 0.2 + $i * 0.07; ?>s">
            <button type="button" aria-expanded="<?php echo $open ? 'true' : 'false'; ?>" aria-controls="panel-<?php echo esc_attr($s['slug']); ?>" class="group flex w-full items-center gap-5 py-6 text-left sm:gap-8 sm:py-8">
              <span class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 transition-colors sm:h-20 sm:w-20 border-grey/60 bg-white group-hover:border-pink group-aria-expanded:border-pink group-aria-expanded:bg-pink-soft">
                <img src="<?php echo esc_url(mm_img($s['icon'])); ?>" alt="" class="h-9 w-9 sm:h-11 sm:w-11">
              </span>
              <span class="flex-1">
                <span class="block font-display text-xl font-semibold leading-tight text-ink group-hover:text-pink sm:text-2xl"><?php mm_e($s['title']); ?></span>
                <span class="mt-1 block text-muted"><?php mm_e($s['summary']); ?></span>
              </span>
              <span class="plus flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-2xl leading-none bg-mist text-ink group-aria-expanded:bg-pink group-aria-expanded:text-white" aria-hidden="true">+</span>
            </button>

            <div id="panel-<?php echo esc_attr($s['slug']); ?>" class="mm-collapse<?php echo $open ? ' is-open' : ''; ?>"<?php echo $open ? '' : ' inert'; ?>>
              <div>
                <div class="pb-10 sm:pl-28">
                  <?php if ($s['intro']) : ?><p class="max-w-3xl text-lg text-ink"><?php mm_e($s['intro']); ?></p><?php endif; ?>
                  <?php if ($points) : ?>
                    <ul class="mt-5 grid gap-3 md:grid-cols-2">
                      <?php foreach ($points as $j => $point) : ?>
                        <li class="point-in flex gap-3 rounded-xl bg-mist p-4 text-[0.95rem] leading-relaxed" style="animation-delay:<?php echo 0.1 + $j * 0.04; ?>s">
                          <span class="mt-2 h-2 w-2 shrink-0 rounded-full bg-pink" aria-hidden="true"></span>
                          <span><?php mm_e($point); ?></span>
                        </li>
                      <?php endforeach; ?>
                    </ul>
                  <?php endif; ?>
                  <?php foreach (mm_paragraphs($s['outro']) as $p) : ?>
                    <p class="mt-5 max-w-3xl leading-relaxed text-muted"><?php mm_e($p); ?></p>
                  <?php endforeach; ?>
                </div>
              </div>
            </div>
          </li>
        <?php endforeach; ?>
      </ul>
    </div>
  </section>
<?php endif; ?>

<!-- ---------- Referral (full-width, on a pink-tinted photo) ---------- -->
<section class="relative flex min-h-[60svh] items-center overflow-hidden bg-pink text-white">
  <?php // Only the photo fades at the top and bottom; the pink overlay stays strong for the white text ?>
  <div class="feather-y absolute inset-0">
    <?php mm_fill_img('/images/photos/parents-workshop.jpg', 'Parents and professionals seated at tables in a community hall, listening to a speaker at a workshop'); ?>
  </div>
  <?php // Pink "duotone": pink multiplied over the photo, plus a little plum so white text stays readable ?>
  <div class="absolute inset-0 bg-pink/90 mix-blend-multiply" aria-hidden="true"></div>
  <div class="absolute inset-0 bg-plum/25" aria-hidden="true"></div>
  <div class="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
    <div<?php echo mm_reveal(); ?>>
      <div class="grid gap-10 md:grid-cols-[1.5fr_1fr] md:items-center">
        <div>
          <h2 class="font-display text-4xl font-bold leading-tight sm:text-5xl">Not sure if we can help?</h2>
          <?php if ($referral) : ?><p class="mt-4 max-w-2xl text-lg text-white/90"><?php mm_e($referral); ?></p><?php endif; ?>
        </div>
        <div class="flex flex-wrap gap-3 md:justify-end">
          <a href="<?php echo esc_url(add_query_arg('reason', 'referral', mm_url('/contact'))); ?>" class="rounded-full bg-white px-6 py-3.5 font-semibold text-pink transition-colors hover:bg-plum hover:text-white">Make a referral</a>
          <a href="tel:<?php echo esc_attr(preg_replace('/\s/', '', $phone)); ?>" class="rounded-full border-2 border-white px-6 py-3 font-semibold text-white transition-colors hover:bg-white hover:text-pink">Call <?php mm_e($phone); ?></a>
        </div>
      </div>
      <p class="mt-10 border-t border-white/30 pt-6 text-sm text-white/90">
        If a child is in immediate danger, call <a href="tel:999" class="font-semibold underline">999</a>. To report a missing child, call <a href="tel:116000" class="font-semibold underline">116 000</a>.
      </p>
    </div>
  </div>
</section>

<?php get_footer();
