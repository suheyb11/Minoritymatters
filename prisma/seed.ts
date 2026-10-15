// Starting content for the database, copied from the current minoritymatters.org.uk website.
// Run it with: npm run db:seed
// WARNING: it deletes everything in the database first, then adds the original content again.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ---------- Start with empty tables ----------
  await prisma.message.deleteMany();
  await prisma.funder.deleteMany();
  await prisma.post.deleteMany();
  await prisma.pressItem.deleteMany();
  await prisma.value.deleteMany();
  await prisma.service.deleteMany();
  await prisma.setting.deleteMany();

  // ---------- Settings ----------
  await prisma.setting.create({ data: {
      id: 1,
      heroTagline:
        "A London charity working with minority communities since 2010 — supporting children's education, empowering parents and keeping young people safe.",
      introHeading: "Welcome to Minority Matters.",
      introSubtitle: "A charity focused on community engagement through educational projects.",
      introText:
        "To work in partnership with communities, to promote social inclusion and child safeguarding. Our objective is to empower young people from isolated communities through engagement projects that empower the parents and inspire the young. We want to ensure young people are able to fulfill their potential. We believe this can be achieved through encouraging the aspirations of the young and giving parents the tools with which they can support their children to succeed through education and access to employment.",
      address: "51 Corker Walk, Andover Estate, London, N7 7RY",
      phone: "0207 272 0039",
      email: "info@minoritymatters.org.uk",
      pressEmail: "media@minoritymatters.org.uk",
      charityNumber: "1160098",
      donateUrl: "https://www.paypal.com/donate/?hosted_button_id=SWYGWYRMF5GJU",
      tiktokUrl: "https://www.tiktok.com/@mm_charity",
      xUrl: "https://x.com/mm_charity",
      facebookUrl: "https://www.facebook.com/MinorityMattersUK/",
      youtubeUrl: "https://www.youtube.com/channel/UC9cpWYZ21KwLKFR8tyaRwNQ",
      aboutLead:
        "*Minority Matters* is a charity that started in 2010 to provide children and young people *educational support*. Our purpose was to ensure that children from disadvantaged backgrounds were *succeeding* academically, so that they could *break the cycle of poverty*.",
      aboutStory:
        "Over the years, our role in the community grew to the point where parents were coming to us for assistance with wide ranging issues. As we were dealing with matters beyond the educational needs of the children, we started to engage with local authorities and our role grew organically beyond educational support. While we have remained true to our grass roots, we now deliver community focused projects to empower parents and increase the safeguarding of children.",
      vision:
        "Minority Matters' vision is: to see a world in which children and young people from black and ethnic minority migrant backgrounds achieve their full potential, are protected from grooming and criminal exploitation and integrate into British society, and are not affected by the economic-socio circumstances they are born into, and/or their postcode.",
      mission: [
        "Our mission is to reduce the impact of educational and employment inequalities, social, economic and geographical disadvantage on black ethnic minority migrant communities, through the provision of tailored support services, advice and advocacy, representation and a safe trusted space, led by the community in which they can trust.",
        "Our aim is to work in partnership with communities, to promote social inclusion, child safeguarding and increased engagement with voluntary and statutory services.",
        "In addition, we utilise professional and personal experiences to influence available statutory service delivery and the creation of new ones, such as those responding to the issues of grooming and criminal exploitation of children and young people.",
        "Minority Matters continues to assess community needs by developing programmes that will ensure parents are empowered and equipped with the skills and tools they need to better help, safeguard and protect their family. We want families to seek and find trusted community led provision/support available locally and foster communication so that cultural barriers are reduced. We provide tailor-made services and capacity built by the community for the community. We seek the reduction of gaps between statutory bodies and hard to reach communities, building trust on both sides and access to services, as well as bringing about positive changes.",
      ].join("\n\n"),
  } });

  // ---------- Our work (services) ----------
  const services = [
    {
      title: "Educational support, activities and career advice",
      slug: "educational-support",
      summary: "Core-subject tutoring for children aged 6–18, career advice, mentoring and holiday activities.",
      icon: "/images/icons/education.svg",
      intro: "Positive Alternative – Minority Matters Enriched-Educational Programme:",
      points: [
        "Core subjects support for BAME children 6-18 years old, term time by qualified experienced tutors. Personalised support, identifying the academic level and support requirement of each student",
        "Self-development, Employment & Career advice, CV and personal statement",
        "Personal growth and development, team and confidence building",
        "Cultural events, outings and fun activities during school holidays",
        "Mentoring, volunteering, internship and work experience support",
      ],
      outro: "",
    },
    {
      title: "Child Criminal Exploitation (CCE) Victims & Families support",
      slug: "cce-victims-families-support",
      summary: "A first point of contact for families whose children have been groomed and exploited into county lines.",
      icon: "/images/icons/safeguarding.svg",
      intro:
        "Minority Matters has been working with children and young people groomed and criminally exploited into running county lines. Our work is focused on:",
      points: [
        "Being a first contact point for affected families from hard to reach communities",
        "Linking families with local authorities for safeguarding support",
        "Reporting missing children and young people",
        "Joining family and community search parties for missing children",
        "Booking and arranging prison visits for parents",
        "Acting as Appropriate Adult for children and young adults",
        "Raising awareness of child criminal exploitations with parents",
        "Speaking at conferences for healthcare providers and other professionals, raising awareness of the issue and giving insights into how it affects hard to reach communities",
        "Building capacity of those working with affected children and young people",
        "Campaigning for changes to the law to better protect children and young people against CCE",
        "Lobbying the police, local authorities and government to end CCE",
      ],
      outro: [
        "As a charity working with hard to reach communities, we have unique insights into the loopholes used to target children and young adults from these communities, in order to criminally exploit them. We not only work closely with parents, but advocate for them to ensure their voices are heard by decision-makers. Beyond that, we work hard to change professional misconceptions about CCE, which affect the way services are delivered to young victims.",
        "We refuse to accept that children and young people want to be victimised, which is what the accepted narrative about CCE points to. No child or young person wants to be enslaved, hurt and criminally exploited.",
      ].join("\n\n"),
    },
    {
      title: "Professionals workshops, support and community engagements",
      slug: "professionals-workshops",
      summary: "Workshops and meetings that connect professionals with the real experiences of families.",
      icon: "/images/icons/engagement.svg",
      intro: "",
      points: [
        "Workshops giving an insight of real service user experiences, barriers, challenges and impact",
        "Create opportunities for dialogue and improved outcomes",
        "Organise meetings & coffee morning, for direct engagement",
        "Sign-post existing services, identifying gaps & making services accessible",
      ],
      outro: "",
    },
    {
      title: "Campaign against the criminal grooming and exploitation of children & young people",
      slug: "campaign-against-cce",
      summary: "Gathering evidence and amplifying parents' voices to change the law.",
      icon: "/images/icons/minorities-matter.svg",
      intro: "",
      points: [
        "Gathering information and evidence from affected families",
        "Amplifying the voices of parents with decision-makers",
        "Campaigning for legislation that better protects victims of criminal grooming and exploitation",
      ],
      outro: "",
    },
    {
      title: "Community Parent Champions Programme",
      slug: "community-parent-champions",
      summary: "Personal development classes for parents and joint workshops with Islington Council.",
      icon: "/images/icons/empowerment.svg",
      intro: "",
      points: [
        "10–14 week personal development classes for parents",
        "Joint workshops with Islington Council on local services and child safety",
      ],
      outro: "",
    },
    {
      title: "Muslim Community Engagement",
      slug: "muslim-community-engagement",
      summary: "Safeguarding training for supplementary school and madrasah teachers since 2015.",
      icon: "/images/icons/community-spirit.svg",
      intro: "",
      points: [
        "Since 2015, safeguarding training for supplementary school and madrasah teachers in Camden, Hackney and Islington",
        "Workshops for parents",
        "Prevent training delivered from a community perspective",
        "Over 150 teachers trained",
      ],
      outro: "",
    },
    {
      title: "Claim Your Future",
      slug: "claim-your-future",
      summary: "A 16-week motivational course for Somali parents and children.",
      icon: "/images/icons/aspiration.svg",
      intro: "A 16-week motivational course for Somali parents and children, covering:",
      points: [
        "Confidence building",
        "Communication",
        "Stress management",
        "Goal-setting",
        "Leadership",
        "Time management",
        "Organisational and character skills",
      ],
      outro: "",
    },
  ];

  for (let i = 0; i < services.length; i++) {
    const s = services[i];
    await prisma.service.create({ data: { ...s, points: s.points.join("\n"), sortOrder: i + 1 } });
  }

  // ---------- Values ----------
  const values = [
    ["Empowerment", "empowerment", "A well-informed community is a strong community. When communities are aware of the services available, they can make use of them, and contribute in ensuring that these services become tailored to their needs."],
    ["Engagement", "engagement", "The first step of empowering a community is ensuring that it has access to local service providers. Our programmes are designed to bring together the community with organisations, the police and local authorities."],
    ["Community spirit", "community-spirit", "We want community members to be talking to each other and to the police and local authorities. This will ensure an open an honest exchange of ideas and ensure that they get the most out of our projects."],
    ["Equal opportunities", "equal-opportunities", "We work with often-isolated communities, who have the potential to contribute so much to wider society but aren't engaged with. We believe that everyone deserves the right to self-determination and we want to give people the tools to engage with the wider society."],
    ["Aspiration", "aspiration", "Many families worry about the challenges faced by their children, and our charity strives to ensure these children have a great future ahead of them. We want to expose young people to the various options for their futures and teach them commitment to achieving their goals."],
    ["Education", "education", "We run tuition classes focused on core subjects, to ensure that the children we work with do well in school. Success in educational setting will not only increase self-confidence, but we encourage these children to think beyond their GCSEs and A-levels, to who they want to be."],
    ["Safeguarding", "safeguarding", "We work together with local communities, the police and social services to promote safeguarding of children. We want to ensure that all stakeholders in child-safety work together to create a safe environment for children to live, learn and play in."],
    ["Minorities matter", "minorities-matter", "Minority communities are under-represented in the decision making process when it comes to consulting stakeholders in policymaking. We encourage contributions from minority communities so that services are used by those hard to reach community members who wouldn't otherwise engage with authorities."],
    ["Expanding horizons", "expanding-horizons", "Our ultimate goal is to ensure that minority communities enjoy the same benefits as communities who are more engaged and involved in decision making at the local level."],
  ];
  for (let i = 0; i < values.length; i++) {
    await prisma.value.create({ data: { title: values[i][0], icon: `/images/icons/${values[i][1]}.svg`, text: values[i][2], sortOrder: i + 1 } });
  }

  // ---------- Press ----------
  const img = "https://minoritymatters.org.uk/wp-content/uploads/2021/04/";
  const press = [
    ["What 'County Lines' Is And How It Works", "HuffPost UK", "https://www.huffingtonpost.co.uk/entry/county-lines-how-drug-dealing-works-in-uk_uk_6033d072c5b66da5dba32b2c", img + "5.png"],
    ["'Your Dealer Is Nearby' – How Drugs Are Delivered To Your Doorstep", "HuffPost UK", "https://www.huffingtonpost.co.uk/entry/county-lines-drug-dealer-prices-street-value_uk_6033cc5ec5b66dfc10205933", img + "6.png"],
    ["Drug Gangs Are Stealing Children From Loving Families – Even In Lockdown", "HuffPost UK", "https://www.huffingtonpost.co.uk/entry/county-lines-child-trafficking-minority-matters_uk_6033cc03c5b673b19b6a12f5", img + "7.png"],
    ["Black people are going missing in vast numbers - but campaigners say their cases are being ignored", "The Independent", "https://www.independent.co.uk/news/uk/home-news/black-people-missing-b1827530.html", img + "8.png"],
    ["My Son Was Murdered By A County Lines Gang. Why Didn't Police Listen To Me?", "HuffPost UK", "https://www.huffingtonpost.co.uk/entry/county-lines-police-social-services-gaps_uk_6033d0a8c5b66dfc10205db8", img + "3.png"],
    ["Mothers send sons to Somalia to avoid knife crime", "The Guardian", "https://www.theguardian.com/uk-news/2019/mar/09/british-somalis-send-sons-abroad-to-protect-against-knife-crime", img + "1.png"],
    ["The mums sending their children to Somalia to keep them safe from London gangs", "Channel 4 News", "https://www.channel4.com/news/the-mums-sending-their-children-to-somalia-to-keep-them-safe-from-london-gangs", img + "2.png"],
  ];
  for (let i = 0; i < press.length; i++) {
    await prisma.pressItem.create({ data: { title: press[i][0], source: press[i][1], url: press[i][2], image: press[i][3], sortOrder: i + 1 } });
  }

  // ---------- Blog ----------
  // Only the opening of each original post is included here.
  // Paste the full text of each article from the admin panel (Admin > Blog > Edit).
  await prisma.post.create({ data: {
      title: "Message to London Mayoral Candidates: End Child Criminal Exploitation!",
      slug: "message-to-london-mayoral-candidates-end-child-criminal-exploitation",
      excerpt:
        "“I can't believe this goes on in London”, “I'm so angry at the police, why isn't anyone doing something to stop this”. At Minority Matters, we hear variations of the above on a regular basis.",
      body:
        "“I can't believe this goes on in London”, “I'm so angry at the police, why isn't anyone doing something to stop this”. At Minority Matters, we hear variations of the above on a regular basis. We wouldn't believe it either, had we not experienced it first hand. The “it” being criminal exploitation of children and young people.",
      publishedAt: new Date("2021-04-23"),
  } });
  await prisma.post.create({ data: {
      title: "Finding a new normal for charities",
      slug: "finding-a-new-normal-for-charities",
      author: "Aisha Rhmed",
      excerpt: "The current pandemic poses new challenges for charities.",
      body:
        "The current pandemic poses new challenges for charities. Over the years, we learned the importance of adapting to the needs of our service users. This meant that we operate an open door policy that extended itself to the needs of the communities we served. Oftentimes, people come to us for help and support.",
      publishedAt: new Date("2020-04-23"),
  } });

  // ---------- Funders ----------
  const funders = [
    { name: "Cripplegate Foundation", logo: "/images/funders/cripplegate.jpg", showLogo: true },
    { name: "BA Better World", logo: "/images/funders/ba-better-world.jpg", showLogo: true },
    { name: "Cloudesley", logo: "/images/funders/cloudesley.jpg", showLogo: true },
    { name: "London Violence Reduction Unit, through Islington Council", logo: "/images/funders/vru.png", showLogo: true },
    { name: "Islington Council, through The Mother Tongue and Supplementary Schools Partnership", logo: "/images/funders/islington.jpg", showLogo: true },
    { name: "Institute of Islamic Teachers", logo: "/images/funders/islamic-teachers.png", showLogo: true },
    { name: "The Constable Educational Trust" },
    { name: "City Bridge Trust" },
    { name: "Home Office, through Islington, Camden and Hackney Council" },
    { name: "Mayor's Office for Policing and Crime (MOPAC), through Islington Council" },
    { name: "MOPAC, through Islington's Safer Neighbourhood Board" },
    { name: "Richard Reeves Foundation" },
    { name: "Awards For All" },
  ];
  for (let i = 0; i < funders.length; i++) {
    await prisma.funder.create({ data: { ...funders[i], sortOrder: i + 1 } });
  }

  console.log("Database filled with the starting content.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
