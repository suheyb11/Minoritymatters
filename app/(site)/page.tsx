import Link from "next/link";
import Image from "next/image";
import {
  getSettings,
  getServices,
  getValues,
  getPress,
  getPosts,
  getFunders,
  getProjects,
  getProjectPeriods,
  getFeaturedProject,
  getNextEvent,
  formatEventDate,
  toProjectCard,
  toStats,
  formatDate,
  toParagraphs,
} from "@/lib/db";
import { donateOptions } from "@/lib/donate";
import { DonateButton } from "@/components/Donate";
import { HeroRing, Reveal, CountUp, PlayIcon, PlayRing, GlowPhoto } from "@/components/Motion";

const pillars = [
  {
    title: "Promotion",
    icon: "/images/icons/promotion.svg",
    text: "We foster social inclusion and encourage community cohesion.",
  },
  {
    title: "Empowerment",
    icon: "/images/icons/empowerment.svg",
    text: "We empower young people to improve their own position by building confidence and a positive self-image.",
  },
  {
    title: "Safeguarding",
    icon: "/images/icons/safeguarding.svg",
    text: "We focus on safeguarding of children in minority communities.",
  },
];

// Refresh at least every 5 minutes, so the "Next event" bar moves on when an event has finished
export const revalidate = 300;

export default async function HomePage() {
  const settings = await getSettings();
  const areas = (await getServices()).filter((s) => s.kind === "area"); // the 5 main service areas
  const whoWeAre = toParagraphs(settings.whoWeAre);
  const values = await getValues();
  const press = (await getPress()).slice(0, 3);
  const posts = (await getPosts()).slice(0, 2);
  const logos = (await getFunders()).filter((f) => f.showLogo && f.logo);

  // ---------- The stats band: 2 fixed numbers + 2 from the newest period's projects ----------
  const latestPeriod = (await getProjectPeriods())[0] ?? "";
  const thisYear = latestPeriod ? await getProjects(latestPeriod) : [];
  const stats = [
    { value: new Date().getFullYear() - 2010, suffix: "+", label: "years serving our community", focus: false },
    {
      value: thisYear.reduce((sum, p) => sum + p.peopleReached, 0),
      suffix: "",
      label: `people took part in ${latestPeriod}`,
      focus: true, // shown in pink
    },
    { value: thisYear.length, suffix: "", label: "projects delivered this year", focus: false },
    { value: 150, suffix: "+", label: "teachers trained in safeguarding", focus: false },
  ].filter((s) => s.value > 0);

  // ---------- The slim "Next event" bar under the hero (hidden when there is no upcoming event) ----------
  const nextEvent = await getNextEvent();

  // ---------- The featured story (chosen in Admin → Projects) ----------
  const story = await getFeaturedProject();
  const storyText = story ? [story.summary, toParagraphs(story.body)[0]].filter(Boolean).join(" ") : "";
  const storyStats = story ? toStats(story.stats).slice(0, 3) : [];

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-12 sm:px-6 md:grid-cols-[1.2fr_1fr] md:pt-20">
          <div>
            <Reveal>
              <p className="font-display text-2xl font-semibold lowercase text-pink sm:text-3xl">welcome to</p>
            </Reveal>
            <Reveal delay={0.15}>
              <h1 className="mt-4 font-display font-bold lowercase leading-[0.82]">
                <span className="block text-[clamp(3.5rem,10vw,7rem)] text-grey">minority</span>
                <span className="block text-[clamp(4.5rem,15vw,11rem)] text-pink">matters</span>
              </h1>
            </Reveal>
            <Reveal delay={0.3}>
              {settings.tagline && (
                <p className="mt-8 max-w-lg text-lg leading-relaxed text-muted">
                  {settings.tagline}
                </p>
              )}
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/our-work"
                  className="rounded-full bg-ink px-6 py-3.5 font-semibold text-white transition-colors hover:bg-pink"
                >
                  See our work
                </Link>
                <DonateButton
                  options={donateOptions(settings)}
                  className="rounded-full border-2 border-pink px-6 py-3 font-semibold text-pink transition-colors hover:bg-pink hover:text-white"
                >
                  Donate to our work
                </DonateButton>
              </div>
            </Reveal>
          </div>
          <div className="flex justify-center md:justify-end">
            <HeroRing words={values.map((v) => v.title)} />
          </div>
        </div>
      </section>

      {/* ---------- Next event: one line that links to the event (wraps to two lines on phones) ---------- */}
      {nextEvent && (
        <aside aria-label="Next event" className="border-y border-[#e5e3e8]">
          <Link
            href={`/events/${nextEvent.slug}`}
            className="group mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 sm:px-6"
          >
            <span className="min-w-0 flex-1 basis-64">
              <span className="font-semibold text-pink">Next event:</span>{" "}
              <span className="font-semibold text-ink group-hover:text-pink">{nextEvent.title}</span>
              <span className="text-muted">
                {" "}
                · {formatEventDate(nextEvent.startsAt, nextEvent.endsAt)}
                {nextEvent.location && <> · {nextEvent.location}</>}
              </span>
            </span>
            <span className="shrink-0 rounded-full bg-pink px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-pink-dark">
              {nextEvent.bookingType === "none" ? "See details" : "Book a place"}
            </span>
          </Link>
        </aside>
      )}

      {/* ---------- Welcome + three pillars ---------- */}
      <section className="bg-mist">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
            <Reveal>
              <h2 className="font-display text-4xl font-bold leading-tight text-pink sm:text-5xl">
                {settings.introHeading}
              </h2>
              <p className="mt-4 font-display text-2xl leading-snug text-ink/60">{settings.introSubtitle}</p>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-lg leading-relaxed text-ink">{settings.introText}</p>
            </Reveal>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {pillars.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.1}>
                <div className="h-full rounded-3xl bg-white p-8">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.icon} alt="" className="h-20 w-20" />
                  <h3 className="mt-6 font-display text-2xl font-semibold text-pink">{p.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{p.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Stats band ---------- */}
      <section className="border-b border-mist" aria-labelledby="stats-title">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 id="stats-title" className="font-display text-xl font-semibold text-ink">
            Since 2010 in Islington, Camden and Hackney
          </h2>
          <dl className="mt-8 grid grid-cols-2 gap-y-10 lg:grid-cols-4 lg:divide-x lg:divide-[#e5e3e8]">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col-reverse justify-end gap-2 pr-4 lg:px-8 lg:first:pl-0">
                <dt className="text-muted">{s.label}</dt>
                <dd
                  className={`font-display text-5xl font-bold leading-none sm:text-6xl lg:text-7xl ${s.focus ? "text-pink" : "text-ink"}`}
                >
                  <CountUp to={s.value} suffix={s.suffix} />
                </dd>
              </div>
            ))}
          </dl>
          <Link href="/impact" className="mt-10 inline-block font-semibold text-pink underline-offset-4 hover:underline">
            See what we delivered this year
          </Link>
        </div>
      </section>

      {/* ---------- Who we are: text on white + a big feathered photo that links to the founder video ---------- */}
      {whoWeAre.length > 0 && (
        <section className="overflow-x-clip bg-white py-20 lg:py-28" aria-labelledby="who-title">
          <div className="mx-auto grid max-w-7xl items-center gap-6 px-4 sm:px-6 lg:grid-cols-12 lg:gap-8">
            {/* Left: text */}
            <Reveal className="lg:col-span-5">
              <span className="block h-1 w-12 rounded-full bg-pink" aria-hidden="true" />
              <h2 id="who-title" className="mt-6 font-display text-4xl font-bold text-pink md:text-5xl">
                Who we are
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-ink">{whoWeAre[0]}</p>
              {whoWeAre[1] && <p className="mt-4 text-lg leading-relaxed text-ink">{whoWeAre[1]}</p>}
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/our-work"
                  className="rounded-full bg-ink px-6 py-3.5 font-semibold text-white transition-colors hover:bg-pink"
                >
                  See our work
                </Link>
                <Link
                  href="/our-founder"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-pink px-6 py-3 font-semibold text-pink transition-colors hover:bg-pink hover:text-white"
                >
                  <PlayIcon className="h-4 w-4" />
                  Watch our founder
                </Link>
              </div>
            </Reveal>

            {/* Right: big feathered photo; the whole photo is one link to the founder video */}
            <Reveal y={0} scale={0.97} delay={0.1} className="lg:col-span-7 lg:-mr-12">
              <Link
                href="/our-founder"
                aria-label={`Watch: ${settings.founderName} on Minority Matters`}
                className="group relative block"
              >
                <GlowPhoto
                  src={settings.founderPhoto || "/images/photos/hands-together.jpg"}
                  alt="Children's hands stacked together in the middle of a circle, as a sign of teamwork"
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="aspect-[4/3]"
                  imgClassName="transition-transform duration-700 motion-safe:group-hover:scale-[1.03] motion-safe:group-focus-visible:scale-[1.03]"
                />
                <span className="absolute inset-0 m-auto flex h-24 w-24 items-center justify-center" aria-hidden="true">
                  <PlayRing spinOnHover track="#ffffff" width={2} />
                  <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-pink pl-1 text-white shadow-lg">
                    <PlayIcon className="h-7 w-7" />
                  </span>
                </span>
                <span
                  className="absolute bottom-[6%] left-[6%] rounded-full bg-white/80 px-4 py-2 backdrop-blur-sm"
                  aria-hidden="true"
                >
                  <span className="block text-sm text-ink/70">Hear from our founder</span>
                  <span className="block font-semibold leading-tight text-ink">{settings.founderName}</span>
                </span>
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* ---------- Featured story (Admin → Projects → "Feature on the home page") ---------- */}
      {story && (
        <section className="bg-white pb-20 lg:pb-28" aria-labelledby="story-title">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <div className="photo-frame aspect-[4/3] bg-mist">
                {story.coverImage && (
                  <Image
                    src={story.coverImage}
                    alt={toProjectCard(story).coverAlt}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    unoptimized={!story.coverImage.startsWith("/")}
                    className="object-cover"
                  />
                )}
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-sm font-semibold text-pink">Featured story</p>
              <h2 id="story-title" className="mt-2 font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
                {story.featuredHeadline || story.title}
              </h2>
              <p className="mt-5 line-clamp-4 text-lg leading-relaxed text-muted">{storyText}</p>
              {storyStats.length > 0 && (
                <ul className="mt-6 flex flex-wrap gap-2">
                  {storyStats.map((s, i) => (
                    <li key={i} className="flex items-baseline gap-1.5 rounded-full bg-pink-soft px-4 py-2">
                      <span className="font-display text-xl font-bold text-pink">{s.number}</span>
                      <span className="text-sm text-ink">{s.label}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
                <Link
                  href={`/impact/${story.slug}`}
                  className="rounded-full bg-ink px-6 py-3.5 font-semibold text-white transition-colors hover:bg-pink"
                >
                  Read the story
                </Link>
                {thisYear.length > 0 && (
                  <Link href="/impact" className="font-semibold text-pink underline-offset-4 hover:underline">
                    See all {thisYear.length} projects
                  </Link>
                )}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ---------- Our work preview ---------- */}
      <section>
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <Reveal>
              <h2 className="font-display text-5xl font-bold lowercase text-ink sm:text-6xl">our work</h2>
              <p className="mt-3 max-w-xl text-lg text-muted">
                Our five main service areas — built with the community, for the community.
              </p>
            </Reveal>
            <Link href="/our-work" className="font-semibold text-pink underline-offset-4 hover:underline">
              See all our work
            </Link>
          </div>

          <ul className="mt-12 grid gap-4 md:grid-cols-2">
            {areas.map((s, i) => (
              <Reveal key={s.id} delay={Math.min(i * 0.05, 0.25)}>
                <li>
                  <Link
                    href={`/our-work#${s.slug}`}
                    className="group flex h-full items-start gap-5 rounded-2xl border border-mist p-6 transition-colors hover:border-pink hover:bg-pink-soft/40"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.icon} alt="" className="h-12 w-12 shrink-0" />
                    <span>
                      <span className="block font-display text-xl font-semibold leading-snug group-hover:text-pink">
                        {s.title}
                      </span>
                      <span className="mt-1 block text-muted">{s.summary}</span>
                    </span>
                  </Link>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- CCE statement ---------- */}
      <section className="bg-plum text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.5fr_1fr] lg:items-end">
          <Reveal>
            <blockquote className="font-display text-4xl font-semibold leading-tight sm:text-5xl">
              “No child or young person wants to be enslaved, hurt and criminally exploited.”
            </blockquote>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="text-lg leading-relaxed text-white/75">
              We support families whose children have been groomed into county lines, and campaign to change how
              services respond to young victims.
            </p>
            <Link
              href="/our-work#cce-victims-families-support"
              className="mt-6 inline-block rounded-full bg-pink px-6 py-3.5 font-semibold text-white transition-colors hover:bg-white hover:text-pink"
            >
              How we support families
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ---------- Press + blog ---------- */}
      <section className="bg-mist">
        <div className="mx-auto grid max-w-7xl gap-16 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-4xl font-bold lowercase">in the press</h2>
              <Link href="/press" className="font-semibold text-pink underline-offset-4 hover:underline">
                All press
              </Link>
            </div>
            <ul className="mt-8 grid gap-5 sm:grid-cols-3">
              {press.map((item) => (
                <li key={item.id}>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="group block">
                    <div className="photo-frame aspect-[4/3]">
                      {item.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt=""
                          className="h-full w-full object-cover grayscale transition duration-500 group-hover:grayscale-0 motion-safe:group-hover:scale-[1.04]"
                        />
                      )}
                    </div>
                    <p className="mt-3 text-sm font-semibold text-pink">{item.source}</p>
                    <p className="mt-1 font-medium leading-snug group-hover:underline">{item.title}</p>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-4xl font-bold lowercase">from the blog</h2>
              <Link href="/blog" className="font-semibold text-pink underline-offset-4 hover:underline">
                All posts
              </Link>
            </div>
            <ul className="mt-8 space-y-4">
              {posts.map((post) => (
                <li key={post.id}>
                  <Link href={`/blog/${post.slug}`} className="group block rounded-2xl bg-white p-6">
                    <p className="text-sm text-muted">{formatDate(post.publishedAt)}</p>
                    <p className="mt-2 font-display text-xl font-semibold leading-snug group-hover:text-pink">
                      {post.title}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- Funders ---------- */}
      {logos.length > 0 && (
        <section aria-labelledby="funders-title">
          <div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
            <h2 id="funders-title" className="text-center text-sm font-semibold text-pink">
              Supported by our funders and partners
            </h2>
          </div>
          <div className="marquee overflow-hidden py-10">
            <div className="marquee-track flex w-max items-center gap-16">
              {[...logos, ...logos].map((f, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={f.logo}
                  alt={i < logos.length ? f.name : ""}
                  aria-hidden={i >= logos.length}
                  className="h-12 w-auto max-w-[200px] object-contain opacity-80 grayscale transition hover:opacity-100 hover:grayscale-0"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Call to action ---------- */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 rounded-[2rem] bg-pink px-8 py-14 text-white sm:px-14 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-4xl font-bold leading-tight sm:text-5xl">Stand with our community</h2>
            <p className="mt-3 max-w-xl text-lg text-white/85">
              Your donation funds tutoring, parent programmes and support for families affected by exploitation.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <DonateButton
              options={donateOptions(settings)}
              className="rounded-full bg-white px-6 py-3.5 font-semibold text-pink transition-colors hover:bg-plum hover:text-white"
            >
              Donate
            </DonateButton>
            <Link
              href="/contact"
              className="rounded-full border-2 border-white px-6 py-3 font-semibold text-white transition-colors hover:bg-white hover:text-pink"
            >
              Get in touch
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
