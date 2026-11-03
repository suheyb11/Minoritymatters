<?php
// The Minority Matters theme. It shows the content of the "Minority Matters Core" plugin with the
// design of the old Next.js website: the same HTML and Tailwind classes, and the animations rewritten
// in plain JavaScript (assets/js/app.js).
//
//   inc/components.php   small pieces used on many pages (ring, page header, cards, buttons, …)
//   header.php/footer.php, front-page.php, page-<slug>.php, single-mm_project.php, single-mm_event.php,
//   home.php (blog list), single.php (blog post), 404.php

if (!defined('ABSPATH')) exit;

define('MM_THEME_VERSION', '1.0.0');

require_once get_template_directory() . '/inc/components.php';

add_action('after_setup_theme', function () {
  add_theme_support('title-tag');
  add_theme_support('html5', ['search-form', 'gallery', 'caption', 'style', 'script']);
  add_theme_support('post-thumbnails');
});

add_action('wp_enqueue_scripts', function () {
  $dir = get_template_directory();
  $uri = get_template_directory_uri();
  // The file's change time is the version, so browsers fetch a new copy after every upload
  wp_enqueue_style('mm-app', $uri . '/assets/css/app.css', [], (string) @filemtime($dir . '/assets/css/app.css'));
  wp_enqueue_script('mm-app', $uri . '/assets/js/app.js', [], (string) @filemtime($dir . '/assets/js/app.js'), ['strategy' => 'defer', 'in_footer' => true]);

  // WordPress's own block styles are not used by this design
  wp_dequeue_style('wp-block-library');
  wp_dequeue_style('wp-block-library-theme');
  wp_dequeue_style('global-styles');
  wp_dequeue_style('classic-theme-styles');
}, 20);

// The fonts used above the fold load first
add_action('wp_head', function () {
  $fonts = get_template_directory_uri() . '/assets/fonts/';
  echo '<link rel="preload" href="' . esc_url($fonts . 'bricolage-grotesque-latin-wght-normal.woff2') . '" as="font" type="font/woff2" crossorigin>' . "\n";
  echo '<link rel="preload" href="' . esc_url($fonts . 'figtree-latin-wght-normal.woff2') . '" as="font" type="font/woff2" crossorigin>' . "\n";
  echo '<link rel="icon" href="' . esc_url(get_template_directory_uri() . '/assets/images/logo.png') . '">' . "\n";
}, 1);

remove_action('wp_head', 'print_emoji_detection_script', 7);
remove_action('wp_print_styles', 'print_emoji_styles');

// ---------- Titles and descriptions (for search engines and link previews) ----------

add_filter('document_title_separator', function () { return '|'; });

add_filter('pre_get_document_title', function ($title) {
  if (is_front_page()) return 'Minority Matters — community, education and child safeguarding in London';
  return $title;
});

// Page title parts: the site name stays "Minority Matters", whatever is set under Settings > General
add_filter('document_title_parts', function ($parts) {
  $parts['site'] = 'Minority Matters';
  unset($parts['tagline']);
  return $parts;
});

add_action('wp_head', function () {
  if (!function_exists('mm_setting')) return;
  $description = 'Minority Matters is a London charity working with minority communities to support children\'s education, empower parents and protect young people from criminal exploitation.';
  $image = '';
  if (is_singular(['mm_project', 'mm_event'])) {
    $row = mm_row(get_queried_object());
    $description = $row['summary'] ?: $description;
    $image = $row['coverImage'];
  } elseif (is_singular('post')) {
    $post = get_queried_object();
    $description = $post->post_excerpt ?: $description;
    $image = get_post_meta($post->ID, 'mm_coverImage', true);
  } elseif (is_page('our-founder')) {
    $description = mm_setting('founderIntro') ?: $description;
    $image = mm_setting('founderPhoto');
  } elseif (is_page('impact')) {
    $description = 'What we delivered with families, children and young people across Islington and Camden this year.';
  } elseif (is_page('events')) {
    $description = 'Activities, trips and sessions for children, young people and families in Islington and Camden.';
  }
  echo '<meta name="description" content="' . esc_attr(wp_strip_all_tags($description)) . '">' . "\n";
  echo '<meta property="og:title" content="' . esc_attr(wp_get_document_title()) . '">' . "\n";
  echo '<meta property="og:description" content="' . esc_attr(wp_strip_all_tags($description)) . '">' . "\n";
  if ($image) echo '<meta property="og:image" content="' . esc_url(mm_abs_url(mm_img($image))) . '">' . "\n";
});

// "/wp-content/…" or "https://…" -> always a full address
function mm_abs_url($url) {
  return preg_match('#^https?://#', $url) ? $url : home_url($url);
}

// Without the plugin, show a clear message instead of errors
add_action('template_redirect', function () {
  if (!function_exists('mm_row') && !is_admin()) {
    wp_die('The Minority Matters website needs the <strong>Minority Matters Core</strong> plugin. Activate it under Plugins.', 'Minority Matters');
  }
});
