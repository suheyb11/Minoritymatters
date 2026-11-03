<?php
// The fields of every content type. The keys are the same as the column names of the old website's
// database (see prisma/schema.prisma), so the importer can copy them one to one.
// Each field is saved as post meta "mm_<key>". The title, slug, order and published/draft are WordPress's own.
//
// Field types: text, textarea, url, number, checkbox, select, image, gallery, datetime (typed in London time, saved in UTC)

if (!defined('ABSPATH')) exit;

const MM_PROJECT_CATEGORIES = ['Education', 'Youth activities', 'Women & families', 'Employability', 'Welfare & advocacy', 'Community events'];
const MM_EVENT_AUDIENCES = ['Everyone', 'Families', 'Girls', 'Boys', 'Young women', 'Mothers', 'Parents', 'Professionals'];
const MM_REASONS = ['General enquiry', 'Make a referral', 'Advice', 'Press', 'Volunteering'];
const MM_REFERRAL = 'Make a referral';
const MM_BOOKING_STATUSES = ['confirmed', 'waitlist', 'cancelled', 'attended'];

function mm_fields($type) {
  switch ($type) {
    case 'mm_service':
      return [
        'kind' => ['label' => 'Type', 'type' => 'select', 'options' => ['area' => 'Service area (one of the 5 on the home page)', 'programme' => 'Programme (the list that opens and closes)'], 'default' => 'programme'],
        'summary' => ['label' => 'Summary', 'type' => 'textarea', 'rows' => 2],
        'intro' => ['label' => 'Intro', 'type' => 'textarea', 'rows' => 3, 'help' => 'Programmes only: the first paragraph when the programme is opened.'],
        'points' => ['label' => 'Points', 'type' => 'textarea', 'rows' => 8, 'help' => 'One bullet per line.'],
        'outro' => ['label' => 'Closing text', 'type' => 'textarea', 'rows' => 4, 'help' => 'Programmes only. Paragraphs separated by a blank line.'],
        'icon' => ['label' => 'Icon', 'type' => 'image', 'default' => '/images/icons/promotion.svg'],
      ];
    case 'mm_project':
      return [
        'period' => ['label' => 'Period', 'type' => 'text', 'help' => 'For example 2025–26. Projects are grouped by period on the Impact page.'],
        'category' => ['label' => 'Category', 'type' => 'select', 'options' => array_combine(MM_PROJECT_CATEGORIES, MM_PROJECT_CATEGORIES)],
        'summary' => ['label' => 'Summary', 'type' => 'textarea', 'rows' => 2, 'help' => '1–2 sentences, shown on the cards.'],
        'body' => ['label' => 'Story', 'type' => 'textarea', 'rows' => 10, 'help' => 'Paragraphs separated by a blank line.'],
        'stats' => ['label' => 'Numbers', 'type' => 'textarea', 'rows' => 4, 'help' => 'One per line: number|label, for example 93|boys aged 11–16. The first one is shown big on the card.'],
        'peopleReached' => ['label' => 'People reached', 'type' => 'number', 'default' => '0', 'help' => 'Counted in the total on the Impact page. 0 = not counted.'],
        'coverImage' => ['label' => 'Cover photo', 'type' => 'image'],
        'gallery' => ['label' => 'Gallery', 'type' => 'gallery', 'help' => 'One photo per line: address, or address | description.'],
        'relatedService' => ['label' => 'Part of service area', 'type' => 'select', 'options' => 'mm_service_options'],
        'isFeatured' => ['label' => 'Feature on the home page', 'type' => 'checkbox', 'help' => 'Only one project can be featured; ticking this unticks the others.'],
        'featuredHeadline' => ['label' => 'Featured headline', 'type' => 'text', 'help' => 'Optional. The project title is used when empty.'],
      ];
    case 'mm_value':
      return [
        'text' => ['label' => 'Text', 'type' => 'textarea', 'rows' => 3],
        'icon' => ['label' => 'Icon', 'type' => 'image'],
      ];
    case 'mm_press':
      return [
        'source' => ['label' => 'Source', 'type' => 'text', 'help' => 'For example BBC News.'],
        'url' => ['label' => 'Link to the article', 'type' => 'url'],
        'image' => ['label' => 'Image', 'type' => 'image'],
      ];
    case 'mm_funder':
      return [
        'logo' => ['label' => 'Logo', 'type' => 'image'],
        'url' => ['label' => 'Website', 'type' => 'url'],
        'showLogo' => ['label' => 'Show the logo on the home page', 'type' => 'checkbox'],
      ];
    case 'mm_event':
      return [
        'summary' => ['label' => 'Summary', 'type' => 'textarea', 'rows' => 2, 'help' => '1–2 sentences for the cards.'],
        'body' => ['label' => 'Description', 'type' => 'textarea', 'rows' => 8, 'help' => 'Paragraphs separated by a blank line.'],
        'startsAt' => ['label' => 'Starts', 'type' => 'datetime', 'required' => true],
        'endsAt' => ['label' => 'Ends', 'type' => 'datetime'],
        'location' => ['label' => 'Place', 'type' => 'text', 'help' => 'For example Sobell Leisure Centre.'],
        'address' => ['label' => 'Address', 'type' => 'text', 'help' => 'Full address with postcode.'],
        'audience' => ['label' => 'For', 'type' => 'select', 'options' => array_combine(MM_EVENT_AUDIENCES, MM_EVENT_AUDIENCES), 'default' => 'Everyone'],
        'ageMin' => ['label' => 'Youngest age', 'type' => 'number', 'help' => 'Empty = no limit.'],
        'ageMax' => ['label' => 'Oldest age', 'type' => 'number', 'help' => 'Empty = no limit.'],
        'price' => ['label' => 'Price', 'type' => 'text', 'default' => 'Free', 'help' => 'Free text: Free, £2 per child.'],
        'capacity' => ['label' => 'Places', 'type' => 'number', 'help' => 'Empty = unlimited. When full, new bookings go on the waiting list.'],
        'bookingType' => ['label' => 'Booking', 'type' => 'select', 'options' => ['form' => 'Booking form on this website', 'external' => 'Link to another booking page', 'none' => 'No booking needed'], 'default' => 'form'],
        'bookingUrl' => ['label' => 'Booking link', 'type' => 'url', 'help' => 'Only for "Link to another booking page" (Plinth, Eventbrite, Google Form).'],
        'bookingClosesAt' => ['label' => 'Booking closes', 'type' => 'datetime', 'help' => 'Optional.'],
        'coverImage' => ['label' => 'Cover photo', 'type' => 'image'],
        'projectSlug' => ['label' => 'Impact project', 'type' => 'select', 'options' => 'mm_project_options', 'help' => 'Optional: the project this event belongs to.'],
      ];
    case 'post':
      return [
        'author' => ['label' => 'By', 'type' => 'text', 'default' => 'Minority Matters', 'help' => 'The name shown under the title.'],
        'coverImage' => ['label' => 'Cover photo', 'type' => 'image', 'help' => 'Optional. Shown on the blog list and at the top of the post.'],
      ];
    case 'mm_message':
      return [
        'email' => ['label' => 'Email', 'type' => 'text'],
        'phone' => ['label' => 'Phone', 'type' => 'text'],
        'reason' => ['label' => 'Reason', 'type' => 'select', 'options' => array_combine(MM_REASONS, MM_REASONS), 'default' => 'General enquiry'],
        'isRead' => ['label' => 'Read', 'type' => 'checkbox'],
      ];
  }
  return [];
}

// Options for the "Part of service area" select: "" + every service area (slug => title)
function mm_service_options() {
  $options = ['' => '— none —'];
  foreach (mm_rows('mm_service', true) as $s) {
    if ($s['kind'] === 'area') $options[$s['slug']] = $s['title'];
  }
  return $options;
}

// Options for the "Impact project" select on events
function mm_project_options() {
  $options = ['' => '— none —'];
  foreach (mm_rows('mm_project', true) as $p) $options[$p['slug']] = $p['title'] . ($p['period'] ? ' (' . $p['period'] . ')' : '');
  return $options;
}
