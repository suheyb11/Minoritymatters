<?php
if (!defined('ABSPATH')) exit;
// /press

$press = mm_rows('mm_press');
$press_email = mm_setting('pressEmail');

get_header();
mm_page_header('press', 'Coverage of our work with families affected by county lines and criminal exploitation.', 0.12);
?>

<section class="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
  <p class="text-lg">
    For press enquiries contact
    <a href="mailto:<?php echo esc_attr($press_email); ?>" class="font-semibold text-pink underline-offset-4 hover:underline"><?php mm_e($press_email); ?></a>
  </p>

  <ul class="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
    <?php foreach ($press as $i => $item) : ?>
      <li>
        <div<?php echo mm_reveal(($i % 3) * 0.08); ?>>
          <a href="<?php echo esc_url($item['url']); ?>" target="_blank" rel="noopener noreferrer" class="group block">
            <div class="photo-frame aspect-[16/10]">
              <?php if ($item['image']) : ?>
                <img src="<?php echo esc_url(mm_img($item['image'])); ?>" alt="" loading="lazy" class="h-full w-full object-cover grayscale transition duration-500 group-hover:grayscale-0 motion-safe:group-hover:scale-[1.04]">
              <?php endif; ?>
            </div>
            <p class="mt-4 text-sm font-semibold text-pink"><?php mm_e($item['source']); ?></p>
            <h2 class="mt-1 font-display text-xl font-semibold leading-snug group-hover:underline"><?php mm_e($item['title']); ?></h2>
            <span class="mt-2 inline-block text-sm text-muted">Opens on <?php mm_e($item['source'] ?: "the publisher's site"); ?></span>
          </a>
        </div>
      </li>
    <?php endforeach; ?>
  </ul>
</section>

<?php get_footer();
