<?php
if (!defined('ABSPATH')) exit;
// /our-founder: the founder video, its transcript and a call to action.
// All text on this page is edited in Site settings → Founder video.

$transcript = mm_paragraphs(mm_setting('founderTranscript'));
$is_placeholder = strpos(mm_setting('founderTranscript'), '[Placeholder') !== false;
$name = mm_setting('founderName');
$name_and_role = implode(' — ', array_filter([$name, mm_setting('founderRole')], 'strlen'));
$video = mm_parse_video(mm_setting('founderVideoUrl'));
$can_play = $video['kind'] !== 'none';
$poster = mm_setting('founderPhoto');
$intro = mm_setting('founderIntro');
$title = $name . ' on Minority Matters';

// A paragraph that starts with [mm:ss] shows the time as a small pink pill
function mm_transcript_paragraph($text) {
  if (preg_match('/^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*([\s\S]*)$/', $text, $m)) {
    echo '<p class="flex items-start gap-3 text-lg leading-relaxed text-ink"><span class="mt-1 shrink-0 rounded-full bg-pink-soft px-2.5 py-0.5 font-mono text-sm font-semibold text-pink">' . esc_html($m[1]) . '</span><span>' . esc_html($m[2]) . '</span></p>';
  } else {
    echo '<p class="text-lg leading-relaxed text-ink">' . esc_html($text) . '</p>';
  }
}

get_header();
mm_page_header('our founder', $name_and_role, 0.55);
?>

<!-- ---------- Video: a photo with a play button; the real player only loads after clicking ---------- -->
<section class="mx-auto max-w-5xl px-4 pt-12 sm:px-6 sm:pt-16">
  <div class="relative aspect-video" data-video data-kind="<?php echo esc_attr($video['kind']); ?>" data-src="<?php echo esc_url($video['src']); ?>" data-title="<?php echo esc_attr($title); ?>">
    <div class="absolute inset-0" data-video-poster>
      <?php // The photo + tint fade out in an oval (.feather-oval); the play button on top stays sharp ?>
      <div class="feather-oval absolute inset-0" aria-hidden="true">
        <?php if ($poster) mm_fill_img($poster, '', 'object-cover', true); ?>
        <div class="absolute inset-0 bg-plum/55"></div>
      </div>
      <div class="absolute inset-0 flex items-center justify-center">
        <button type="button" data-video-play<?php echo $can_play ? ' aria-label="' . esc_attr('Play video: ' . $title) . '"' : ' disabled'; ?> class="group flex flex-col items-center gap-4 rounded-full text-white focus-visible:outline-white disabled:cursor-not-allowed">
          <span class="relative flex h-28 w-28 items-center justify-center sm:h-36 sm:w-36">
            <?php mm_play_ring(true); ?>
            <span class="flex h-20 w-20 items-center justify-center rounded-full bg-pink pl-1 shadow-lg transition sm:h-24 sm:w-24 <?php echo $can_play ? 'group-hover:scale-105 group-hover:bg-pink-dark' : 'opacity-60'; ?>">
              <?php mm_play_icon('h-9 w-9 sm:h-11 sm:w-11'); ?>
            </span>
          </span>
          <?php if (!$can_play) : ?><span class="rounded-full bg-plum/70 px-4 py-1.5 text-sm font-semibold">Video coming soon</span><?php endif; ?>
        </button>
      </div>
    </div>
  </div>

  <div class="mt-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
    <?php if ($intro) : ?>
      <p class="max-w-3xl font-display text-2xl leading-snug text-ink sm:text-3xl"><?php mm_e($intro); ?></p>
    <?php endif; ?>
    <div class="shrink-0">
      <button type="button" data-share class="inline-flex items-center gap-2 rounded-full border-2 border-ink px-5 py-2.5 font-semibold text-ink transition-colors hover:border-pink hover:bg-pink hover:text-white">
        <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M10 14a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1 1M14 10a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1-1" stroke-linecap="round"/></svg>
        <span aria-live="polite">Share this video</span>
      </button>
    </div>
  </div>
</section>

<?php if ($transcript) : ?>
  <!-- ---------- Transcript: the first 3 paragraphs, then "Read full transcript" ---------- -->
  <section class="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="transcript-title">
    <div class="max-w-3xl rounded-[2rem] bg-mist p-7 sm:p-10">
      <h2 id="transcript-title" class="font-display text-3xl font-bold">Transcript</h2>
      <?php if ($is_placeholder) : ?><p class="mt-2 text-sm text-muted">Transcript coming soon.</p><?php endif; ?>
      <div class="mt-6">
        <div class="space-y-4">
          <?php foreach (array_slice($transcript, 0, 3) as $p) mm_transcript_paragraph($p); ?>
        </div>
        <?php $rest = array_slice($transcript, 3); if ($rest) : ?>
          <div id="transcript-more" class="mm-collapse" inert>
            <div>
              <div class="space-y-4 pt-4">
                <?php foreach ($rest as $p) mm_transcript_paragraph($p); ?>
              </div>
            </div>
          </div>
          <button type="button" data-toggle="transcript-more" data-open-label="Show less" data-closed-label="Read full transcript" aria-expanded="false" aria-controls="transcript-more" class="mt-6 rounded-full bg-white px-5 py-2.5 font-semibold text-ink shadow-sm transition-colors hover:bg-pink hover:text-white">Read full transcript</button>
        <?php endif; ?>
      </div>
    </div>
  </section>
<?php endif; ?>

<!-- ---------- Call to action (same style as the home page) ---------- -->
<section class="px-4 pb-20 sm:px-6">
  <div<?php echo mm_reveal(); ?>>
    <?php mm_cta(
      'Stand with our community',
      'See the work our founder started, or help it grow with a donation.',
      ['label' => 'See our work', 'href' => mm_url('/our-work')],
      ['label' => 'Donate', 'donate' => true]
    ); ?>
  </div>
</section>

<?php get_footer();
