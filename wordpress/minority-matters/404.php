<?php
if (!defined('ABSPATH')) exit;
// Page not found

get_header();
?>
<section class="mx-auto flex max-w-3xl flex-col items-center px-4 py-28 text-center">
  <?php mm_ring(120, 0.04); ?>
  <h1 class="mt-8 font-display text-5xl font-bold lowercase text-pink">page not found</h1>
  <p class="mt-4 text-lg text-muted">This page has moved or no longer exists.</p>
  <a href="<?php echo esc_url(mm_url('/')); ?>" class="mt-8 rounded-full bg-pink px-6 py-3.5 font-semibold text-white hover:bg-pink-dark">Go to the home page</a>
</section>
<?php get_footer();
