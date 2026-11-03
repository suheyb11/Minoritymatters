<?php
if (!defined('ABSPATH')) exit;
// /admin/messages/: an inbox. On the left every person who wrote (newest first); on the right the whole
// conversation with one person (?with=<email>): their messages, your replies, and a box to answer them.
// Replies are sent and saved by the plugin (includes/conversations.php).

// First copy any new email answers from the Google mailbox (at most once a minute; see includes/inbox-sync.php)
mm_sync_replies();

$threads = mm_conversations();
$with = isset($_GET['with']) && is_string($_GET['with']) ? mm_email_key(wp_unslash($_GET['with'])) : '';
$thread = isset($threads[$with]) ? $threads[$with] : null;
$items = $thread ? mm_conversation($with) : [];

// Opening a conversation marks its messages as read
if ($thread && $thread['unread']) {
  foreach ($items as $i) if ($i['type'] === 'in') update_post_meta($i['post']->ID, 'mm_isRead', '1');
  $threads[$with]['unread'] = 0;
}

// "26 Oct, 21:54" this year, "26 Oct 2025" before
$when = function ($gmt) {
  $date = mm_utc($gmt);
  if (!$date) return '';
  return mm_london($date, 'Y') === gmdate('Y') ? mm_london($date, 'j M, H:i') : mm_london($date, 'j M Y');
};

mm_panel_start('messages', 'Messages');
?>
<div class="mb-8 flex flex-wrap items-center justify-between gap-4">
  <h1 class="font-display text-3xl font-bold">Messages</h1>
  <?php if (mm_mail_ready()) : ?>
    <?php mm_panel_form('mm_panel_sync', 'inline'); ?>
      <input type="hidden" name="with" value="<?php echo esc_attr($with); ?>">
      <button type="submit" class="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-ink hover:bg-gray-100">Check for email replies</button>
    </form>
  <?php endif; ?>
</div>
<?php
mm_panel_notice([
  'empty' => 'Please write your reply first.',
  'long' => 'Your reply is too long. Please keep it under 10,000 characters.',
  'files' => 'Please attach at most ' . MM_ATTACH_MAX . ' files.',
  'file-size' => 'The files are too big: at most 10 MB each, and 20 MB together.',
  'file-type' => 'That kind of file cannot be sent. Please use PDF, Word, Excel, PowerPoint, text, photo or ZIP files.',
  'file-failed' => 'A file could not be uploaded. Please try again.',
  'mail' => 'Your reply is saved here, but the email could not be sent. Please try again later, or reply from your own email.',
  'imap' => 'Could not check the mailbox for email replies: ' . (get_transient('mm_imap_error') ?: 'unknown error') . '. Check Email sending in Site settings, and that IMAP is on in Gmail.',
]);
if (isset($_GET['checked'])) {
  $n = (int) $_GET['checked'];
  echo '<p class="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800" role="status">' . ($n ? esc_html($n . ($n === 1 ? ' new email reply' : ' new email replies') . ' added.') : 'Checked the mailbox: no new email replies.') . '</p>';
}
if (!empty($_GET['sent']) && $thread) {
  echo '<p class="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800" role="status">Reply sent to ' . esc_html($thread['email']) . '.</p>';
}
?>

<?php if (!$threads) : ?>
  <p class="text-muted" data-live="no-messages">No messages yet. Messages sent from the contact page will appear here.</p>
<?php else : ?>
<div class="overflow-hidden rounded-2xl border border-gray-200 bg-white lg:grid lg:min-h-[70vh] lg:grid-cols-[22rem_1fr]">

  <!-- ---------- Conversations (on phones only when none is open) ---------- -->
  <nav aria-label="Conversations" data-live="threads" class="<?php echo $thread ? 'hidden lg:block' : ''; ?> border-gray-200 lg:max-h-[80vh] lg:overflow-y-auto lg:border-r">
    <ul class="divide-y divide-gray-200">
      <?php foreach ($threads as $t) : $on = $t['email'] === $with; ?>
        <li>
          <a href="<?php echo esc_url(mm_panel_url('messages', ['with' => $t['email']])); ?>"<?php echo $on ? ' aria-current="true"' : ''; ?> class="block px-4 py-4 transition-colors <?php echo $on ? 'bg-pink-soft' : 'hover:bg-mist'; ?>">
            <span class="flex items-baseline justify-between gap-3">
              <span class="truncate <?php echo $t['unread'] ? 'font-bold text-ink' : 'font-semibold text-ink'; ?>"><?php mm_e($t['name']); ?></span>
              <span class="shrink-0 text-xs text-muted"><?php mm_e($when($t['last'])); ?></span>
            </span>
            <span class="mt-0.5 flex items-center gap-2">
              <span class="min-w-0 flex-1 truncate text-sm <?php echo $t['unread'] ? 'text-ink' : 'text-muted'; ?>"><?php mm_e($t['preview']); ?></span>
              <?php if ($t['unread']) : ?><span class="shrink-0 rounded-full bg-pink px-2 py-0.5 text-xs font-bold text-white"><?php echo (int) $t['unread']; ?></span><?php endif; ?>
            </span>
            <span class="mt-1.5 flex flex-wrap items-center gap-1.5">
              <?php mm_reason_badge($t['reason']); ?>
              <?php if ($t['count'] > 1) : ?><span class="text-xs text-muted"><?php echo (int) $t['count']; ?> messages</span><?php endif; ?>
              <?php if ($t['replied']) : ?><span class="text-xs font-semibold text-green-700">Replied</span><?php endif; ?>
            </span>
          </a>
        </li>
      <?php endforeach; ?>
    </ul>
  </nav>

  <!-- ---------- One conversation ---------- -->
  <section class="<?php echo $thread ? 'flex' : 'hidden lg:flex'; ?> min-w-0 flex-col">
    <?php if (!$thread) : ?>
      <div class="m-auto p-10 text-center text-muted">
        <p class="font-display text-2xl font-bold text-ink">Choose a conversation</p>
        <p class="mt-2">Select a person on the left to read their messages and reply.</p>
      </div>
    <?php else :
      $phone = '';
      foreach ($items as $i) if ($i['type'] === 'in' && get_post_meta($i['post']->ID, 'mm_phone', true)) $phone = get_post_meta($i['post']->ID, 'mm_phone', true);
    ?>
      <header class="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 p-5">
        <div class="min-w-0">
          <a href="<?php echo esc_url(mm_panel_url('messages')); ?>" class="mb-2 inline-block text-sm font-semibold text-pink lg:hidden">← All conversations</a>
          <h2 class="font-display text-2xl font-bold"><?php mm_e($thread['name']); ?></h2>
          <p class="mt-1 text-sm text-muted">
            <a href="mailto:<?php echo esc_attr($thread['email']); ?>" class="text-pink hover:underline"><?php mm_e($thread['email']); ?></a>
            <?php if ($phone) : ?> · <a href="tel:<?php echo esc_attr(preg_replace('/\s/', '', $phone)); ?>" class="hover:underline"><?php mm_e($phone); ?></a><?php endif; ?>
          </p>
        </div>
        <?php mm_panel_form('mm_panel_conversation_delete', 'inline'); ?>
          <input type="hidden" name="with" value="<?php echo esc_attr($thread['email']); ?>">
          <button type="submit" data-confirm="Delete the whole conversation with <?php echo esc_attr($thread['name']); ?> (all messages and replies)? This cannot be undone." class="rounded-full px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50">Delete conversation</button>
        </form>
      </header>

      <ol class="flex-1 space-y-5 overflow-y-auto bg-mist/60 p-5 lg:max-h-[55vh]" data-scroll-end data-live="conversation">
        <?php foreach ($items as $i) :
          $p = $i['post'];
          $out = $i['type'] === 'out';
        ?>
          <li class="flex <?php echo $out ? 'justify-end' : 'justify-start'; ?>">
            <div class="max-w-[85%] rounded-2xl px-5 py-4 shadow-sm <?php echo $out ? 'rounded-br-md bg-pink-soft' : 'rounded-bl-md bg-white'; ?>">
              <p class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                <?php if ($out) : ?>
                  <span class="font-semibold text-pink">You<?php $author = get_userdata($p->post_author); echo $author ? ' (' . esc_html($author->display_name) . ')' : ''; ?></span>
                  <span>· <?php mm_e($p->post_title); ?></span>
                <?php else : ?>
                  <span class="font-semibold text-ink"><?php mm_e($p->post_title); ?></span>
                  <?php mm_reason_badge(get_post_meta($p->ID, 'mm_reason', true)); ?>
                <?php endif; ?>
                <span>· <?php mm_e($when($p->post_date_gmt)); ?></span>
              </p>
              <p class="mt-2 whitespace-pre-line leading-relaxed text-ink"><?php mm_e($p->post_content); ?></p>
              <?php $files = $out ? get_post_meta($p->ID, 'mm_files', true) : []; if ($files && is_array($files)) : ?>
                <ul class="mt-3 flex flex-wrap gap-2">
                  <?php foreach ($files as $n => $f) : ?>
                    <li><a href="<?php echo esc_url(mm_attachment_url($p->ID, $n)); ?>" class="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink ring-1 ring-gray-200 hover:ring-pink">📎 <?php mm_e($f['name']); ?> <span class="font-normal text-muted"><?php echo esc_html(size_format($f['size'])); ?></span></a></li>
                  <?php endforeach; ?>
                </ul>
              <?php endif; ?>
              <?php if ($out && get_post_meta($p->ID, 'mm_sent', true) !== '1') : ?>
                <p class="mt-2 text-xs font-semibold text-red-700">Not sent: the email could not be delivered.</p>
              <?php endif; ?>
            </div>
          </li>
        <?php endforeach; ?>
      </ol>

      <!-- ---------- Reply ---------- -->
      <?php mm_panel_form('mm_panel_reply', 'space-y-3 border-t border-gray-200 bg-white p-5', true); ?>
        <span id="reply" class="block scroll-mt-6"></span>
        <input type="hidden" name="with" value="<?php echo esc_attr($thread['email']); ?>">
        <label class="block">
          <span class="mb-1 block text-xs font-semibold text-muted">Subject</span>
          <input name="subject" value="Re: your message to Minority Matters" maxlength="200" class="field">
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-semibold text-muted">Reply to <?php mm_e($thread['name']); ?></span>
          <textarea name="body" rows="5" required maxlength="10000" placeholder="Write your reply…" class="field leading-relaxed" data-reply-box></textarea>
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-semibold text-muted">Attach files (optional)</span>
          <input type="file" name="files[]" multiple accept=".<?php echo esc_attr(implode(',.', MM_ATTACH_TYPES)); ?>" class="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-pink-soft file:px-4 file:py-2 file:font-semibold file:text-pink" data-reply-files>
          <span class="mt-1 block text-xs text-muted">Up to <?php echo (int) MM_ATTACH_MAX; ?> files, 10 MB each (20 MB together): PDF, Word, Excel, PowerPoint, text, photos or ZIP.</span>
        </label>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-xs text-muted">
            Sent by email to <?php mm_e($thread['email']); ?>.
            <?php if (mm_mail_ready()) : ?>When they answer by email, their answer is added here too (and is in your mailbox).<?php else : ?>When they answer, it arrives in your normal mailbox<?php $rt = trim(mm_setting('contactNotifyEmail')) ?: trim(mm_setting('email')); echo $rt ? ' (' . esc_html($rt) . ')' : ''; ?>.<?php endif; ?>
          </p>
          <button type="submit" class="rounded-full bg-pink px-6 py-2.5 font-semibold text-white transition-colors hover:bg-pink-dark" data-send>Send reply</button>
        </div>
      </form>
    <?php endif; ?>
  </section>
</div>
<?php endif; ?>
<?php mm_panel_end();
