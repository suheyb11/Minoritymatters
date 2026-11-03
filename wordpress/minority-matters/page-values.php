<?php
if (!defined('ABSPATH')) exit;
// /values

$values = mm_rows('mm_value');

get_header();
mm_page_header('values', 'The nine principles behind every programme we run.', 0.85);
?>

<section class="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
  <ul class="grid gap-px overflow-hidden rounded-[2rem] bg-grey/40 sm:grid-cols-2 lg:grid-cols-3">
    <?php foreach ($values as $i => $v) : ?>
      <li class="group bg-white p-8 sm:p-10">
        <div<?php echo mm_reveal(($i % 3) * 0.1); ?>>
          <img src="<?php echo esc_url(mm_img($v['icon'])); ?>" alt="" class="h-24 w-24 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
          <h2 class="mt-6 font-display text-2xl font-semibold text-pink"><?php mm_e($v['title']); ?></h2>
          <p class="mt-3 leading-relaxed text-muted"><?php mm_e($v['text']); ?></p>
        </div>
      </li>
    <?php endforeach; ?>
  </ul>
</section>

<?php get_footer();
