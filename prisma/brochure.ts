// Text from the charity's brochure.
// Used by prisma/seed.ts (new databases) and by scripts/brochure-update.ts and
// scripts/founder-seed.ts (the existing database).

export const BROCHURE_SETTINGS = {
  whoWeAre: [
    "Minority Matters was established to tackle poverty, educational and employment inequalities and social isolation. We are a grassroots organisation established and led by representatives of the community we support.",
    "We have a wide mandate in terms of the support we provide, however, we specialise in providing support to vulnerable families with children and young people who are gang-groomed into county lines and at risk of knife crime.",
  ].join("\n\n"),
  referralText:
    "You can make a referral to us, or contact us for advice. We cover many areas of safeguarding, advocacy and engagement. If you're unsure whether we can help, just reach out for a chat.",
  tagline: "Bringing together families, communities & statutory bodies for better results!",
  communityLine: "Strengthening communities by strengthening local services!",
};

// The 5 main service areas (kind = "area"), in this order. One point per line.
export const SERVICE_AREAS = [
  {
    title: "Raising achievement levels through provision of educational support",
    slug: "educational-support",
    icon: "/images/icons/education.svg",
    summary: "Tutoring, exam preparation, trips and mentoring for children and young people.",
    points: [
      "Positive Alternative Programme + Early Intervention",
      "Core subject tutoring sessions for KS1-4 students",
      "SATs, GCSE revision and exam practice",
      "Moving-on, employment and career support",
      "Residential trips, sports and cultural activities",
      "Mentoring and volunteering",
    ],
  },
  {
    title: "Welfare advice & advocacy",
    slug: "welfare-advice-advocacy",
    icon: "/images/icons/safeguarding.svg",
    summary: "A community hub for families, with practical help and someone on their side.",
    points: [
      "Community Hub for families struggling with criminal exploitation",
      "Universal Credit, housing and accessing services",
      "Outreach work to isolated families and supporting with schools, children and adult services",
      "Support families in navigating the criminal justice system",
      "Referrals to appropriate legal representation",
      "Connect families to police and social services",
    ],
  },
  {
    title: "Capacity building and self-development",
    slug: "capacity-building",
    icon: "/images/icons/empowerment.svg",
    summary: "Training, peer support and wellbeing sessions that help parents grow.",
    points: [
      "Empowering parents through self-development training sessions and workshops",
      "Special Mums Programme",
      "Yoga and massage",
      "Peer-to-peer support",
      "Coffee mornings and community meetings",
    ],
  },
  {
    title: "Campaign against criminal grooming and exploitation",
    slug: "campaign-against-cce",
    icon: "/images/icons/minorities-matter.svg",
    summary: "Raising awareness and campaigning for the law to better protect young victims.",
    points: [
      "Raise awareness through TV news piece appearances, commission investigative newspaper articles and community conversations",
      "Campaign for legislative change for better protection of victims of CCE",
      // These two come from the old "Campaign against…" programme, which was merged into this area
      "Gathering information and evidence from affected families",
      "Amplifying the voices of parents with decision-makers",
    ],
  },
  {
    title: "Employability and training",
    slug: "employability-training",
    icon: "/images/icons/aspiration.svg",
    summary: "Courses, certificates and work experience that open doors to employment.",
    points: [
      "IT and technical courses",
      "Nanny and childcare",
      "First aid paediatric certification",
      "CV and higher education assistance",
      "Volunteering and work experience",
    ],
  },
];

// A point from the old campaign programme that says the same as a brochure point,
// so it is not copied into the "Campaign" area when the two are merged.
export const SAME_AS_BROCHURE = [
  "Campaigning for legislation that better protects victims of criminal grooming and exploitation",
];

// The old "Educational support…" programme keeps its text but gets a new name and web address,
// because the "Raising achievement…" area now uses its old address (educational-support).
export const POSITIVE_ALTERNATIVE = {
  title: "Positive Alternative – Enriched Educational Programme",
  slug: "positive-alternative",
};

// Starting text for the "Our founder" video page (/our-founder).
// These are PLACEHOLDERS: no words are put in the founder's mouth. Replace them in
// Admin → Site settings → Founder video once the charity has the real video and transcript.
export const FOUNDER_SETTINGS = {
  founderName: "Our founder",
  founderRole: "Founder, Minority Matters",
  founderPhoto: "/images/photos/hands-together.jpg",
  founderVideoUrl: "https://www.youtube.com/watch?v=VIDEO_ID_HERE", // fake link → the page shows "Video coming soon"
  founderIntro:
    "In this video, our founder talks about why Minority Matters was started in 2010, the families we work with, and why we campaign to protect children from criminal exploitation.",
  founderTranscript: [
    "[Placeholder transcript – replace this with the real words from the video once it is published.]",
    "[00:00] Introduction",
    "[00:30] How Minority Matters started",
    "[01:30] Working with families affected by county lines",
    "[03:00] What we hope to change",
  ].join("\n\n"),
};
