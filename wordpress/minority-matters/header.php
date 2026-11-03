<?php
if (!defined('ABSPATH')) exit;
// Top of every page: the sticky header with the logo, the menu and the Donate button

$links = [
  ['/', 'home'],
  ['/our-work', 'our work'],
  ['/impact', 'impact'],
  ['/events', 'events'],
  ['/blog', 'blog'],
  ['/about', 'about'],
  ['/our-funders', 'our funders'],
  ['/contact', 'contact'],
];

// Which menu item is the current page? (Projects are under /impact, events under /events, posts under /blog)
$home_path = trim((string) parse_url(home_url('/'), PHP_URL_PATH), '/');
$path = trim((string) parse_url(isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '/', PHP_URL_PATH), '/');
if ($home_path !== '' && strpos($path, $home_path) === 0) $path = trim(substr($path, strlen($home_path)), '/');
$is_active = function ($href) use ($path) {
  $slug = trim($href, '/');
  return $slug === '' ? $path === '' : ($path === $slug || strpos($path, $slug . '/') === 0);
};
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo('charset'); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded focus:bg-white focus:px-4 focus:py-2">Skip to content</a>

<header class="sticky top-0 z-50 bg-white/90 backdrop-blur transition-shadow" data-header>
  <div class="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
    <a href="<?php echo esc_url(mm_url('/')); ?>" class="shrink-0" aria-label="Minority Matters home">
      <img src="<?php echo esc_url(mm_img('/images/logo.png')); ?>" alt="Minority Matters" class="h-14 w-14">
    </a>

    <nav class="hidden lg:block" aria-label="Main">
      <ul class="flex items-center gap-1">
        <?php foreach ($links as $link) : $active = $is_active($link[0]); ?>
          <li>
            <a href="<?php echo esc_url(mm_url($link[0])); ?>" class="relative rounded-full px-3 py-2 text-[0.95rem] font-medium transition-colors <?php echo $active ? 'text-pink' : 'text-muted hover:text-ink'; ?>"<?php echo $active ? ' aria-current="page"' : ''; ?>>
              <?php mm_e($link[1]); ?>
              <?php if ($active) : ?><span class="absolute -bottom-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-pink"></span><?php endif; ?>
            </a>
          </li>
        <?php endforeach; ?>
      </ul>
    </nav>

    <div class="flex items-center gap-2">
      <a<?php echo mm_donate_attrs(); ?> class="rounded-full bg-pink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pink-dark">Donate</a>
      <button type="button" class="flex h-11 w-11 items-center justify-center rounded-full bg-mist lg:hidden" data-menu-button aria-expanded="false" aria-controls="mobile-menu" aria-label="Open menu">
        <span class="relative block h-3 w-5">
          <span class="absolute left-0 top-0 h-0.5 w-5 bg-ink transition-transform" data-bar="1"></span>
          <span class="absolute left-0 top-3 h-0.5 w-5 bg-ink transition-transform" data-bar="2"></span>
        </span>
      </button>
    </div>
  </div>

  <!-- Mobile menu -->
  <nav id="mobile-menu" aria-label="Mobile" class="mobile-menu border-t border-mist bg-white lg:hidden" hidden>
    <div>
      <ul class="px-4 py-4">
        <?php foreach ($links as $i => $link) : ?>
          <li style="animation-delay:<?php echo $i * 0.03; ?>s">
            <a href="<?php echo esc_url(mm_url($link[0])); ?>" class="block py-3 font-display text-2xl <?php echo $is_active($link[0]) ? 'text-pink' : 'text-ink'; ?>"><?php mm_e($link[1]); ?></a>
          </li>
        <?php endforeach; ?>
      </ul>
    </div>
  </nav>
</header>

<?php // overflow-x-clip: soft photo hazes may spread past the edge of the screen without causing sideways scrolling ?>
<main id="main" class="overflow-x-clip">
