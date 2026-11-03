<?php
if (!defined('ABSPATH')) exit;
// /admin/account/: change your own password

$user = wp_get_current_user();

mm_panel_start('account', 'My account');
mm_panel_title('My account');
mm_panel_notice([
  'wrong' => 'Your current password is not right.',
  'short' => 'The new password must be at least 12 characters long.',
]);
?>
<p class="mb-8 text-muted"><?php mm_e($user->display_name); ?> · <?php mm_e($user->user_email); ?></p>

<?php mm_panel_form('mm_panel_password', 'max-w-md space-y-4 rounded-2xl border border-gray-200 bg-white p-6'); ?>
  <h2 class="font-display text-xl font-bold">Change password</h2>
  <label class="block"><?php mm_panel_label('Current password', true); ?><input name="current" type="password" required autocomplete="current-password" class="field"></label>
  <label class="block">
    <?php mm_panel_label('New password', true); ?>
    <input name="new" type="password" required minlength="12" autocomplete="new-password" class="field">
    <span class="mt-1 block text-xs text-muted">At least 12 characters.</span>
  </label>
  <button type="submit" class="rounded-full bg-pink px-6 py-2.5 font-semibold text-white transition-colors hover:bg-pink-dark">Save new password</button>
</form>
<?php mm_panel_end();
