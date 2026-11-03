<?php
if (!defined('ABSPATH')) exit;
// The fallback for anything without its own template (categories, tags, search, …): a simple list of posts

get_header();
mm_page_header(is_search() ? 'search' : 'blog', '', 0.5);
?>
<section class="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
  <?php if (!have_posts()) : ?><p class="text-muted">Nothing found.</p><?php endif; ?>
  <ul class="divide-y divide-grey/40">
    <?php while (have_posts()) : the_post(); ?>
      <li class="py-8">
        <a href="<?php the_permalink(); ?>" class="group block">
          <p class="text-sm text-muted"><?php mm_e(get_the_date('j F Y')); ?></p>
          <h2 class="mt-1 font-display text-3xl font-semibold leading-tight text-pink group-hover:underline"><?php the_title(); ?></h2>
        </a>
      </li>
    <?php endwhile; ?>
  </ul>
</section>
<?php get_footer();
