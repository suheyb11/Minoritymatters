<?php
if (!defined('ABSPATH')) exit;
// Bottom of every page: the plum footer with contact details, social links and the site map

$icons = [
  'tiktok' => 'M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.7 5.7 0 1 0 4.9 5.7V9.1a7.3 7.3 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.2-1.6Z',
  'x' => 'M17.8 3h3l-6.6 7.6L22 21h-6.1l-4.8-6.3L5.6 21h-3l7.1-8.1L2.2 3h6.2l4.3 5.7L17.8 3Zm-1 16.2h1.7L7.3 4.7H5.5l11.3 14.5Z',
  'facebook' => 'M14 8.5V6.8c0-.8.2-1.3 1.4-1.3H17V2.6c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v1.9H8v3.2h2.6V21H14v-9.3h2.6l.4-3.2h-3Z',
  'youtube' => 'M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3L10 15Z',
  'linkedin' => 'M5 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.5h4V21H3V9.5Zm6.5 0h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.2c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V21h-4V9.5Z',
];
$socials = array_filter([
  ['tiktok', 'TikTok', mm_setting('tiktokUrl')],
  ['x', 'X', mm_setting('xUrl')],
  ['facebook', 'Facebook', mm_setting('facebookUrl')],
  ['youtube', 'YouTube', mm_setting('youtubeUrl')],
  ['instagram', 'Instagram', mm_setting('instagramUrl')],
  ['linkedin', 'LinkedIn', mm_setting('linkedinUrl')],
], function ($s) { return $s[2] !== ''; });
$explore = [
  ['/our-work', 'Our work'],
  ['/impact', 'Our impact'],
  ['/events', 'Events'],
  ['/press', 'Press'],
  ['/blog', 'Blog'],
  ['/about', 'About'],
  ['/our-founder', 'Our founder'],
  ['/values', 'Values'],
  ['/our-funders', 'Our funders'],
  ['/contact', 'Contact'],
];
$phone = mm_setting('phone');
$email = mm_setting('email');
?>
</main>

<footer class="bg-plum text-white/80">
  <div class="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
    <div>
      <p class="font-display text-3xl font-semibold leading-none text-white">
        <span class="text-grey">minority</span><br><span class="text-pink">matters</span>
      </p>
      <p class="mt-5 max-w-sm text-white/70">
        <?php mm_e(mm_setting('communityLine') ?: "Working with minority communities in London since 2010 to support children's education, empower parents and keep young people safe."); ?>
      </p>
      <ul class="mt-6 flex gap-3">
        <?php foreach ($socials as $s) : ?>
          <li>
            <a href="<?php echo esc_url($s[2]); ?>" target="_blank" rel="noopener noreferrer" aria-label="<?php echo esc_attr($s[1]); ?>" class="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-pink">
              <?php if ($s[0] === 'instagram') : ?>
                <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
              <?php else : ?>
                <svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="<?php echo esc_attr($icons[$s[0]]); ?>"/></svg>
              <?php endif; ?>
            </a>
          </li>
        <?php endforeach; ?>
      </ul>
    </div>

    <div>
      <h2 class="font-sans text-sm font-semibold text-white">Visit or call us</h2>
      <address class="mt-4 space-y-2 not-italic">
        <p><?php mm_e(mm_setting('address')); ?></p>
        <p><a href="tel:<?php echo esc_attr(preg_replace('/\s/', '', $phone)); ?>" class="hover:text-pink"><?php mm_e($phone); ?></a></p>
        <p><a href="mailto:<?php echo esc_attr($email); ?>" class="hover:text-pink"><?php mm_e($email); ?></a></p>
      </address>
    </div>

    <div>
      <h2 class="font-sans text-sm font-semibold text-white">Explore</h2>
      <ul class="mt-4 grid grid-cols-2 gap-2">
        <?php foreach ($explore as $link) : ?>
          <li><a href="<?php echo esc_url(mm_url($link[0])); ?>" class="hover:text-pink"><?php mm_e($link[1]); ?></a></li>
        <?php endforeach; ?>
      </ul>
    </div>
  </div>

  <div class="border-t border-white/10">
    <div class="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-white/60 sm:flex-row sm:justify-between sm:px-6">
      <p>© Minority Matters <?php echo esc_html(gmdate('Y')); ?></p>
      <p>Registered charity number <?php mm_e(mm_setting('charityNumber')); ?></p>
    </div>
  </div>
</footer>

<?php if (count(mm_donate_options()) > 1) : ?>
  <?php // "Choose how to donate": opened by every Donate button (assets/js/app.js) ?>
  <dialog id="donate-dialog" aria-labelledby="donate-title" class="m-auto w-[min(92vw,32rem)] rounded-3xl bg-white p-0 text-ink shadow-2xl backdrop:bg-plum/70 backdrop:backdrop-blur-sm">
    <div class="p-6 sm:p-8">
      <div class="flex items-start justify-between gap-4">
        <h2 id="donate-title" class="font-display text-3xl font-bold text-pink">Donate to our work</h2>
        <button type="button" data-donate-close aria-label="Close" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mist text-2xl leading-none text-ink transition-colors hover:bg-pink hover:text-white">×</button>
      </div>
      <p class="mt-2 mb-6 text-muted">Choose how you would like to give. Thank you for supporting our community.</p>
      <?php mm_donate_choices(); ?>
    </div>
  </dialog>
<?php endif; ?>

<?php wp_footer(); ?>
</body>
</html>
