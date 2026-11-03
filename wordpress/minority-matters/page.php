<?php
if (!defined('ABSPATH')) exit;
// Any other page made in Pages (for example a privacy policy): the title band and the text from the editor

the_post();
get_header();
mm_page_header(strtolower(get_the_title()), '', 0.3);
?>
<div class="post-body mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
  <?php the_content(); ?>
</div>
<?php get_footer();
