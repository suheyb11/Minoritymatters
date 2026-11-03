<?php
if (!defined('ABSPATH')) exit;
// /donate: the ways to donate (PayPal, Givey). The Donate buttons open the same choice in a window;
// this page is for links shared elsewhere and for browsers without JavaScript.

get_header();
mm_page_header('donate', 'Your donation funds tutoring, parent programmes and support for families affected by exploitation.', 0.6);
?>

<section class="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
  <div<?php echo mm_reveal(); ?>>
    <h2 class="mb-6 font-display text-3xl font-bold text-ink">Choose how you would like to give</h2>
    <?php mm_donate_choices(); ?>
    <p class="mt-8 text-muted">
      Registered charity number <?php mm_e(mm_setting('charityNumber')); ?>.
      Questions about giving? <a href="<?php echo esc_url(mm_url('/contact')); ?>" class="font-semibold text-pink underline-offset-4 hover:underline">Contact us</a>.
    </p>
  </div>
</section>

<?php get_footer();
