<?php
// Admin > Site settings: the site-wide text and contact details (one WordPress option, "mm_settings").

if (!defined('ABSPATH')) exit;

// Section title => fields (same keys as the old website's Setting table)
function mm_settings_fields() {
  return [
    'Home page' => [
      'heroTagline' => ['label' => 'Hero text (under the big title)', 'type' => 'textarea', 'rows' => 2, 'help' => 'Not shown on the website at the moment — the Tagline (Brochure text) is shown instead.'],
      'introHeading' => ['label' => 'Welcome heading', 'type' => 'text'],
      'introSubtitle' => ['label' => 'Welcome subtitle', 'type' => 'text'],
      'introText' => ['label' => 'Welcome text', 'type' => 'textarea', 'rows' => 5],
    ],
    'Brochure text' => [
      'whoWeAre' => ['label' => 'Who we are', 'type' => 'textarea', 'rows' => 6, 'help' => 'Shown on the home page and the About page. Leave an empty line between paragraphs — the second paragraph is also the intro on the Our work page.'],
      'referralText' => ['label' => 'Referral text', 'type' => 'textarea', 'rows' => 3, 'help' => 'Shown in the pink band on the Our work page and above the contact form.'],
      'tagline' => ['label' => 'Tagline', 'type' => 'text', 'help' => 'Shown under the big title on the home page.'],
      'communityLine' => ['label' => 'Community line', 'type' => 'text', 'help' => 'Shown on the large photo on the Our work page and in the footer.'],
    ],
    'Founder video (/our-founder)' => [
      'founderName' => ['label' => "Founder's name", 'type' => 'text'],
      'founderRole' => ['label' => 'Role', 'type' => 'text'],
      'founderVideoUrl' => ['label' => 'Video link', 'type' => 'url', 'help' => 'Paste a YouTube or Vimeo link, or a link to an .mp4 file.'],
      'founderPhoto' => ['label' => 'Photo (shown before the video plays)', 'type' => 'image'],
      'founderIntro' => ['label' => 'Introduction', 'type' => 'textarea', 'rows' => 3],
      'founderTranscript' => ['label' => 'Transcript', 'type' => 'textarea', 'rows' => 10, 'help' => 'Start a line with [mm:ss] to add a timestamp. Leave an empty line between paragraphs.'],
    ],
    'About page' => [
      'aboutLead' => ['label' => 'Lead paragraph', 'type' => 'textarea', 'rows' => 3, 'help' => 'Words between *stars* are shown in pink.'],
      'aboutStory' => ['label' => 'Our story', 'type' => 'textarea', 'rows' => 5],
      'vision' => ['label' => 'Our vision', 'type' => 'textarea', 'rows' => 4],
      'mission' => ['label' => 'Our mission', 'type' => 'textarea', 'rows' => 10, 'help' => 'Leave an empty line between paragraphs.'],
    ],
    'Contact details' => [
      'address' => ['label' => 'Address', 'type' => 'text'],
      'phone' => ['label' => 'Telephone', 'type' => 'text'],
      'email' => ['label' => 'Email', 'type' => 'text'],
      'pressEmail' => ['label' => 'Press email', 'type' => 'text'],
      'charityNumber' => ['label' => 'Charity number', 'type' => 'text'],
      'donateUrl' => ['label' => 'Donate link 1 (PayPal)', 'type' => 'url'],
      'donateGiveyUrl' => ['label' => 'Donate link 2 (Givey)', 'type' => 'url', 'help' => 'When both links are filled in, the Donate buttons let people choose. Leave one empty to use only the other.'],
      'contactNotifyEmail' => ['label' => 'Contact form email', 'type' => 'text', 'help' => 'We email a copy of every contact form message to this address. Empty = no emails (messages are always saved under Messages).'],
      'bookingNotifyEmail' => ['label' => 'Booking notification email', 'type' => 'text', 'help' => 'Optional: we email this address when someone books a place on an event. Empty = no emails (bookings are always saved under Events > Bookings).'],
    ],
    'Social media (leave empty to hide)' => [
      'tiktokUrl' => ['label' => 'TikTok', 'type' => 'url'],
      'xUrl' => ['label' => 'X (Twitter)', 'type' => 'url'],
      'facebookUrl' => ['label' => 'Facebook', 'type' => 'url'],
      'youtubeUrl' => ['label' => 'YouTube', 'type' => 'url'],
      'instagramUrl' => ['label' => 'Instagram', 'type' => 'url'],
      'linkedinUrl' => ['label' => 'LinkedIn', 'type' => 'url'],
    ],
  ];
}

// All settings as one array (every key is there, empty when not filled in)
function mm_settings() {
  $saved = get_option('mm_settings', []);
  if (!is_array($saved)) $saved = [];
  $all = [];
  foreach (mm_settings_fields() as $fields) {
    foreach ($fields as $key => $field) $all[$key] = isset($saved[$key]) ? (string) $saved[$key] : '';
  }
  return $all;
}

add_action('admin_init', function () {
  register_setting('mm_settings', 'mm_settings', ['type' => 'array', 'sanitize_callback' => 'mm_sanitize_settings']);
});

function mm_sanitize_settings($input) {
  $input = is_array($input) ? $input : [];
  $clean = [];
  foreach (mm_settings_fields() as $fields) {
    foreach ($fields as $key => $field) {
      // (options.php has already unslashed the input)
      $clean[$key] = mm_clean_field($field, isset($input[$key]) ? $input[$key] : '');
    }
  }
  return $clean;
}

add_action('admin_menu', function () {
  add_menu_page('Site settings', 'Site settings', 'manage_options', 'mm-settings', 'mm_settings_page', 'dashicons-admin-home', 20);
});

function mm_settings_page() {
  $settings = mm_settings();
  echo '<div class="wrap mm-settings"><h1>Site settings</h1>';
  echo '<p>The text and contact details used across the website.</p>';
  settings_errors();
  echo '<form method="post" action="options.php">';
  settings_fields('mm_settings');
  foreach (mm_settings_fields() as $section => $fields) {
    echo '<h2>' . esc_html($section) . '</h2><table class="form-table mm-fields" role="presentation"><tbody>';
    foreach ($fields as $key => $field) {
      mm_field_row('mm_settings[' . $key . ']', 'mm_setting_' . $key, $field, $settings[$key]);
    }
    echo '</tbody></table>';
  }
  submit_button('Save settings');
  echo '</form></div>';
}
