<?php
// Small pieces used on many pages. They print the same HTML as the old website's React components
// (components/Motion.tsx, PageHeader.tsx); assets/js/app.js adds the movement.

if (!defined('ABSPATH')) exit;

// A page of this website: mm_url('/our-work') -> "https://…/our-work/"
function mm_url($path = '/') {
  return home_url(user_trailingslashit($path));
}

// Print text safely: e('<b>') prints "&lt;b&gt;"
function mm_e($text) {
  echo esc_html((string) $text);
}

// The attributes of a block that fades in (the old <Reveal>). In a template: <div + echo mm_reveal(0.15, 'lg:col-span-5') + >
// On page load it rises with CSS; further down the page it fades in when it scrolls into view.
// $x / $y: where it comes from (y = 0: only fades). $scale below 1: it grows into place.
function mm_reveal($delay = 0, $class = '', $x = 0, $y = 28, $scale = 1) {
  $css_rise = $x == 0 && $y > 0 && $scale == 1;
  $classes = trim(($css_rise ? 'reveal-rise ' : '') . $class);
  $attrs = ' class="' . esc_attr($classes) . '" data-reveal';
  if ($delay) $attrs .= ' data-delay="' . esc_attr($delay) . '" style="animation-delay:' . esc_attr($delay) . 's"';
  if ($x != 0) $attrs .= ' data-x="' . esc_attr($x) . '"';
  if ($y != 28) $attrs .= ' data-y="' . esc_attr($y) . '"';
  if ($scale != 1) $attrs .= ' data-scale="' . esc_attr($scale) . '"';
  return $attrs;
}

// The logo circle with the pink arc. "arc" is how much of the circle is pink (0 to 1).
// $on_view: the arc draws when it scrolls into view instead of on page load.
function mm_ring($size = 120, $arc = 0.2, $stroke = 6, $class = '', $on_view = false) {
  $r = 50 - $stroke / 2;
  $dash = round($arc * 100, 2);
  echo '<svg viewBox="0 0 100 100" width="' . (int) $size . '" height="' . (int) $size . '" class="' . esc_attr($class) . '"' . ($on_view ? ' data-ring-on-view' : '') . ' aria-hidden="true">';
  echo '<circle cx="50" cy="50" r="' . $r . '" fill="none" stroke="#b2b2b2" stroke-width="' . $stroke . '"/>';
  echo '<circle class="ring-arc" cx="50" cy="50" r="' . $r . '" fill="none" stroke="#e71d73" stroke-width="' . $stroke . '" pathLength="100" stroke-dasharray="' . $dash . ' 100" transform="rotate(-90 50 50)"/>';
  echo '</svg>';
}

// The coloured title band at the top of each inner page.
// "arc" sets how much of the ring is pink, so each page gets its own small variation.
function mm_page_header($title, $intro = '', $arc = 0.2) { ?>
  <section class="relative overflow-hidden bg-mist">
    <div class="mx-auto flex max-w-7xl items-end justify-between gap-8 px-4 pb-14 pt-16 sm:px-6 sm:pb-20 sm:pt-24">
      <div<?php echo mm_reveal(); ?>>
        <h1 class="font-display text-6xl font-bold lowercase leading-[0.9] text-pink sm:text-8xl"><?php mm_e($title); ?></h1>
        <?php if ($intro) : ?><p class="mt-6 max-w-xl text-lg text-muted"><?php mm_e($intro); ?></p><?php endif; ?>
      </div>
      <?php mm_ring(150, $arc, 5, 'hidden shrink-0 md:block'); ?>
    </div>
  </section>
<?php }

function mm_play_icon($class = 'h-7 w-7') {
  echo '<svg viewBox="0 0 24 24" class="' . esc_attr($class) . '" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z"/></svg>';
}

// The logo ring around a play button: a grey circle with a pink arc.
// $spin = always turning slowly; $spin_on_hover = turns while the parent "group" is hovered or focused.
function mm_play_ring($spin = false, $spin_on_hover = false, $track = '#b2b2b2', $width = 4) {
  $turning = $spin
    ? 'motion-safe:animate-[spin_8s_linear_infinite]'
    : ($spin_on_hover ? 'motion-safe:group-hover:animate-[spin_3s_linear_infinite] motion-safe:group-focus-visible:animate-[spin_3s_linear_infinite]' : '');
  echo '<svg viewBox="0 0 100 100" class="absolute inset-0 h-full w-full ' . $turning . '" aria-hidden="true">';
  echo '<circle cx="50" cy="50" r="46" fill="none" stroke="' . esc_attr($track) . '" stroke-width="' . $width . '"/>';
  echo '<circle cx="50" cy="50" r="46" fill="none" stroke="#e71d73" stroke-width="' . ($width + 1) . '" pathLength="100" stroke-dasharray="22 78" transform="rotate(-90 50 50)"/>';
  echo '</svg>';
}

// An image that fills its (relative) box, like Next.js <Image fill>
function mm_fill_img($src, $alt = '', $class = 'object-cover', $eager = false, $style = '') {
  echo '<img src="' . esc_url(mm_img($src)) . '" alt="' . esc_attr($alt) . '" class="absolute inset-0 h-full w-full ' . esc_attr($class) . '"'
    . ($eager ? ' fetchpriority="high"' : ' loading="lazy"') . ' decoding="async"' . ($style ? ' style="' . esc_attr($style) . '"' : '') . '>';
}

// A feathered photo with a soft coloured haze around it (a blurred copy behind the sharp one).
// Give it a size with $class, for example "aspect-[4/3]". The section around it should use overflow-x-clip.
function mm_glow_photo($src, $alt, $class = '', $img_class = '') {
  echo '<div class="photo-glow ' . esc_attr($class) . '">';
  echo '<div class="photo-glow-layer" aria-hidden="true">';
  mm_fill_img($src, '', 'object-cover');
  echo '</div>';
  mm_fill_img($src, $alt, 'feather object-cover ' . $img_class);
  echo '</div>';
}

// A number that counts up when it scrolls into view. The real number is in the HTML (it shows without JavaScript).
function mm_count_up($to, $suffix = '') {
  echo '<span data-count-to="' . (int) $to . '" data-suffix="' . esc_attr($suffix) . '">' . (int) $to . esc_html($suffix) . '</span>';
}

// "30" counts up; "A*" or "3–4" is shown as it is
function mm_stat_number($number) {
  if (preg_match('/^\d+$/', $number)) mm_count_up((int) $number);
  else mm_e($number);
}

// ---------- Donating ----------
// The ways to donate that are filled in under Site settings (PayPal, Givey)
function mm_donate_options() {
  $options = [
    ['PayPal', 'Give with your PayPal account or a debit or credit card.', mm_setting('donateUrl')],
    ['Givey', 'Give through our Givey page.', mm_setting('donateGiveyUrl')],
  ];
  return array_values(array_filter($options, function ($o) { return $o[2] !== ''; }));
}

// The attributes of a Donate button: with one way to donate it opens that page; with two it opens the
// "choose how to donate" window (footer.php), or the /donate page when JavaScript is off.
function mm_donate_attrs() {
  $options = mm_donate_options();
  if (count($options) === 1) return ' href="' . esc_url($options[0][2]) . '" target="_blank" rel="noopener noreferrer"';
  return ' href="' . esc_url(mm_url('/donate')) . '" data-donate';
}

// The list of ways to donate (in the window and on the /donate page)
function mm_donate_choices() { ?>
  <ul class="space-y-3">
    <?php foreach (mm_donate_options() as $o) : ?>
      <li>
        <a href="<?php echo esc_url($o[2]); ?>" target="_blank" rel="noopener noreferrer" class="group flex items-center justify-between gap-4 rounded-2xl border-2 border-mist bg-white p-5 transition-colors hover:border-pink hover:bg-pink-soft/40">
          <span>
            <span class="block font-display text-2xl font-semibold text-ink group-hover:text-pink">Donate with <?php mm_e($o[0]); ?></span>
            <span class="mt-1 block text-sm text-muted"><?php mm_e($o[1]); ?></span>
          </span>
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pink text-xl text-white transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
        </a>
      </li>
    <?php endforeach; ?>
  </ul>
<?php }

// The pink "call to action" band at the bottom of several pages.
// Each button: ['label' => …, 'href' => …, 'external' => true/false] or ['label' => 'Donate', 'donate' => true]
function mm_cta($heading, $text, $first, $second) { ?>
  <div class="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 rounded-[2rem] bg-pink px-8 py-14 text-white sm:px-14 md:flex-row md:items-center">
    <div>
      <h2 class="font-display text-4xl font-bold leading-tight sm:text-5xl"><?php mm_e($heading); ?></h2>
      <p class="mt-3 max-w-xl text-lg text-white/85"><?php mm_e($text); ?></p>
    </div>
    <div class="flex flex-wrap gap-3">
      <a<?php echo mm_cta_attrs($first); ?> class="rounded-full bg-white px-6 py-3.5 font-semibold text-pink transition-colors hover:bg-plum hover:text-white"><?php mm_e($first['label']); ?></a>
      <a<?php echo mm_cta_attrs($second); ?> class="rounded-full border-2 border-white px-6 py-3 font-semibold text-white transition-colors hover:bg-white hover:text-pink"><?php mm_e($second['label']); ?></a>
    </div>
  </div>
<?php }

function mm_cta_attrs($button) {
  if (!empty($button['donate'])) return mm_donate_attrs();
  return ' href="' . esc_url($button['href']) . '"' . (!empty($button['external']) ? ' target="_blank" rel="noopener noreferrer"' : '');
}

// One project on the Impact page and the home page. The whole card is one link.
function mm_project_card($project) {
  $stats = mm_stats($project['stats']);
  $stat = $stats ? $stats[0] : null; ?>
  <a href="<?php echo esc_url(get_permalink($project['id'])); ?>" class="group block h-full">
    <div class="photo-frame aspect-[4/3] bg-mist">
      <?php if ($project['coverImage']) mm_fill_img($project['coverImage'], mm_cover_alt($project), 'object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.04]'); ?>
    </div>
    <p class="mt-4 text-sm font-semibold text-pink"><?php mm_e($project['category']); ?></p>
    <h3 class="mt-1 font-display text-2xl font-semibold leading-tight text-ink group-hover:text-pink"><?php mm_e($project['title']); ?></h3>
    <p class="mt-2 leading-relaxed text-muted"><?php mm_e($project['summary']); ?></p>
    <?php if ($stat) : ?>
      <p class="mt-4 flex items-baseline gap-2">
        <span class="font-display text-4xl font-bold text-pink"><?php mm_e($stat['number']); ?></span>
        <span class="text-sm text-muted"><?php mm_e($stat['label']); ?></span>
      </p>
    <?php endif; ?>
  </a>
<?php }

// One upcoming event on the /events page. The photo only shows on bigger screens, to keep cards short on phones.
function mm_event_card($event, $left) { ?>
  <a href="<?php echo esc_url(get_permalink($event['id'])); ?>" class="group flex gap-4 rounded-2xl border border-[#e5e3e8] bg-white p-4 transition-colors hover:border-pink sm:gap-6 sm:p-6">
    <time datetime="<?php echo esc_attr($event['startsAt']->format('c')); ?>" class="flex w-14 shrink-0 flex-col items-center pt-1 text-pink sm:w-16">
      <span class="font-display text-4xl font-bold leading-none sm:text-5xl"><?php mm_e(mm_london($event['startsAt'], 'j')); ?></span>
      <span class="mt-1 text-sm font-semibold uppercase tracking-wide"><?php mm_e(mm_london($event['startsAt'], 'M')); ?></span>
    </time>
    <div class="min-w-0 flex-1">
      <h4 class="break-words font-display text-xl font-semibold leading-snug text-ink group-hover:text-pink sm:text-2xl"><?php mm_e($event['title']); ?></h4>
      <p class="mt-1 text-muted">
        <?php mm_e(mm_event_date($event['startsAt'], $event['endsAt'])); ?><?php if ($event['location']) : ?> · <?php mm_e($event['location']); ?><?php endif; ?>
      </p>
      <p class="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span class="rounded-full bg-mist px-3 py-1 font-semibold text-ink"><?php mm_e(mm_audience_line($event)); ?></span>
        <span class="px-1 font-semibold text-ink"><?php mm_e($event['price']); ?></span>
        <?php if ($left !== null) : ?>
          <?php if ($left > 0) : ?>
            <span class="rounded-full bg-pink-soft px-3 py-1 font-semibold text-pink"><?php echo (int) $left . ' ' . ($left === 1 ? 'place' : 'places'); ?> left</span>
          <?php else : ?>
            <span class="rounded-full bg-mist px-3 py-1 font-semibold text-muted">Fully booked – join the waiting list</span>
          <?php endif; ?>
        <?php endif; ?>
      </p>
    </div>
    <?php if ($event['coverImage']) : ?>
      <div class="hidden w-44 shrink-0 md:block">
        <div class="photo-frame relative aspect-[4/3] bg-mist">
          <?php mm_fill_img($event['coverImage'], '', 'object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.04]'); ?>
        </div>
      </div>
    <?php endif; ?>
  </a>
<?php }

// A YouTube / Vimeo / .mp4 link -> what the video player needs. Anything else = "none".
function mm_parse_video($url) {
  $link = trim((string) $url);
  if ($link === '' || strpos($link, 'VIDEO_ID_HERE') !== false) return ['kind' => 'none', 'src' => ''];
  if (preg_match('#(?:youtube\.com/(?:watch\?(?:.*&)?v=|embed/|shorts/)|youtu\.be/)([A-Za-z0-9_-]{6,})#', $link, $m)) {
    return ['kind' => 'youtube', 'src' => 'https://www.youtube-nocookie.com/embed/' . $m[1] . '?autoplay=1&rel=0'];
  }
  if (preg_match('#vimeo\.com/(?:video/)?(\d+)#', $link, $m)) {
    return ['kind' => 'vimeo', 'src' => 'https://player.vimeo.com/video/' . $m[1] . '?autoplay=1'];
  }
  if (preg_match('#^(https?://|/)\S+\.(mp4|webm)(\?\S*)?$#i', $link)) return ['kind' => 'file', 'src' => $link];
  return ['kind' => 'none', 'src' => ''];
}

// Text wrapped in *stars* is shown in pink (used for the About lead paragraph)
function mm_highlight($text) {
  foreach (explode('*', (string) $text) as $i => $part) {
    echo $i % 2 === 1 ? '<span class="text-pink">' . esc_html($part) . '</span>' : esc_html($part);
  }
}
