<?php
// The content types and their "Details" box in the admin.
// Title, slug ("Permalink"/"Slug"), order ("Order" in the Page Attributes box) and Published/Draft are WordPress's own.

if (!defined('ABSPATH')) exit;

add_action('init', 'mm_register_post_types');

function mm_register_post_types() {
  // name => [plural, singular, menu icon, public pages at /<slug>/<post>/ or null]
  $types = [
    'mm_service' => ['Our work', 'Service area / programme', 'dashicons-heart', null],
    'mm_project' => ['Projects', 'Project', 'dashicons-chart-bar', 'impact'],
    'mm_event' => ['Events', 'Event', 'dashicons-calendar-alt', 'events'],
    'mm_value' => ['Values', 'Value', 'dashicons-star-filled', null],
    'mm_press' => ['Press', 'Press item', 'dashicons-media-document', null],
    'mm_funder' => ['Funders', 'Funder', 'dashicons-money-alt', null],
  ];
  $position = 21;
  foreach ($types as $name => $t) {
    list($plural, $singular, $icon, $slug) = $t;
    register_post_type($name, [
      'labels' => [
        'name' => $plural,
        'singular_name' => $singular,
        'add_new' => 'Add new',
        'add_new_item' => 'Add ' . strtolower($singular),
        'edit_item' => 'Edit ' . strtolower($singular),
        'new_item' => 'New ' . strtolower($singular),
        'search_items' => 'Search ' . strtolower($plural),
        'not_found' => 'Nothing found',
        'all_items' => 'All ' . strtolower($plural),
      ],
      'public' => $slug !== null,
      'publicly_queryable' => $slug !== null,
      'exclude_from_search' => $slug === null,
      'show_ui' => true,
      'show_in_menu' => true,
      'show_in_nav_menus' => false,
      'menu_position' => $position++,
      'menu_icon' => $icon,
      'supports' => ['title', 'page-attributes'],
      'has_archive' => false,
      // ep_mask: lets /events/<event>/ics/ (the calendar file) work, see includes/bookings.php
      'rewrite' => $slug !== null ? ['slug' => $slug, 'with_front' => false, 'ep_mask' => EP_PERMALINK] : false,
      'query_var' => $slug !== null,
      'show_in_rest' => false, // the classic edit screen, so the Details box sits under the title
    ]);
  }
}

// ---------- The "Details" box ----------

add_action('add_meta_boxes', function () {
  foreach (['mm_service', 'mm_project', 'mm_event', 'mm_value', 'mm_press', 'mm_funder'] as $type) {
    add_meta_box('mm_details', 'Details', 'mm_details_box', $type, 'normal', 'high');
  }
  // Blog posts: the author name shown on the post and the cover photo (the text is written in the editor)
  add_meta_box('mm_details', 'Blog post details', 'mm_details_box', 'post', 'normal', 'high');
});

function mm_details_box($post) {
  wp_nonce_field('mm_save_details', 'mm_details_nonce');
  echo '<table class="form-table mm-fields" role="presentation"><tbody>';
  foreach (mm_fields($post->post_type) as $key => $field) {
    $value = get_post_meta($post->ID, 'mm_' . $key, true);
    if ($value === '' && isset($field['default']) && $post->post_status === 'auto-draft') $value = $field['default'];
    mm_field_row('mm_fields[' . $key . ']', 'mm_' . $key, $field, (string) $value);
  }
  echo '</tbody></table>';
}

// One labelled field in a form table. Also used by the Site settings page.
function mm_field_row($name, $id, $field, $value) {
  $label = esc_html($field['label']);
  echo '<tr><th scope="row"><label for="' . esc_attr($id) . '">' . $label . '</label></th><td>';
  switch ($field['type']) {
    case 'textarea':
      $rows = isset($field['rows']) ? (int) $field['rows'] : 4;
      echo '<textarea class="large-text" rows="' . $rows . '" id="' . esc_attr($id) . '" name="' . esc_attr($name) . '">' . esc_textarea($value) . '</textarea>';
      break;
    case 'number':
      echo '<input type="number" class="small-text" id="' . esc_attr($id) . '" name="' . esc_attr($name) . '" value="' . esc_attr($value) . '">';
      break;
    case 'checkbox':
      echo '<input type="hidden" name="' . esc_attr($name) . '" value="0">';
      echo '<input type="checkbox" id="' . esc_attr($id) . '" name="' . esc_attr($name) . '" value="1"' . checked($value, '1', false) . '>';
      break;
    case 'select':
      $options = is_string($field['options']) ? call_user_func($field['options']) : $field['options'];
      echo '<select id="' . esc_attr($id) . '" name="' . esc_attr($name) . '">';
      foreach ($options as $optionValue => $optionLabel) {
        echo '<option value="' . esc_attr($optionValue) . '"' . selected($value, (string) $optionValue, false) . '>' . esc_html($optionLabel) . '</option>';
      }
      echo '</select>';
      break;
    case 'datetime':
      $date = mm_utc($value);
      echo '<input type="datetime-local" id="' . esc_attr($id) . '" name="' . esc_attr($name) . '" value="' . esc_attr(mm_to_london_input($date)) . '"' . (!empty($field['required']) ? ' required' : '') . '> <span class="description">London time</span>';
      break;
    case 'image':
      echo '<div class="mm-image">';
      echo '<input type="text" class="regular-text mm-image-input" id="' . esc_attr($id) . '" name="' . esc_attr($name) . '" value="' . esc_attr($value) . '"> ';
      echo '<button type="button" class="button mm-choose-image">Choose image</button>';
      echo '<div class="mm-image-preview">' . ($value !== '' ? '<img src="' . esc_url(mm_img($value)) . '" alt="">' : '') . '</div>';
      echo '</div>';
      break;
    case 'gallery':
      echo '<textarea class="large-text mm-gallery-input" rows="8" id="' . esc_attr($id) . '" name="' . esc_attr($name) . '">' . esc_textarea($value) . '</textarea>';
      echo '<p><button type="button" class="button mm-add-photos">Add photos</button></p>';
      break;
    case 'url':
      echo '<input type="url" class="regular-text" id="' . esc_attr($id) . '" name="' . esc_attr($name) . '" value="' . esc_attr($value) . '">';
      break;
    default:
      echo '<input type="text" class="regular-text" id="' . esc_attr($id) . '" name="' . esc_attr($name) . '" value="' . esc_attr($value) . '">';
  }
  if (!empty($field['help'])) echo '<p class="description">' . esc_html($field['help']) . '</p>';
  echo '</td></tr>';
}

// Clean one submitted value for its field type (the value must already be unslashed)
function mm_clean_field($field, $value) {
  $value = (string) $value;
  switch ($field['type']) {
    case 'textarea':
    case 'gallery':
      return sanitize_textarea_field(str_replace("\r\n", "\n", $value));
    case 'number':
      $value = trim($value);
      return preg_match('/^-?\d+$/', $value) ? $value : '';
    case 'checkbox':
      return $value === '1' ? '1' : '0';
    case 'select':
      $options = is_string($field['options']) ? call_user_func($field['options']) : $field['options'];
      return array_key_exists($value, $options) ? $value : (isset($field['default']) ? $field['default'] : '');
    case 'datetime':
      return mm_from_london_input($value);
    case 'url':
      return esc_url_raw(trim($value));
    default: // text, image ("/images/…", "/media/…" or a full link)
      return sanitize_text_field($value);
  }
}

add_action('save_post', function ($post_id, $post) {
  if (!isset($_POST['mm_details_nonce']) || !wp_verify_nonce($_POST['mm_details_nonce'], 'mm_save_details')) return;
  if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
  if (!current_user_can('edit_post', $post_id)) return;
  $submitted = isset($_POST['mm_fields']) && is_array($_POST['mm_fields']) ? wp_unslash($_POST['mm_fields']) : [];

  foreach (mm_fields($post->post_type) as $key => $field) {
    if (!array_key_exists($key, $submitted)) continue;
    update_post_meta($post_id, 'mm_' . $key, mm_clean_field($field, $submitted[$key]));
  }

  mm_unfeature_others($post_id);
}, 10, 2);

// Only one project can be the home page "Featured story": when this one is featured, untick the others
function mm_unfeature_others($post_id) {
  if (get_post_type($post_id) !== 'mm_project' || get_post_meta($post_id, 'mm_isFeatured', true) !== '1') return;
  foreach (get_posts(['post_type' => 'mm_project', 'post_status' => 'any', 'numberposts' => -1, 'fields' => 'ids', 'exclude' => [$post_id]]) as $other) {
    update_post_meta($other, 'mm_isFeatured', '0');
  }
}

// The media picker for image and gallery fields
add_action('admin_enqueue_scripts', function () {
  wp_enqueue_media();
  wp_enqueue_script('mm-admin', MM_CORE_URL . 'assets/admin.js', ['jquery'], '1.0.0', true);
  wp_enqueue_style('mm-admin', MM_CORE_URL . 'assets/admin.css', [], '1.0.0');
});

// ---------- Admin lists: useful columns ----------

add_filter('manage_mm_project_posts_columns', function ($columns) {
  return mm_insert_columns($columns, ['mm_period' => 'Period', 'mm_category' => 'Category', 'mm_people' => 'People reached', 'mm_featured' => 'Featured', 'menu_order' => 'Order']);
});
add_filter('manage_mm_event_posts_columns', function ($columns) {
  return mm_insert_columns($columns, ['mm_when' => 'When', 'mm_audience' => 'For', 'mm_bookings' => 'Bookings']);
});
add_filter('manage_mm_service_posts_columns', function ($columns) {
  return mm_insert_columns($columns, ['mm_kind' => 'Type', 'menu_order' => 'Order']);
});
foreach (['mm_value', 'mm_press', 'mm_funder'] as $mm_type) {
  add_filter('manage_' . $mm_type . '_posts_columns', function ($columns) {
    return mm_insert_columns($columns, ['menu_order' => 'Order']);
  });
}

function mm_insert_columns($columns, $extra) {
  $date = isset($columns['date']) ? $columns['date'] : null;
  unset($columns['date']);
  $columns = array_merge($columns, $extra);
  if ($date) $columns['date'] = $date;
  return $columns;
}

add_action('manage_posts_custom_column', function ($column, $post_id) {
  $post = get_post($post_id);
  if (strpos($post->post_type, 'mm_') !== 0) return;
  switch ($column) {
    case 'menu_order':
      echo (int) $post->menu_order;
      break;
    case 'mm_period':
    case 'mm_category':
    case 'mm_audience':
      echo esc_html(get_post_meta($post_id, $column, true));
      break;
    case 'mm_people':
      echo (int) get_post_meta($post_id, 'mm_peopleReached', true);
      break;
    case 'mm_featured':
      echo get_post_meta($post_id, 'mm_isFeatured', true) === '1' ? '★' : '';
      break;
    case 'mm_kind':
      echo get_post_meta($post_id, 'mm_kind', true) === 'area' ? 'Service area' : 'Programme';
      break;
    case 'mm_when':
      $row = mm_row($post);
      echo $row['startsAt'] ? esc_html(mm_event_date($row['startsAt'], $row['endsAt'])) : '—';
      break;
    case 'mm_bookings':
      if (!current_user_can(MM_BOOKINGS_CAP)) break; // personal details: Editors and Administrators only
      $totals = mm_booking_totals($post_id);
      $url = admin_url('edit.php?post_type=mm_event&page=mm-bookings&event=' . $post_id);
      echo '<a href="' . esc_url($url) . '">' . (int) $totals['confirmed'] . ' confirmed';
      if ($totals['waitlist']) echo ', ' . (int) $totals['waitlist'] . ' waiting';
      echo '</a>';
      break;
  }
}, 10, 2);

// Lists are sorted by Order (then title) instead of by date
add_action('pre_get_posts', function ($query) {
  if (!is_admin() || !$query->is_main_query() || $query->get('orderby')) return;
  $type = $query->get('post_type');
  if (in_array($type, ['mm_service', 'mm_project', 'mm_value', 'mm_press', 'mm_funder'], true)) {
    $query->set('orderby', ['menu_order' => 'ASC', 'ID' => 'ASC']);
  }
});
