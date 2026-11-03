<?php
if (!defined('ABSPATH')) exit;
// /admin/users/: the people who can log in to this admin panel. Only an Administrator can add or remove them.

if (!current_user_can('create_users')) mm_redirect(mm_panel_url());

$managers = get_users(['role' => 'mm_manager', 'orderby' => 'display_name']);
$admins = get_users(['role' => 'administrator', 'orderby' => 'display_name']);

mm_panel_start('users', 'Users');
mm_panel_title('Users');
?>
<p class="-mt-4 mb-8 max-w-2xl text-sm text-muted">
  Website managers log in at <strong><?php mm_e(mm_panel_url('login')); ?></strong> with their email and password.
  They can change all the content, read messages and see bookings, but they never see the WordPress admin.
</p>
<?php mm_panel_notice([
  'missing' => 'Please fill in a name and a valid email address.',
  'short' => 'The password must be at least 12 characters long.',
  'exists' => 'There is already an account with this email address.',
]); ?>

<?php mm_panel_form('mm_panel_user_add', 'mb-10 space-y-4 rounded-2xl border border-gray-200 bg-white p-6'); ?>
  <h2 class="font-display text-xl font-bold">Add a Website manager</h2>
  <div class="grid gap-4 sm:grid-cols-2">
    <label class="block"><?php mm_panel_label('Name', true); ?><input name="name" required class="field"></label>
    <label class="block"><?php mm_panel_label('Email', true); ?><input name="email" type="email" required class="field"></label>
  </div>
  <label class="block">
    <?php mm_panel_label('Password', true); ?>
    <input name="password" type="text" required minlength="12" autocomplete="new-password" class="field" data-password>
    <span class="mt-1 block text-xs text-muted">At least 12 characters. Give it to the person yourself (not by email); they can change it under My account.</span>
  </label>
  <div class="flex flex-wrap gap-3">
    <button type="submit" class="rounded-full bg-pink px-6 py-2.5 font-semibold text-white transition-colors hover:bg-pink-dark">Add person</button>
    <button type="button" class="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-ink hover:bg-gray-100" data-make-password>Make a strong password</button>
  </div>
</form>

<h2 class="mb-3 font-display text-xl font-bold">Website managers</h2>
<?php if (!$managers) : ?><p class="mb-10 text-muted">No Website managers yet.</p><?php endif; ?>
<?php if ($managers) : ?>
  <ul class="mb-10 divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
    <?php foreach ($managers as $u) : ?>
      <li class="flex flex-wrap items-center justify-between gap-4 p-4">
        <div>
          <p class="font-semibold"><?php mm_e($u->display_name); ?></p>
          <p class="text-sm text-muted"><?php mm_e($u->user_email); ?> · added <?php mm_e(mysql2date('j F Y', $u->user_registered)); ?></p>
        </div>
        <?php mm_panel_delete('mm_panel_user_remove', ['id' => $u->ID], 'Remove ' . $u->display_name . '? They can no longer log in.', 'Remove'); ?>
      </li>
    <?php endforeach; ?>
  </ul>
<?php endif; ?>

<h2 class="mb-3 font-display text-xl font-bold">Administrators</h2>
<p class="mb-3 text-sm text-muted">Administrators can also use the WordPress admin. Add or remove them there (Users).</p>
<ul class="divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
  <?php foreach ($admins as $u) : ?>
    <li class="p-4"><p class="font-semibold"><?php mm_e($u->display_name); ?></p><p class="text-sm text-muted"><?php mm_e($u->user_email); ?></p></li>
  <?php endforeach; ?>
</ul>
<?php mm_panel_end();
