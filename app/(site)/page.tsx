import Link from "next/link";
import { getSettings, getServices, getValues, getPress, getPosts, getFunders, formatDate } from "@/lib/db";
import { HeroRing, Reveal, CountUp } from "@/components/Motion";

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

export default function HomePage() {
  const settings = getSettings();
  const services = getServices();
  const values = getValues();
  const press = getPress().slice(0, 3);
  const posts = getPosts().slice(0, 2);
  const logos = getFunders().filter((f) => f.showLogo && f.logo);
  const yearsActive = new Date().getFullYear() - 2010;

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
              <p className="mt-8 max-w-lg text-lg leading-relaxed text-muted">{settings.heroTagline}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/our-work"
                  className="rounded-full bg-ink px-6 py-3.5 font-semibold text-white transition-colors hover:bg-pink"
                >
                  See our work
                </Link>
                <a
                  href={settings.donateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border-2 border-pink px-6 py-3 font-semibold text-pink transition-colors hover:bg-pink hover:text-white"
                >
                  Donate to our work
                </a>
              </div>
            </Reveal>
          </div>
          <div className="flex justify-center md:justify-end">
            <HeroRing words={values.map((v) => v.title)} />
          </div>
        </div>
      </section>

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
              <p className="text-lg leading-relaxed text-muted">{settings.introText}</p>
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

      {/* ---------- Facts ---------- */}
      <section className="border-b border-mist">
        <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-y-10 px-4 py-16 sm:px-6 lg:grid-cols-4">
          <div className="flex flex-col-reverse gap-1 pr-4">
            <dt className="text-muted">Years serving the community</dt>
            <dd className="font-display text-5xl font-bold text-ink">
              <CountUp to={yearsActive} suffix="+" />
            </dd>
          </div>
          <div className="flex flex-col-reverse gap-1 pr-4">
            <dt className="text-muted">Teachers trained in safeguarding</dt>
            <dd className="font-display text-5xl font-bold text-ink">
              <CountUp to={150} suffix="+" />
            </dd>
          </div>
          <div className="flex flex-col-reverse gap-1 pr-4">
            <dt className="text-muted">Age range of the children we tutor</dt>
            <dd className="font-display text-5xl font-bold text-ink">6–18</dd>
          </div>
          <div className="flex flex-col-reverse gap-1 pr-4">
            <dt className="text-muted">London boroughs we work in</dt>
            <dd className="font-display text-5xl font-bold text-ink">
              <CountUp to={3} />
            </dd>
          </div>
        </dl>
      </section>

      {/* ---------- Our work preview ---------- */}
      <section>
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <Reveal>
              <h2 className="font-display text-5xl font-bold lowercase text-ink sm:text-6xl">our work</h2>
              <p className="mt-3 max-w-xl text-lg text-muted">
                Programmes for children, parents, teachers and professionals — built with the community, for the
                community.
              </p>
            </Reveal>
            <Link href="/our-work" className="font-semibold text-pink underline-offset-4 hover:underline">
              View all programmes
            </Link>
          </div>

          <ul className="mt-12 grid gap-4 md:grid-cols-2">
            {services.map((s, i) => (
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
                    <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-grey/30">
                      {item.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt=""
                          className="h-full w-full object-cover grayscale transition duration-500 group-hover:scale-105 group-hover:grayscale-0"
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
            <a
              href={settings.donateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-white px-6 py-3.5 font-semibold text-pink transition-colors hover:bg-plum hover:text-white"
            >
              Donate
            </a>
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
