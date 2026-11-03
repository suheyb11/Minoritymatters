<?php
if (!defined('ABSPATH')) exit;
// /blog/<post>: one blog post

the_post();
$cover = get_post_meta(get_the_ID(), 'mm_coverImage', true);
$author = get_post_meta(get_the_ID(), 'mm_author', true) ?: 'Minority Matters';

get_header();
?>
<article>
  <header class="bg-mist">
    <div class="mx-auto max-w-3xl px-4 pb-14 pt-16 sm:px-6 sm:pt-24">
      <a href="<?php echo esc_url(mm_url('/blog')); ?>" class="text-sm font-semibold text-pink hover:underline">Back to blog</a>
      <div<?php echo mm_reveal(); ?>>
        <h1 class="mt-6 font-display text-4xl font-bold leading-tight text-ink sm:text-5xl"><?php the_title(); ?></h1>
        <p class="mt-5 text-muted"><?php mm_e($author); ?> · <time datetime="<?php echo esc_attr(get_the_date('c')); ?>"><?php mm_e(get_the_date('j F Y')); ?></time></p>
      </div>
    </div>
  </header>

  <?php if ($cover) : ?>
    <div class="mx-auto max-w-4xl px-4 pt-12 sm:px-6">
      <img src="<?php echo esc_url(mm_img($cover)); ?>" alt="" class="feather w-full object-cover">
    </div>
  <?php elseif (has_post_thumbnail()) : ?>
    <div class="mx-auto max-w-4xl px-4 pt-12 sm:px-6">
      <?php the_post_thumbnail('large', ['class' => 'feather w-full object-cover', 'alt' => '']); ?>
    </div>
  <?php endif; ?>

  <div class="post-body mx-auto max-w-3xl px-4 py-14 sm:px-6">
    <?php the_content(); ?>
  </div>
</article>
<?php get_footer();
