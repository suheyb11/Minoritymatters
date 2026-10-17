"use client";

// Animated pieces used on the public pages (Framer Motion).
// All animations respect the visitor's "reduce motion" setting.

import {
  motion,
  AnimatePresence,
  MotionConfig,
  useReducedMotion,
  useInView,
  animate,
  useScroll,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ProjectCardData } from "@/lib/db"; // only the type: the database code is not sent to the browser

// ---------- Reveal: fades content up when the page opens, or when it scrolls into view ----------
// Content on screen when the page opens fades up with a CSS animation (.reveal-rise in globals.css),
// so it shows even if JavaScript is slow. Content further down fades up when you scroll to it.
// "x" / "y" set where it comes from: x={24} slides in from the right, y={0} only fades.
// "scale" below 1 makes it grow into place (for example scale={0.97}).
export function Reveal({
  children,
  delay = 0,
  className = "",
  x = 0,
  y = 28,
  scale = 1,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  x?: number;
  y?: number;
  scale?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { show, reduce } = useScrollReveal(ref);
  const cssRise = x === 0 && y > 0 && scale === 1; // the CSS fade-up on page load only fits the default "rise"
  return (
    <motion.div
      ref={ref}
      className={`${cssRise ? "reveal-rise" : ""} ${className}`}
      style={{ animationDelay: `${delay}s` }}
      initial={false}
      animate={show ? { opacity: 1, x: 0, y: 0, scale: 1 } : { opacity: 0, x, y, scale }}
      transition={show && !reduce ? { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] } : { duration: 0 }}
    >
      {children}
    </motion.div>
  );
}

// ---------- Ring: the logo circle with the pink arc ----------
// "arc" is how much of the circle is pink (0 to 1). The arc draws itself on load,
// or when "play" becomes true (used to draw it when it scrolls into view).
export function Ring({
  size = 120,
  arc = 0.2,
  stroke = 6,
  className = "",
  play = true,
}: {
  size?: number;
  arc?: number;
  stroke?: number;
  className?: string;
  play?: boolean;
}) {
  const reduce = useReducedMotion();
  const r = 50 - stroke / 2;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#b2b2b2" strokeWidth={stroke} />
      <motion.circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="#e71d73"
        strokeWidth={stroke}
        strokeLinecap="butt"
        transform="rotate(-90 50 50)"
        initial={reduce ? { pathLength: arc } : { pathLength: 0 }}
        animate={{ pathLength: play || reduce ? arc : 0 }}
        transition={{ duration: 1.4, delay: 0.2, ease: [0.65, 0, 0.35, 1] }}
      />
    </svg>
  );
}

// ---------- useScrollReveal: "show this now?" for content that animates in on scroll ----------
// The content is visible in the HTML from the server, so it can always be read, even before
// JavaScript has loaded. Only after the page has loaded do we hide content that is still below
// the screen, and show it again (animated) when it scrolls into view.
// With "reduce motion" switched on, content is never hidden.
function useScrollReveal(ref: React.RefObject<HTMLElement | null>) {
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: "0px 0px -80px 0px" });
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (reduce || !el) return;
    if (el.getBoundingClientRect().top > window.innerHeight) setHidden(true);
  }, [reduce, ref]);

  return { show: !hidden || inView, reduce: Boolean(reduce) };
}

// ---------- HeroRing: the big animated ring on the home page ----------
// The pink arc sweeps around the circle and stops at the logo position,
// while the charity's values change in the middle.
export function HeroRing({ words }: { words: string[] }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce || words.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % words.length), 2600);
    return () => clearInterval(timer);
  }, [reduce, words.length]);

  return (
    <div className="relative aspect-square w-full max-w-[460px]">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <motion.circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="#b2b2b2"
          strokeWidth="2.2"
          initial={reduce ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />
        <motion.g
          style={{ originX: "50px", originY: "50px" }}
          initial={reduce ? false : { rotate: -300 }}
          animate={{ rotate: 0 }}
          transition={{ duration: 2, delay: 0.6, ease: [0.65, 0, 0.35, 1] }}
        >
          <motion.circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="#e71d73"
            strokeWidth="4.5"
            transform="rotate(-90 50 50)"
            initial={reduce ? { pathLength: 0.17 } : { pathLength: 0 }}
            animate={{ pathLength: 0.17 }}
            transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
          />
        </motion.g>
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center px-12 text-center">
        <p className="text-sm text-muted">we stand for</p>
        <div className="relative mt-2 h-14 w-full">
          {/* initial={false}: the first word is visible straight away, even before JavaScript loads */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={words[index]}
              className="absolute inset-0 font-display text-3xl font-semibold text-pink sm:text-4xl"
              initial={reduce ? false : { opacity: 0, y: 16, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -16, filter: "blur(4px)" }}
              transition={{ duration: 0.45 }}
            >
              {words[index]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ---------- CountUp: a number that counts up when it becomes visible ----------
// The real number is in the HTML from the server (so it shows without JavaScript).
// After the page loads, a number that is still below the screen is set to 0 and counts up when you reach it.
export function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [value, setValue] = useState(to);

  useEffect(() => {
    const el = ref.current;
    if (reduce || !el || el.getBoundingClientRect().top <= window.innerHeight) return;
    setValue(0);
    // Safety net: when someone scrolls past very fast, the browser may never report the number as
    // "in view". If it is already above the screen, just show the real number.
    function onScroll() {
      if (el && el.getBoundingClientRect().bottom < 0) {
        setValue(to);
        window.removeEventListener("scroll", onScroll);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [reduce, to]);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, to, {
      duration: 1.6,
      ease: "easeOut",
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduce, to]);

  return (
    <span ref={ref}>
      {value}
      {suffix}
    </span>
  );
}

// ---------- ServiceList: the "Our work" programmes that open and close ----------
type ServiceItem = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  icon: string;
  intro: string;
  points: string[];
  outro: string[];
};

export function ServiceList({ services }: { services: ServiceItem[] }) {
  const reduce = useReducedMotion();
  const [openSlug, setOpenSlug] = useState<string | null>(services[0]?.slug ?? null);

  // If the page was opened with #slug in the address, open that programme
  useEffect(() => {
    const fromHash = window.location.hash.replace("#", "");
    if (fromHash && services.some((s) => s.slug === fromHash)) {
      setOpenSlug(fromHash);
      setTimeout(() => document.getElementById(fromHash)?.scrollIntoView({ block: "start" }), 50);
    }
  }, [services]);

  return (
    <ul className="divide-y divide-grey/50 border-y border-grey/50">
      {services.map((s, i) => {
        const isOpen = openSlug === s.slug;
        return (
          <li
            key={s.id}
            id={s.slug}
            className="reveal-rise scroll-mt-28"
            style={{ animationDelay: `${0.2 + i * 0.07}s` }}
          >
            <button
              type="button"
              onClick={() => setOpenSlug(isOpen ? null : s.slug)}
              aria-expanded={isOpen}
              aria-controls={`panel-${s.slug}`}
              className="group flex w-full items-center gap-5 py-6 text-left sm:gap-8 sm:py-8"
            >
              <span
                className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 transition-colors sm:h-20 sm:w-20 ${
                  isOpen ? "border-pink bg-pink-soft" : "border-grey/60 bg-white group-hover:border-pink"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.icon} alt="" className="h-9 w-9 sm:h-11 sm:w-11" />
              </span>
              <span className="flex-1">
                <span className="block font-display text-xl font-semibold leading-tight text-ink group-hover:text-pink sm:text-2xl">
                  {s.title}
                </span>
                <span className="mt-1 block text-muted">{s.summary}</span>
              </span>
              <motion.span
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.25 }}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-2xl leading-none ${
                  isOpen ? "bg-pink text-white" : "bg-mist text-ink"
                }`}
                aria-hidden="true"
              >
                +
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`panel-${s.slug}`}
                  key="panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: reduce ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pb-10 sm:pl-28">
                    {s.intro && <p className="max-w-3xl text-lg text-ink">{s.intro}</p>}
                    {s.points.length > 0 && (
                      <ul className="mt-5 grid gap-3 md:grid-cols-2">
                        {s.points.map((point, j) => (
                          <motion.li
                            key={j}
                            initial={reduce ? false : { opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: 0.1 + j * 0.04 }}
                            className="flex gap-3 rounded-xl bg-mist p-4 text-[0.95rem] leading-relaxed"
                          >
                            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-pink" aria-hidden="true" />
                            <span>{point}</span>
                          </motion.li>
                        ))}
                      </ul>
                    )}
                    {s.outro.map((p, j) => (
                      <p key={j} className="mt-5 max-w-3xl leading-relaxed text-muted">
                        {p}
                      </p>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}

// ---------- ServiceAreas: the 5 main service areas on the "Our work" page ----------
// Desktop: a sticky menu on the left (the pink dot follows the area you are reading)
// and the area blocks on the right. Mobile: just the blocks.
type AreaItem = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  icon: string;
  points: string[];
  projects: { slug: string; title: string }[]; // "Recent projects" linked to this area
};

export function ServiceAreas({ areas }: { areas: AreaItem[] }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(areas[0]?.slug ?? "");

  // Scroll-spy: the area crossing the middle of the screen is the "active" one
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    for (const area of areas) {
      const el = document.getElementById(area.slug);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [areas]);

  return (
    <div className="lg:grid lg:grid-cols-[17rem_1fr] lg:gap-16">
      <nav aria-label="Service areas" className="hidden lg:block">
        <ul className="sticky top-28 space-y-1">
          {areas.map((area) => {
            const isActive = active === area.slug;
            return (
              <li key={area.id}>
                <a
                  href={`#${area.slug}`}
                  onClick={() => setActive(area.slug)}
                  aria-current={isActive ? "true" : undefined}
                  className={`relative block rounded-xl py-2.5 pl-8 pr-3 text-[0.95rem] leading-snug transition-colors ${
                    isActive ? "font-semibold text-ink" : "text-muted hover:text-ink"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="area-dot"
                      className="absolute left-2.5 top-[1.05rem] h-2.5 w-2.5 rounded-full bg-pink"
                      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                      aria-hidden="true"
                    />
                  )}
                  {area.title}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-6">
        {areas.map((area, i) => (
          <AreaBlock key={area.id} area={area} number={i + 1} />
        ))}
      </div>
    </div>
  );
}

function AreaBlock({ area, number }: { area: AreaItem; number: number }) {
  const ref = useRef<HTMLElement>(null);
  const { show, reduce } = useScrollReveal(ref);

  return (
    <article ref={ref} id={area.slug} className="scroll-mt-28 rounded-[2rem] bg-mist p-7 sm:p-12">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        <div className="relative h-24 w-24 shrink-0">
          <Ring size={96} arc={0.2} stroke={5} play={show} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={area.icon} alt="" className="absolute inset-0 m-auto h-11 w-11" />
        </div>
        <div>
          <p className="font-display text-sm font-semibold text-pink">{String(number).padStart(2, "0")}</p>
          <h3 className="mt-1 font-display text-2xl font-bold leading-tight sm:text-3xl">{area.title}</h3>
          <p className="mt-3 text-lg text-muted">{area.summary}</p>
        </div>
      </div>

      <ul className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {area.points.map((point, j) => (
          <motion.li
            key={j}
            initial={false}
            animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={show && !reduce ? { duration: 0.4, delay: 0.15 + j * 0.05 } : { duration: 0 }}
            className="flex gap-3 leading-relaxed"
          >
            <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-pink" aria-hidden="true" />
            <span>{point}</span>
          </motion.li>
        ))}
      </ul>

      {area.projects.length > 0 && (
        <div className="mt-8 border-t border-grey/40 pt-6">
          <h4 className="font-sans text-sm font-semibold text-ink">Recent projects</h4>
          <ul className="mt-3 flex flex-wrap gap-2">
            {area.projects.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/impact/${p.slug}`}
                  className="inline-block rounded-full bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-pink hover:text-white"
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

// ---------- Small shared pieces ----------

// Photos from our own /images folder are optimised by Next.js. Photos pasted as a full link
// (or uploaded in the admin) are shown as they are, so any link works.
function isOwnImage(src: string) {
  return src.startsWith("/");
}

export function PlayIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
    </svg>
  );
}

// The logo ring around a play button: a grey circle with a pink arc.
// "spin" = always turning slowly; "spinOnHover" = turns while the parent "group" is hovered or focused.
// "track" is the colour of the full circle (grey like the logo, or white on photos).
export function PlayRing({
  spin = false,
  spinOnHover = false,
  track = "#b2b2b2",
  width = 4,
}: {
  spin?: boolean;
  spinOnHover?: boolean;
  track?: string;
  width?: number;
}) {
  const turning = spin
    ? "motion-safe:animate-[spin_8s_linear_infinite]"
    : spinOnHover
      ? "motion-safe:group-hover:animate-[spin_3s_linear_infinite] motion-safe:group-focus-visible:animate-[spin_3s_linear_infinite]"
      : "";
  return (
    <svg viewBox="0 0 100 100" className={`absolute inset-0 h-full w-full ${turning}`} aria-hidden="true">
      <circle cx="50" cy="50" r="46" fill="none" stroke={track} strokeWidth={width} />
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke="#e71d73"
        strokeWidth={width + 1}
        pathLength={100}
        strokeDasharray="22 78"
        transform="rotate(-90 50 50)"
      />
    </svg>
  );
}

// ---------- GrowLine: a thin pink line that grows to 80px when it scrolls into view ----------
export function GrowLine({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const { show, reduce } = useScrollReveal(ref);
  return (
    <motion.span
      ref={ref}
      aria-hidden="true"
      className={`block h-1 bg-pink ${className}`}
      style={{ width: 80 }}
      initial={false}
      animate={{ width: show ? 80 : 0 }}
      transition={show && !reduce ? { duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] } : { duration: 0 }}
    />
  );
}

// ---------- FullBleedBand: the big edge-to-edge photo on the "Our work" page ----------
export function FullBleedBand({ line }: { line: string }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.08, 1]);

  return (
    <section ref={ref} className="relative flex min-h-[60svh] items-end overflow-hidden bg-white lg:min-h-[70svh]">
      {/* Photo + tint + gradient all fade out at the top and bottom (.feather-y), into the white page */}
      <div className="feather-y absolute inset-0">
        {/* The photo is a little taller than the section, so it never shows a gap while it moves */}
        <motion.div className="absolute inset-x-0 -bottom-[10%] -top-[10%]" style={{ y: reduce ? 0 : y, scale: reduce ? 1 : scale }}>
          <Image
            src="/images/photos/group-trip.jpg"
            alt="A large group of young people from Minority Matters smiling and waving on a grassy hilltop on a trip"
            fill
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: "center 60%" }}
          />
        </motion.div>
        {/* Plum tint + gradient from the bottom, so the white text is always easy to read */}
        <div className="absolute inset-0 bg-plum/30" aria-hidden="true" />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(43,15,29,0.9) 0%, rgba(43,15,29,0.72) 40%, rgba(43,15,29,0.3) 70%, rgba(43,15,29,0) 90%)" }}
          aria-hidden="true"
        />
      </div>

      {/* Extra bottom padding keeps the text above the faded bottom edge, where the background is still dark */}
      <div className="relative mx-auto w-full max-w-7xl px-4 pb-28 pt-40 sm:px-6 sm:pb-32">
        <Reveal>
          {line && (
            <h2 className="max-w-[14ch] font-display text-[clamp(2.5rem,7vw,5rem)] font-bold leading-[0.95] text-white">{line}</h2>
          )}
          <GrowLine className="mt-7" />
          <Link
            href="/our-founder"
            className="mt-8 inline-flex items-center gap-3 rounded-full border-2 border-white px-6 py-3 font-semibold text-white transition-colors hover:bg-white hover:text-plum"
          >
            <PlayIcon className="h-4 w-4" />
            Watch our founder&apos;s story
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

// ---------- GlowPhoto: a feathered photo with a soft coloured haze around it ----------
// A blurred copy of the photo sits behind the sharp one and spreads its colours into the page,
// and the sharp photo's edges fade out (.feather in globals.css). Give it a size with "className",
// for example className="aspect-[4/3]". The section around it should use overflow-x-clip.
export function GlowPhoto({
  src,
  alt,
  sizes = "100vw",
  className = "",
  imgClassName = "",
  priority = false,
}: {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
}) {
  const own = isOwnImage(src);
  return (
    <div className={`photo-glow ${className}`}>
      <div className="photo-glow-layer" aria-hidden="true">
        <Image src={src} alt="" fill sizes="320px" quality={30} unoptimized={!own} className="object-cover" />
      </div>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={!own}
        className={`feather object-cover ${imgClassName}`}
      />
    </div>
  );
}

// ---------- FounderTeaser: a small card that links to the founder video page ----------
export function FounderTeaser({ name, photo }: { name: string; photo: string }) {
  return (
    <Link
      href="/our-founder"
      className="group mt-10 flex max-w-md items-center gap-5 rounded-2xl border border-grey/40 bg-white p-3 pr-6 transition hover:border-pink hover:shadow-md"
    >
      <span className="relative aspect-video w-36 shrink-0 overflow-hidden rounded-xl bg-plum sm:w-40">
        {photo && (
          <Image
            src={photo}
            alt=""
            fill
            sizes="160px"
            unoptimized={!isOwnImage(photo)}
            className="object-cover transition duration-500 motion-safe:group-hover:scale-110"
          />
        )}
        <span className="absolute inset-0 bg-plum/35" aria-hidden="true" />
        <span className="absolute inset-0 m-auto flex h-12 w-12 items-center justify-center">
          <PlayRing spinOnHover />
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pink pl-0.5 text-white">
            <PlayIcon className="h-4 w-4" />
          </span>
        </span>
      </span>
      <span>
        <span className="block text-sm font-semibold text-pink">Hear from our founder</span>
        <span className="mt-0.5 block font-display text-xl font-semibold leading-tight text-ink group-hover:text-pink">{name}</span>
      </span>
    </Link>
  );
}

// ---------- VideoPlayer: a photo with a play button; the real player only loads after clicking ----------
type Video = { kind: "youtube" | "vimeo" | "file" | "none"; src: string };

// Turns a YouTube / Vimeo / .mp4 link into something we can play. Anything else = "none".
export function parseVideo(url: string): Video {
  const link = url.trim();
  if (!link || link.includes("VIDEO_ID_HERE")) return { kind: "none", src: "" };

  const youtube = link.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  if (youtube) return { kind: "youtube", src: `https://www.youtube-nocookie.com/embed/${youtube[1]}?autoplay=1&rel=0` };

  const vimeo = link.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { kind: "vimeo", src: `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1` };

  if (/^(https?:\/\/|\/)\S+\.(mp4|webm)(\?\S*)?$/i.test(link)) return { kind: "file", src: link };

  return { kind: "none", src: "" };
}

export function VideoPlayer({ url, poster, name }: { url: string; poster: string; name: string }) {
  const video = parseVideo(url);
  const canPlay = video.kind !== "none";
  const reduce = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const title = `${name} on Minority Matters`;

  return (
    // While the photo shows, the box is see-through so the oval fades into the page; the playing video gets a normal dark box
    <div className={`relative aspect-video ${playing && canPlay ? "overflow-hidden rounded-3xl bg-black" : ""}`}>
      <AnimatePresence initial={false} mode="wait">
        {playing && canPlay ? (
          <motion.div
            key="player"
            className="absolute inset-0"
            initial={reduce ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {video.kind === "file" ? (
              <video src={video.src} controls autoPlay playsInline title={title} className="h-full w-full bg-black" />
            ) : (
              <iframe
                src={video.src}
                title={title}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="h-full w-full border-0"
              />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="poster"
            className="absolute inset-0"
            exit={reduce ? undefined : { opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            {/* The photo + tint fade out in an oval (.feather-oval); the play button on top stays sharp */}
            <div className="feather-oval absolute inset-0" aria-hidden="true">
              {poster && (
                <Image
                  src={poster}
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 1024px) 1024px, 100vw"
                  unoptimized={!isOwnImage(poster)}
                  className="object-cover"
                />
              )}
              <div className="absolute inset-0 bg-plum/55" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                type="button"
                onClick={() => setPlaying(true)}
                disabled={!canPlay}
                aria-label={canPlay ? `Play video: ${title}` : undefined}
                className="group flex flex-col items-center gap-4 rounded-full text-white focus-visible:outline-white disabled:cursor-not-allowed"
              >
                <span className="relative flex h-28 w-28 items-center justify-center sm:h-36 sm:w-36">
                  <PlayRing spin />
                  <span
                    className={`flex h-20 w-20 items-center justify-center rounded-full bg-pink pl-1 shadow-lg transition sm:h-24 sm:w-24 ${
                      canPlay ? "group-hover:scale-105 group-hover:bg-pink-dark" : "opacity-60"
                    }`}
                  >
                    <PlayIcon className="h-9 w-9 sm:h-11 sm:w-11" />
                  </span>
                </span>
                {!canPlay && <span className="rounded-full bg-plum/70 px-4 py-1.5 text-sm font-semibold">Video coming soon</span>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- Transcript: the first 3 paragraphs, then "Read full transcript" ----------
// A paragraph that starts with [mm:ss] shows the time as a small pink pill.
function TranscriptParagraph({ text }: { text: string }) {
  const match = text.match(/^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*([\s\S]*)$/);
  if (!match) return <p className="text-lg leading-relaxed text-ink">{text}</p>;
  return (
    <p className="flex items-start gap-3 text-lg leading-relaxed text-ink">
      <span className="mt-1 shrink-0 rounded-full bg-pink-soft px-2.5 py-0.5 font-mono text-sm font-semibold text-pink">
        {match[1]}
      </span>
      <span>{match[2]}</span>
    </p>
  );
}

export function Transcript({ paragraphs }: { paragraphs: string[] }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const first = paragraphs.slice(0, 3);
  const rest = paragraphs.slice(3);

  return (
    <div>
      <div className="space-y-4">
        {first.map((p, i) => (
          <TranscriptParagraph key={i} text={p} />
        ))}
      </div>
      <AnimatePresence initial={false}>
        {open && rest.length > 0 && (
          <motion.div
            id="transcript-more"
            key="more"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pt-4">
              {rest.map((p, i) => (
                <TranscriptParagraph key={i} text={p} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {rest.length > 0 && (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="transcript-more"
          className="mt-6 rounded-full bg-white px-5 py-2.5 font-semibold text-ink shadow-sm transition-colors hover:bg-pink hover:text-white"
        >
          {open ? "Show less" : "Read full transcript"}
        </button>
      )}
    </div>
  );
}

// ---------- ShareButton: copies the page address ----------
export function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Some browsers block the clipboard: show the link so it can be copied by hand
      window.prompt("Copy this link:", window.location.href);
    }
  }

  return (
    <button
      type="button"
      onClick={copyLink}
      className="inline-flex items-center gap-2 rounded-full border-2 border-ink px-5 py-2.5 font-semibold text-ink transition-colors hover:border-pink hover:bg-pink hover:text-white"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
        <path
          d="M10 14a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1 1M14 10a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1-1"
          strokeLinecap="round"
        />
      </svg>
      <span aria-live="polite">{copied ? "Link copied" : "Share this video"}</span>
    </button>
  );
}

// ---------- ProjectCard: one project on the Impact page and the home page ----------
// The whole card is one link. The photo sits in a grey frame (.photo-frame) and zooms a little on hover.
export function ProjectCard({ project }: { project: ProjectCardData }) {
  return (
    <Link href={`/impact/${project.slug}`} className="group block h-full">
      <div className="photo-frame aspect-[4/3] bg-mist">
        {project.coverImage && (
          <Image
            src={project.coverImage}
            alt={project.coverAlt}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 100vw"
            unoptimized={!isOwnImage(project.coverImage)}
            className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.04]"
          />
        )}
      </div>
      <p className="mt-4 text-sm font-semibold text-pink">{project.category}</p>
      <h3 className="mt-1 font-display text-2xl font-semibold leading-tight text-ink group-hover:text-pink">{project.title}</h3>
      <p className="mt-2 leading-relaxed text-muted">{project.summary}</p>
      {project.stat && (
        <p className="mt-4 flex items-baseline gap-2">
          <span className="font-display text-4xl font-bold text-pink">{project.stat.number}</span>
          <span className="text-sm text-muted">{project.stat.label}</span>
        </p>
      )}
    </Link>
  );
}

// ---------- ImpactExplorer: the /impact page (year switcher, big total, category filter, project grid) ----------
type Highlight = { number: string; label: string; slug: string; title: string };
type PeriodData = { period: string; projects: ProjectCardData[]; highlights: Highlight[] };

export function ImpactExplorer({ periods, categories }: { periods: PeriodData[]; categories: string[] }) {
  const [period, setPeriod] = useState(periods[0]?.period ?? "");
  const [category, setCategory] = useState("All");
  const [filtered, setFiltered] = useState(false); // after the first filter click, cards no longer stagger in
  const gridRef = useRef<HTMLUListElement>(null);
  const { show } = useScrollReveal(gridRef);

  // The newest period is shown first; /impact?period=2024–25 opens another one
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("period");
    if (fromUrl && periods.some((p) => p.period === fromUrl)) setPeriod(fromUrl);
  }, [periods]);

  const current = periods.find((p) => p.period === period) ?? periods[0];
  if (!current) return <p className="text-lg text-muted">Projects will appear here soon.</p>;

  const total = current.projects.reduce((sum, p) => sum + p.peopleReached, 0);
  const chips = ["All", ...categories.filter((c) => current.projects.some((p) => p.category === c))];
  const visible = category === "All" ? current.projects : current.projects.filter((p) => p.category === category);

  function choosePeriod(p: string) {
    setPeriod(p);
    setCategory("All");
    setFiltered(true);
    window.history.replaceState(null, "", `?period=${encodeURIComponent(p)}`);
  }

  return (
    // reducedMotion="user": with "reduce motion" switched on, cards fade but don't move or slide
    <MotionConfig reducedMotion="user">
      {periods.length > 1 && (
        <div role="group" aria-label="Choose a year" className="mb-12 flex flex-wrap gap-2">
          {periods.map((p) => (
            <button
              key={p.period}
              type="button"
              onClick={() => choosePeriod(p.period)}
              aria-pressed={p.period === current.period}
              className={`rounded-full px-5 py-2.5 font-semibold transition-colors ${
                p.period === current.period ? "bg-ink text-white" : "bg-mist text-ink hover:bg-pink-soft"
              }`}
            >
              {p.period}
            </button>
          ))}
        </div>
      )}

      {/* ---------- The big total ---------- */}
      <section aria-labelledby="total-title" className="grid gap-12 border-b border-grey/40 pb-16 lg:grid-cols-[1.1fr_1fr] lg:items-end">
        <h2 id="total-title" className="sr-only">
          {current.period} in numbers
        </h2>
        <div>
          <p className="font-display text-[clamp(5rem,16vw,10rem)] font-bold leading-[0.85] text-pink">
            <CountUp key={current.period} to={total} />
          </p>
          <p className="mt-4 font-display text-3xl font-semibold text-ink">people taking part</p>
          <p className="mt-1 text-lg text-muted">in {current.period}</p>
          <p className="mt-4 max-w-md text-sm text-muted">Counted per project; some people joined more than one project.</p>
        </div>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-10">
          <div className="flex flex-col-reverse gap-1">
            <dt className="text-muted">projects delivered</dt>
            <dd className="font-display text-5xl font-bold text-ink">
              <CountUp key={current.period} to={current.projects.length} />
            </dd>
          </div>
          {current.highlights.map((h) => (
            <div key={h.slug} className="flex flex-col-reverse gap-1">
              <dt className="text-muted">
                {h.label}
                <Link href={`/impact/${h.slug}`} className="mt-0.5 block text-sm font-semibold text-pink hover:underline">
                  {h.title}
                </Link>
              </dt>
              <dd className="font-display text-5xl font-bold text-ink">
                {/^\d+$/.test(h.number) ? <CountUp key={current.period} to={Number(h.number)} /> : h.number}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---------- Category filter + project grid ---------- */}
      <section aria-labelledby="projects-title" className="pt-16">
        <h2 id="projects-title" className="font-display text-4xl font-bold lowercase sm:text-5xl">
          our projects
        </h2>
        <div role="group" aria-label="Filter projects by category" className="mt-6 flex flex-wrap gap-2">
          {chips.map((c) => {
            const active = c === category;
            return (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setCategory(c);
                  setFiltered(true);
                }}
                aria-pressed={active}
                className={`relative rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  active ? "text-white" : "bg-mist text-ink hover:bg-pink-soft"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="category-pill"
                    className="absolute inset-0 rounded-full bg-pink"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    aria-hidden="true"
                  />
                )}
                <span className="relative">{c}</span>
              </button>
            );
          })}
        </div>
        <p className="sr-only" aria-live="polite">
          {visible.length} {visible.length === 1 ? "project" : "projects"} shown
        </p>

        <ul ref={gridRef} className="relative mt-10 grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((p, i) => (
              <motion.li
                key={p.slug}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={show ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 24, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={
                  show
                    ? { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: filtered ? 0 : Math.min(i, 8) * 0.06 }
                    : { duration: 0 }
                }
              >
                <ProjectCard project={p} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </section>
    </MotionConfig>
  );
}

// ---------- ProjectGallery: photos in columns; clicking one opens it big (a "lightbox") ----------
// In the lightbox: arrow keys or the buttons go to the next/previous photo, Esc closes it,
// Tab stays inside the lightbox, and on close the focus goes back to the photo you clicked.
export function ProjectGallery({ images }: { images: { src: string; alt: string }[] }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState<number | null>(null);
  const open = index !== null;
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);
  const openedFrom = useRef(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const count = images.length;

  function openAt(i: number) {
    openedFrom.current = i;
    setIndex(i);
  }
  function close() {
    setIndex(null);
    triggers.current[openedFrom.current]?.focus();
  }
  function step(direction: number) {
    setIndex((i) => (i === null ? i : (i + direction + count) % count));
  }

  // While the lightbox is open: keyboard keys, focus trap, and no page scrolling behind it
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    closeRef.current?.focus();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setIndex(null);
        triggers.current[openedFrom.current]?.focus();
      } else if (e.key === "ArrowRight") {
        setIndex((i) => (i === null ? i : (i + 1) % count));
      } else if (e.key === "ArrowLeft") {
        setIndex((i) => (i === null ? i : (i - 1 + count) % count));
      } else if (e.key === "Tab" && dialog) {
        const buttons = Array.from(dialog.querySelectorAll<HTMLElement>("button"));
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (!dialog.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = oldOverflow;
    };
  }, [open, count]);

  const current = index !== null ? images[index] : null;

  return (
    <>
      <ul className="columns-1 gap-6 sm:columns-2 lg:columns-3">
        {images.map((img, i) => (
          <li key={img.src + i} className="mb-6 break-inside-avoid">
            <button
              ref={(el) => {
                triggers.current[i] = el;
              }}
              type="button"
              onClick={() => openAt(i)}
              aria-label={`Open photo ${i + 1} of ${count}: ${img.alt}`}
              className="group block w-full cursor-zoom-in rounded-2xl"
            >
              <span className="photo-frame block">
                <Image
                  src={img.src}
                  alt=""
                  width={1200}
                  height={900}
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                  unoptimized={!isOwnImage(img.src)}
                  className="block h-auto w-full transition-transform duration-500 motion-safe:group-hover:scale-[1.04]"
                />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {current && index !== null && (
          <motion.div
            key="lightbox"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Photo ${index + 1} of ${count}`}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-plum/95 px-4 py-16 text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) close(); // a click on the dark background closes it
            }}
          >
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl transition-colors hover:bg-pink focus-visible:outline-white"
            >
              ×
            </button>

            {/* The photo itself: no faded edges here, so the whole picture is visible */}
            <motion.div
              key={index}
              className="relative h-[70vh] w-full max-w-5xl"
              initial={reduce ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <Image
                src={current.src}
                alt={current.alt}
                fill
                sizes="(min-width: 1024px) 1024px, 100vw"
                unoptimized={!isOwnImage(current.src)}
                className="object-contain"
              />
            </motion.div>
            <p className="mt-4 max-w-3xl text-center text-white/85">
              {current.alt} <span className="text-white/60">· {index + 1} / {count}</span>
            </p>

            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Previous photo"
                  className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl transition-colors hover:bg-pink focus-visible:outline-white sm:left-6"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Next photo"
                  className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl transition-colors hover:bg-pink focus-visible:outline-white sm:right-6"
                >
                  ›
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
