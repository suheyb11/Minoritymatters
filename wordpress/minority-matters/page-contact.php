<?php
if (!defined('ABSPATH')) exit;
// /contact: contact details and the contact form (saved by mm_handle_contact in the plugin, read under Messages).
// /contact/?reason=referral opens the form with "Make a referral" chosen.

$address = mm_setting('address');
$phone = mm_setting('phone');
$email = mm_setting('email');
$press_email = mm_setting('pressEmail');
$referral = mm_setting('referralText');

$sent = !empty($_GET['sent']);
$errors = mm_contact_errors();
$code = isset($_GET['problem']) && is_string($_GET['problem']) ? $_GET['problem'] : '';
$error = isset($errors[$code]) ? $errors[$code] : '';
$reason = isset($_GET['reason']) && $_GET['reason'] === 'referral' ? MM_REFERRAL : MM_REASONS[0];

get_header();
mm_page_header('contact', 'Questions about our programmes, support for your family, or working together — send us a message.', 0.45);
?>

<section class="mx-auto grid max-w-7xl gap-14 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1fr_1.4fr]">
  <div class="space-y-8">
    <div>
      <h2 class="font-display text-2xl font-semibold text-pink">Visit us</h2>
      <p class="mt-2 text-lg"><?php mm_e($address); ?></p>
      <a href="<?php echo esc_url('https://www.google.com/maps/search/?api=1&query=' . rawurlencode($address)); ?>" target="_blank" rel="noopener noreferrer" class="mt-2 inline-block font-semibold underline-offset-4 hover:text-pink hover:underline">Open in Google Maps</a>
    </div>
    <div>
      <h2 class="font-display text-2xl font-semibold text-pink">Call us</h2>
      <a href="tel:<?php echo esc_attr(preg_replace('/\s/', '', $phone)); ?>" class="mt-2 block text-lg hover:text-pink"><?php mm_e($phone); ?></a>
    </div>
    <div>
      <h2 class="font-display text-2xl font-semibold text-pink">Email us</h2>
      <a href="mailto:<?php echo esc_attr($email); ?>" class="mt-2 block text-lg hover:text-pink"><?php mm_e($email); ?></a>
      <p class="mt-1 text-muted">Press: <a href="mailto:<?php echo esc_attr($press_email); ?>" class="hover:text-pink"><?php mm_e($press_email); ?></a></p>
    </div>
    <p class="text-sm text-muted">Registered charity number <?php mm_e(mm_setting('charityNumber')); ?></p>
  </div>

  <div id="contact-form" class="scroll-mt-28 rounded-[2rem] bg-mist p-6 sm:p-10">
    <?php if ($referral) : ?>
      <p class="mb-8 border-l-4 border-pink pl-5 text-lg leading-relaxed text-ink"><?php mm_e($referral); ?></p>
    <?php endif; ?>

    <div aria-live="polite" data-contact>
      <?php if ($sent) : ?>
        <div class="card-in rounded-3xl bg-pink-soft p-10 text-center" role="status">
          <p class="font-display text-3xl font-bold text-pink">Message sent</p>
          <p class="mt-3 text-muted">Thank you for getting in touch. We'll reply as soon as we can.</p>
        </div>
      <?php else : ?>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" class="space-y-5" data-contact-form>
          <input type="hidden" name="action" value="mm_contact">
          <div class="grid gap-5 sm:grid-cols-2">
            <label class="block">
              <span class="mb-1.5 block text-sm font-semibold">Name *</span>
              <input name="name" required autocomplete="name" class="field">
            </label>
            <label class="block">
              <span class="mb-1.5 block text-sm font-semibold">Email *</span>
              <input name="email" type="email" required autocomplete="email" class="field">
            </label>
          </div>
          <div class="grid gap-5 sm:grid-cols-2">
            <label class="block">
              <span class="mb-1.5 block text-sm font-semibold">Phone</span>
              <input name="phone" type="tel" autocomplete="tel" class="field">
            </label>
            <label class="block">
              <span class="mb-1.5 block text-sm font-semibold">Reason</span>
              <select name="reason" class="field">
                <?php foreach (MM_REASONS as $r) : ?>
                  <option value="<?php echo esc_attr($r); ?>"<?php selected($reason, $r); ?>><?php mm_e($r); ?></option>
                <?php endforeach; ?>
              </select>
            </label>
          </div>
          <label class="block">
            <span class="mb-1.5 block text-sm font-semibold">Message *</span>
            <textarea name="message" required rows="6" class="field"></textarea>
          </label>
          <?php // Hidden spam trap ?>
          <input name="website" tabindex="-1" autocomplete="off" class="hidden" aria-hidden="true">

          <p class="rounded-lg bg-pink-soft px-4 py-3 text-sm font-medium text-pink-dark" role="alert"<?php echo $error ? '' : ' hidden'; ?>><?php mm_e($error); ?></p>
          <p class="text-sm text-muted">* required</p>
          <button type="submit" class="rounded-full bg-pink px-7 py-3.5 font-semibold text-white transition-colors hover:bg-pink-dark disabled:opacity-60">Send message</button>
        </form>
      <?php endif; ?>
    </div>
  </div>
</section>

<?php get_footer();
