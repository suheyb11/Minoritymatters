<?php
if (!defined('ABSPATH')) exit;
// Building blocks of the admin panel (/admin), so every page looks the same as the old website's admin
// (components/AdminUI.tsx and app/admin/(panel)/layout.tsx). Saving is done by the plugin (includes/manager.php).

const MM_PANEL_MENU = [
  'dashboard' => 'Dashboard',
  'messages' => 'Messages',
  'services' => 'Our work',
  'projects' => 'Projects',
  'events' => 'Events',
  'blog' => 'Blog',
  'press' => 'Press',
  'values' => 'Values',
  'funders' => 'Funders',
  'settings' => 'Site settings',
  'users' => 'Users',
  'account' => 'My account',
];

function mm_unread_count() {
  return count(get_posts([
    'post_type' => 'mm_message',
    'post_status' => 'any',
    'numberposts' => -1,
    'fields' => 'ids',
    'meta_query' => [['key' => 'mm_isRead', 'value' => '1', 'compare' => '!=']],
  ]));
}

// <html> … the sidebar … <main>
function mm_panel_start($section, $title) {
  $theme = get_template_directory_uri();
  $css = get_template_directory() . '/assets/css/app.css';
  $unread = mm_unread_count();
  $user = wp_get_current_user();
  ?><!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title><?php mm_e($title); ?> | MM Admin</title>
  <link rel="icon" href="<?php echo esc_url($theme . '/assets/images/logo.png'); ?>">
  <link rel="stylesheet" href="<?php echo esc_url($theme . '/assets/css/app.css?v=' . @filemtime($css)); ?>">
</head>
<body class="bg-white" data-poll="<?php echo esc_url(mm_poll_url()); ?>" data-stamp="<?php echo esc_attr(mm_inbox_stamp()); ?>">
<div class="min-h-screen bg-white lg:flex">
  <aside class="border-b border-gray-200 bg-white text-ink print:hidden lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r">
    <div class="flex items-center gap-3 px-6 py-5">
      <img src="<?php echo esc_url($theme . '/assets/images/logo.png'); ?>" alt="" class="h-10 w-10 rounded-full border border-gray-200 bg-white">
      <span class="font-display text-lg font-semibold text-plum">MM Admin</span>
    </div>
    <nav class="overflow-x-auto px-3 pb-3 lg:pb-0" aria-label="Admin">
      <ul class="flex gap-1 lg:flex-col">
        <?php foreach (MM_PANEL_MENU as $key => $label) :
          if ($key === 'users' && !current_user_can('create_users')) continue;
          $on = $key === $section; ?>
          <li>
            <a href="<?php echo esc_url(mm_panel_url($key)); ?>"<?php echo $on ? ' aria-current="page"' : ''; echo $key === 'messages' ? ' data-live="menu-messages"' : ''; ?> class="flex items-center justify-between gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm <?php echo $on ? 'bg-pink-soft font-semibold text-pink' : 'text-ink/80 hover:bg-gray-100 hover:text-ink'; ?>">
              <?php mm_e($label); ?>
              <?php if ($key === 'messages' && $unread > 0) : ?><span class="rounded-full bg-pink px-2 py-0.5 text-xs font-bold text-white"><?php echo (int) $unread; ?></span><?php endif; ?>
            </a>
          </li>
        <?php endforeach; ?>
      </ul>
    </nav>
    <div class="mx-3 mt-4 hidden space-y-1 border-t border-gray-200 px-3 pt-4 lg:block">
      <p class="px-3 pb-2 text-xs text-muted">Logged in as <?php mm_e($user->display_name); ?></p>
      <a href="<?php echo esc_url(home_url('/')); ?>" target="_blank" rel="noopener" class="block rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-gray-100 hover:text-ink">View website</a>
      <?php mm_panel_logout('w-full rounded-lg px-3 py-2.5 text-left text-sm text-muted hover:bg-gray-100 hover:text-ink'); ?>
    </div>
  </aside>
  <main class="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-10 lg:py-10 print:p-0">
<?php }

function mm_panel_end() { ?>
    <div class="mt-10 lg:hidden print:hidden"><?php mm_panel_logout('text-sm font-semibold text-muted underline'); ?></div>
  </main>
</div>
<script src="<?php echo esc_url(get_template_directory_uri() . '/assets/js/panel.js?v=' . @filemtime(get_template_directory() . '/assets/js/panel.js')); ?>"></script>
</body>
</html>
<?php }

function mm_panel_logout($class) { ?>
  <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
    <input type="hidden" name="action" value="mm_logout">
    <?php wp_nonce_field('mm_logout'); ?>
    <button class="<?php echo esc_attr($class); ?>">Log out</button>
  </form>
<?php }

// The start of a form that the plugin saves (admin-post.php?action=…), with its security code
function mm_panel_form($action, $class = '', $files = false) {
  echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '" class="' . esc_attr($class) . '"' . ($files ? ' enctype="multipart/form-data"' : '') . '>';
  echo '<input type="hidden" name="action" value="' . esc_attr($action) . '">';
  wp_nonce_field($action);
}

// Header row on each page
function mm_panel_title($title, $new_href = '', $new_label = 'Add new') { ?>
  <div class="mb-8 flex flex-wrap items-center justify-between gap-4">
    <h1 class="font-display text-3xl font-bold"><?php mm_e($title); ?></h1>
    <?php if ($new_href) : ?>
      <a href="<?php echo esc_url($new_href); ?>" class="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink"><?php mm_e($new_label); ?></a>
    <?php endif; ?>
  </div>
<?php }

// Green / red message after saving, from the page address (?saved=1, ?deleted=1, ?problem=…)
function mm_panel_notice($errors = []) {
  $errors += [
    'title' => 'Please fill in a title.',
    'date' => 'Please fill in a start date and time. The end must be after the start.',
    'url' => 'Please add the booking link (starting with https://) for "Link to another booking page".',
    'image' => 'Please upload a JPG, PNG, GIF or WEBP photo smaller than 8 MB.',
    'failed' => 'Sorry, that could not be saved. Please try again.',
  ];
  $code = isset($_GET['problem']) && is_string($_GET['problem']) ? $_GET['problem'] : '';
  if (isset($errors[$code])) {
    echo '<p class="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">' . esc_html($errors[$code]) . '</p>';
  } elseif (!empty($_GET['saved'])) {
    echo '<p class="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800" role="status">Saved. The website is updated.</p>';
  } elseif (!empty($_GET['deleted'])) {
    echo '<p class="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800" role="status">Deleted.</p>';
  }
}

function mm_panel_label($label, $required = false) {
  echo '<span class="mb-1.5 block text-sm font-semibold text-ink">' . esc_html($label) . ($required ? ' <span class="text-pink">*</span>' : '') . '</span>';
}

function mm_panel_hint($field) {
  if (!empty($field['help'])) echo '<span class="mt-1 block text-xs text-muted">' . esc_html($field['help']) . '</span>';
}

// One field of a content type or of the site settings ($name is the form name, for example fields[summary])
function mm_panel_field($name, $key, $field, $value) {
  $type = $field['type'];
  if ($type === 'checkbox') { ?>
    <div>
      <input type="hidden" name="<?php echo esc_attr($name); ?>" value="0">
      <label class="flex items-center gap-3 text-sm font-semibold">
        <input type="checkbox" name="<?php echo esc_attr($name); ?>" value="1"<?php checked($value, '1'); ?> class="h-5 w-5 accent-[#e71d73]">
        <?php mm_e($field['label']); ?>
      </label>
      <?php mm_panel_hint($field); ?>
    </div>
  <?php return;
  }

  if ($type === 'image') {
    $src = $value !== '' ? mm_img($value) : ''; ?>
    <div data-image-field>
      <?php mm_panel_label($field['label']); ?>
      <div class="flex gap-4 rounded-xl border border-dashed border-grey p-4">
        <div class="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-mist">
          <img src="<?php echo esc_url($src); ?>" alt="" class="max-h-full max-w-full object-contain"<?php echo $src ? '' : ' hidden'; ?> data-preview>
          <span class="text-xs text-muted"<?php echo $src ? ' hidden' : ''; ?> data-no-image>No image</span>
        </div>
        <div class="min-w-0 flex-1 space-y-3">
          <input name="<?php echo esc_attr($name); ?>" value="<?php echo esc_attr($value); ?>" placeholder="/images/... or https://..." class="field" data-address>
          <input type="file" name="file_<?php echo esc_attr($key); ?>" accept="image/jpeg,image/png,image/gif,image/webp" class="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-pink-soft file:px-4 file:py-2 file:font-semibold file:text-pink" data-file>
          <p class="text-xs text-muted">Upload a new photo, or paste an image address. Max 8 MB.</p>
        </div>
      </div>
      <?php mm_panel_hint($field); ?>
    </div>
  <?php return;
  }

  if ($type === 'gallery') { ?>
    <div>
      <label class="block">
        <?php mm_panel_label($field['label']); ?>
        <textarea name="<?php echo esc_attr($name); ?>" rows="6" class="field leading-relaxed"><?php echo esc_textarea($value); ?></textarea>
        <?php mm_panel_hint($field); ?>
      </label>
      <label class="mt-3 block rounded-xl border border-dashed border-grey p-4">
        <span class="mb-2 block text-sm font-semibold text-ink">Add photos to the gallery</span>
        <input type="file" name="files_<?php echo esc_attr($key); ?>[]" accept="image/jpeg,image/png,image/gif,image/webp" multiple class="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-pink-soft file:px-4 file:py-2 file:font-semibold file:text-pink">
        <span class="mt-2 block text-xs text-muted">The photos you choose are added to the end of the list when you save.</span>
      </label>
    </div>
  <?php return;
  }

  echo '<label class="block">';
  mm_panel_label($field['label'], !empty($field['required']));
  switch ($type) {
    case 'textarea':
      $rows = isset($field['rows']) ? (int) $field['rows'] : 4;
      echo '<textarea name="' . esc_attr($name) . '" rows="' . $rows . '" class="field leading-relaxed">' . esc_textarea($value) . '</textarea>';
      break;
    case 'select':
      $options = is_string($field['options']) ? call_user_func($field['options']) : $field['options'];
      echo '<select name="' . esc_attr($name) . '" class="field"' . ($key === 'bookingType' ? ' data-booking-type' : '') . '>';
      foreach ($options as $optionValue => $optionLabel) {
        echo '<option value="' . esc_attr($optionValue) . '"' . selected($value, (string) $optionValue, false) . '>' . esc_html($optionLabel) . '</option>';
      }
      echo '</select>';
      break;
    case 'datetime':
      echo '<input type="datetime-local" name="' . esc_attr($name) . '" value="' . esc_attr(mm_to_london_input(mm_utc($value))) . '" class="field"' . (!empty($field['required']) ? ' required' : '') . '>';
      if (empty($field['help'])) $field['help'] = 'London time.';
      break;
    case 'number':
      echo '<input type="number" name="' . esc_attr($name) . '" value="' . esc_attr($value) . '" class="field">';
      break;
    case 'url':
      echo '<input type="url" name="' . esc_attr($name) . '" value="' . esc_attr($value) . '" placeholder="https://..." class="field">';
      break;
    default:
      echo '<input name="' . esc_attr($name) . '" value="' . esc_attr($value) . '" class="field">';
  }
  mm_panel_hint($field);
  echo '</label>';
}

// A delete button (in its own small form) that asks "Are you sure?" first
function mm_panel_delete($action, $hidden, $message = 'Delete this item? This cannot be undone.', $label = 'Delete') {
  mm_panel_form($action, 'inline');
  foreach ($hidden as $name => $value) echo '<input type="hidden" name="' . esc_attr($name) . '" value="' . esc_attr($value) . '">';
  echo '<button type="submit" data-confirm="' . esc_attr($message) . '" class="rounded-full px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50">' . esc_html($label) . '</button>';
  echo '</form>';
}

function mm_panel_badge($text, $class = 'bg-mist text-muted') {
  echo '<span class="ml-2 rounded px-2 py-0.5 text-xs font-semibold ' . esc_attr($class) . '">' . esc_html($text) . '</span>';
}

// The reason a message was sent. "Make a referral" is pink so it stands out.
function mm_reason_badge($reason) {
  $referral = $reason === MM_REFERRAL;
  echo '<span class="rounded-full px-2.5 py-0.5 text-xs font-semibold ' . ($referral ? 'bg-pink-soft text-pink ring-1 ring-pink' : 'bg-mist text-muted') . '">' . esc_html($reason) . '</span>';
}
