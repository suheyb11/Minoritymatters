<?php
if (!defined('ABSPATH')) exit;
// /blog: every published post (the WordPress "Posts page")

get_header();
mm_page_header('blog', 'News, campaigns and reflections from Minority Matters.', 0.5);
?>

<section class="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
  <?php if (!have_posts()) : ?><p class="text-muted">There are no posts yet. Check back soon.</p><?php endif; ?>
  <ul class="divide-y divide-grey/40">
    <?php $i = 0; while (have_posts()) : the_post();
      $cover = get_post_meta(get_the_ID(), 'mm_coverImage', true);
      $date = get_the_date('j F Y');
    ?>
      <li>
        <div<?php echo mm_reveal(min($i++ * 0.05, 0.2)); ?>>
          <a href="<?php the_permalink(); ?>" class="group grid gap-6 py-10 sm:grid-cols-[1fr_2.5fr]">
            <?php if ($cover) : ?>
              <img src="<?php echo esc_url(mm_img($cover)); ?>" alt="" loading="lazy" class="feather aspect-[4/3] w-full object-cover">
            <?php else : ?>
              <time class="text-muted" datetime="<?php echo esc_attr(get_the_date('c')); ?>"><?php mm_e($date); ?></time>
            <?php endif; ?>
            <div>
              <?php if ($cover) : ?><p class="text-sm text-muted"><?php mm_e($date); ?></p><?php endif; ?>
              <h2 class="font-display text-3xl font-semibold leading-tight text-pink group-hover:underline"><?php the_title(); ?></h2>
              <p class="mt-3 leading-relaxed text-muted"><?php echo esc_html(get_the_excerpt()); ?></p>
              <span class="mt-4 inline-block font-semibold text-ink">Read post</span>
            </div>
          </a>
        </div>
      </li>
    <?php endwhile; ?>
  </ul>

  <?php // Older / newer posts (only when there are more than fit on one page, see Settings > Reading) ?>
  <nav class="mt-10 flex justify-between font-semibold text-pink" aria-label="More posts">
    <span><?php next_posts_link('Older posts'); ?></span>
    <span><?php previous_posts_link('Newer posts'); ?></span>
  </nav>
</section>

<?php get_footer();
