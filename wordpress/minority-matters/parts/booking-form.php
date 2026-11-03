<?php
if (!defined('ABSPATH')) exit;
// The booking form on an event page. It posts to admin-post.php (mm_handle_booking in the plugin);
// with JavaScript it is sent in the background and the answer replaces the form (assets/js/app.js).
// $args: event, left (places left or null), booked ("confirmed"/"waitlist" after a booking without JavaScript), error

$event = $args['event'];
$full = $args['left'] === 0;
$booked = $args['booked'];
?>
<div aria-live="polite" data-booking>
  <?php if ($booked === 'confirmed' || $booked === 'waitlist') : ?>
    <div class="card-in mt-5 rounded-2xl bg-white p-6">
      <p class="font-display text-2xl font-bold text-pink"><?php echo $booked === 'waitlist' ? "You're on the waiting list" : "You're booked!"; ?></p>
      <p class="mt-2 text-ink"><?php echo $booked === 'waitlist' ? "We'll contact you if a place opens up." : "We've saved your place for " . esc_html($event['title']) . ' on ' . esc_html(mm_event_day($event['startsAt'])) . '.'; ?></p>
    </div>
  <?php else : ?>
    <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" class="mt-5 space-y-4" data-booking-form>
      <input type="hidden" name="action" value="mm_book">
      <input type="hidden" name="eventId" value="<?php echo (int) $event['id']; ?>">
      <?php if ($full) : ?>
        <p class="rounded-lg bg-white px-4 py-3 text-sm text-ink">This event is fully booked. Fill in the form to join the waiting list.</p>
      <?php endif; ?>
      <label class="block">
        <span class="mb-1.5 block text-sm font-semibold">Your name *</span>
        <input name="name" required maxlength="200" autocomplete="name" class="field">
      </label>
      <label class="block">
        <span class="mb-1.5 block text-sm font-semibold">Email *</span>
        <input name="email" type="email" required maxlength="200" autocomplete="email" class="field">
      </label>
      <label class="block">
        <span class="mb-1.5 block text-sm font-semibold">Phone</span>
        <input name="phone" type="tel" maxlength="50" autocomplete="tel" class="field">
      </label>
      <div class="grid grid-cols-2 gap-4">
        <label class="block">
          <span class="mb-1.5 block text-sm font-semibold">Adults</span>
          <input name="adults" type="number" min="0" max="10" value="1" required class="field">
        </label>
        <label class="block">
          <span class="mb-1.5 block text-sm font-semibold">Children</span>
          <input name="children" type="number" min="0" max="10" value="0" required class="field" data-children>
        </label>
      </div>
      <?php // Shown when "Children" is more than 0 (always shown without JavaScript) ?>
      <label class="block" data-child-ages>
        <span class="mb-1.5 block text-sm font-semibold">Children's ages</span>
        <input name="childAges" maxlength="200" placeholder="For example 8, 11" class="field">
      </label>
      <label class="block">
        <span class="mb-1.5 block text-sm font-semibold">Anything we should know?</span>
        <textarea name="notes" rows="3" maxlength="1000" placeholder="Access needs or questions" class="field"></textarea>
      </label>
      <label class="flex items-start gap-3 text-sm text-ink">
        <input type="checkbox" name="consent" required class="mt-0.5 h-5 w-5 shrink-0 accent-[#e71d73]">
        <span>
          I am the parent or guardian of any children I'm booking for, and I agree to Minority Matters using these
          details to manage this booking. Questions about your details?
          <a href="<?php echo esc_url(mm_url('/contact')); ?>" class="font-semibold text-pink underline">Contact us</a>.
        </span>
      </label>
      <?php // Hidden spam trap ?>
      <input name="website" tabindex="-1" autocomplete="off" class="hidden" aria-hidden="true">

      <p class="rounded-lg bg-white px-4 py-3 text-sm font-medium text-pink-dark" role="alert" data-form-error<?php echo $args['error'] ? '' : ' hidden'; ?>><?php mm_e($args['error']); ?></p>
      <button type="submit" class="w-full rounded-full bg-pink px-7 py-3.5 font-semibold text-white transition-colors hover:bg-pink-dark disabled:opacity-60" data-label="<?php echo $full ? 'Join the waiting list' : 'Book my place'; ?>"><?php echo $full ? 'Join the waiting list' : 'Book my place'; ?></button>
      <p class="text-xs text-muted">* required</p>
    </form>
  <?php endif; ?>
</div>
