<?php
if (!defined('ABSPATH')) exit;
// /our-funders

$funders = mm_rows('mm_funder');
$with_logo = array_values(array_filter($funders, function ($f) { return $f['logo'] !== ''; }));

get_header();
mm_page_header('our funders', 'Our work is possible thanks to the trusts, councils and partners who fund it. Thank you.', 0.25);
?>

<section class="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
  <ul class="grid grid-cols-2 gap-4 md:grid-cols-3">
    <?php foreach ($with_logo as $i => $f) : ?>
      <li>
        <div<?php echo mm_reveal(($i % 3) * 0.08); ?>>
          <a<?php echo $f['url'] ? ' href="' . esc_url($f['url']) . '" target="_blank"' : ''; ?> rel="noopener noreferrer" class="flex h-36 items-center justify-center rounded-2xl border border-mist bg-white p-6 transition-colors hover:border-pink">
            <img src="<?php echo esc_url(mm_img($f['logo'])); ?>" alt="<?php echo esc_attr($f['title']); ?>" loading="lazy" class="max-h-16 w-auto max-w-full object-contain">
          </a>
        </div>
      </li>
    <?php endforeach; ?>
  </ul>

  <div class="mt-20 grid gap-10 lg:grid-cols-[1fr_2fr]">
    <h2 class="font-display text-4xl font-bold leading-tight">Our current and previous funders include</h2>
    <ul class="divide-y divide-grey/40 border-y border-grey/40">
      <?php foreach ($funders as $f) : ?>
        <li class="flex items-center gap-4 py-4 text-lg">
          <span class="h-2.5 w-2.5 shrink-0 rounded-full bg-pink" aria-hidden="true"></span>
          <?php if ($f['url']) : ?>
            <a href="<?php echo esc_url($f['url']); ?>" target="_blank" rel="noopener noreferrer" class="hover:text-pink"><?php mm_e($f['title']); ?></a>
          <?php else : ?>
            <span><?php mm_e($f['title']); ?></span>
          <?php endif; ?>
        </li>
      <?php endforeach; ?>
    </ul>
  </div>
</section>

<?php get_footer();
