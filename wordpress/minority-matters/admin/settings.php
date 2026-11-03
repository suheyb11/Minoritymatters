<?php
if (!defined('ABSPATH')) exit;
// /admin/settings/: the site-wide text and contact details (the same fields as Site settings in the WordPress admin)

$settings = mm_settings();

mm_panel_start('settings', 'Site settings');
mm_panel_title('Site settings');
mm_panel_notice();
mm_panel_form('mm_panel_settings', 'space-y-8', true);
foreach (mm_settings_fields() as $group => $fields) : ?>
  <section class="space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
    <h2 class="font-display text-xl font-bold"><?php mm_e($group); ?></h2>
    <?php foreach ($fields as $key => $field) mm_panel_field('settings[' . $key . ']', $key, $field, $settings[$key]); ?>
  </section>
<?php endforeach; ?>
  <button type="submit" class="rounded-full bg-pink px-6 py-2.5 font-semibold text-white transition-colors hover:bg-pink-dark">Save settings</button>
</form>

<?php if (current_user_can('manage_options')) :
  // ---------- Email sending (Administrators only): see mm-core/includes/mail.php ----------
  $mail = mm_mail_settings();
  $state = isset($_GET['mail']) && is_string($_GET['mail']) ? $_GET['mail'] : '';
  $test_to = isset($_GET['to']) && is_string($_GET['to']) ? sanitize_email(wp_unslash($_GET['to'])) : wp_get_current_user()->user_email;
  $error = get_transient('mm_mail_error');
?>
  <section id="mail" class="mt-12 scroll-mt-6 space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
    <h2 class="font-display text-xl font-bold">Email sending</h2>
    <p class="max-w-3xl text-sm text-muted">
      The website sends emails (replies from Messages, contact form copies, booking notices) through your Google account,
      from your own address. Then they reach people's inbox instead of Spam, and a copy is kept in that mailbox's "Sent" folder.
      When people answer your replies by email, their answers are also added to their conversation in Messages
      (the website reads that mailbox, read-only, and only copies emails from people who wrote through the website).
    </p>
    <p class="text-sm font-semibold <?php echo mm_mail_ready() ? 'text-green-700' : 'text-red-700'; ?>">
      <?php echo mm_mail_ready() ? 'On: emails are sent through ' . esc_html($mail['host']) . ' as ' . esc_html($mail['from'] ?: $mail['user']) . '.' : 'Off: emails are sent by the web server from wordpress@… and often land in Spam.'; ?>
    </p>
    <?php if ($state === 'saved') : ?><p class="rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800" role="status">Saved. Send a test email below to check it works.</p><?php endif; ?>
    <?php if ($state === 'sent') : ?><p class="rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800" role="status">Test email sent to <?php mm_e($test_to); ?>. Check that it arrived in the inbox (not Spam).</p><?php endif; ?>
    <?php if ($state === 'bad-to') : ?><p class="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">Please enter a valid email address for the test.</p><?php endif; ?>
    <?php if ($state === 'failed') : ?>
      <p class="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
        The test email could not be sent<?php echo $error ? ': ' . esc_html($error) : '.'; ?>
        <?php if ($error && stripos($error, 'authenticat') !== false) : ?><br>Check the Google account email and the App password (16 letters).<?php endif; ?>
      </p>
    <?php endif; ?>

    <?php mm_panel_form('mm_panel_mail', 'space-y-4'); ?>
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block">
          <?php mm_panel_label('Google account (email)'); ?>
          <input name="user" type="email" value="<?php echo esc_attr($mail['user']); ?>" placeholder="info@minoritymatters.org.uk" autocomplete="off" class="field">
          <span class="mt-1 block text-xs text-muted">The Google Workspace mailbox that sends the emails.</span>
        </label>
        <label class="block">
          <?php mm_panel_label('App password'); ?>
          <input name="pass" type="password" value="" placeholder="<?php echo $mail['pass'] !== '' ? '•••••••••••••••• (saved)' : '16 letters from Google'; ?>" autocomplete="new-password" class="field">
          <span class="mt-1 block text-xs text-muted">Not the normal password: a Google "App password". Leave empty to keep the saved one.</span>
        </label>
        <label class="block">
          <?php mm_panel_label('Send as'); ?>
          <input name="from" type="email" value="<?php echo esc_attr($mail['from']); ?>" placeholder="Same as the Google account" class="field">
          <span class="mt-1 block text-xs text-muted">Optional. Must be the account itself or one of its aliases in Google.</span>
        </label>
        <div class="grid grid-cols-[1fr_7rem] gap-3">
          <label class="block"><?php mm_panel_label('Mail server'); ?><input name="host" value="<?php echo esc_attr($mail['host']); ?>" class="field"></label>
          <label class="block"><?php mm_panel_label('Port'); ?><input name="port" type="number" value="<?php echo (int) $mail['port']; ?>" class="field"></label>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-4">
        <button type="submit" class="rounded-full bg-pink px-6 py-2.5 font-semibold text-white transition-colors hover:bg-pink-dark">Save email sending</button>
        <?php if ($mail['pass'] !== '') : ?>
          <label class="flex items-center gap-2 text-sm text-muted"><input type="checkbox" name="forget" value="1" class="h-4 w-4 accent-[#e71d73]"> Remove the saved password (turns it off)</label>
        <?php endif; ?>
      </div>
    </form>

    <?php mm_panel_form('mm_panel_mail_test', 'flex flex-wrap items-end gap-3 border-t border-gray-200 pt-4'); ?>
      <label class="block min-w-64 flex-1">
        <?php mm_panel_label('Send a test email to'); ?>
        <input name="to" type="email" value="<?php echo esc_attr($test_to); ?>" required class="field">
      </label>
      <button type="submit" class="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-ink hover:bg-gray-100">Send test email</button>
    </form>
  </section>
<?php endif; ?>
<?php mm_panel_end();
