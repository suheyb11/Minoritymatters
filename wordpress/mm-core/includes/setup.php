<?php
// First activation: the bookings table, the website's pages, the home and blog pages, and the web addresses.
// Safe to run again (deactivate and activate the plugin): nothing that already exists is changed.

if (!defined('ABSPATH')) exit;

// slug => title. The theme has a template for each of these (page-<slug>.php).
const MM_PAGES = [
  'home' => 'Home',
  'blog' => 'Blog',
  'our-work' => 'Our work',
  'impact' => 'Our impact',
  'events' => 'Events',
  'about' => 'About',
  'values' => 'Values',
  'press' => 'Press',
  'our-funders' => 'Our funders',
  'our-founder' => 'Our founder',
  'contact' => 'Contact',
  'donate' => 'Donate',
];

function mm_activate() {
  mm_create_bookings_table();
  mm_add_roles();
  mm_create_pages();
  mm_add_givey_link();

  // Blog posts at /blog/<post>/, like the old website, so old links keep working.
  // Projects and events have their own (/impact/…, /events/…).
  update_option('permalink_structure', '/blog/%postname%/');

  mm_register_post_types();
  add_rewrite_endpoint('ics', EP_PERMALINK);
  flush_rewrite_rules();
}

function mm_create_pages() {
  foreach (MM_PAGES as $slug => $title) {
    if (get_page_by_path($slug)) continue;
    wp_insert_post(['post_type' => 'page', 'post_status' => 'publish', 'post_title' => $title, 'post_name' => $slug, 'post_content' => '']);
  }
  $home = get_page_by_path('home');
  $blog = get_page_by_path('blog');
  if ($home && $blog && get_option('show_on_front') !== 'page') {
    update_option('show_on_front', 'page');
    update_option('page_on_front', $home->ID);
    update_option('page_for_posts', $blog->ID);
  }
}

// The admin menu in a sensible order, with Messages near the top
add_filter('custom_menu_order', '__return_true');
add_filter('menu_order', function ($order) {
  $first = ['index.php', 'edit.php?post_type=mm_message', 'mm-settings', 'separator1'];
  return array_merge($first, array_values(array_diff($order, $first)));
});

// Without the Minority Matters theme the website shows nothing useful: remind the admin
add_action('admin_notices', function () {
  if (get_template() !== 'minority-matters' && current_user_can('switch_themes')) {
    echo '<div class="notice notice-warning"><p>Minority Matters Core works with the <strong>Minority Matters</strong> theme. Activate it under Appearance &gt; Themes.</p></div>';
  }
});
