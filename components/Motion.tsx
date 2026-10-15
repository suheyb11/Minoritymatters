"use client";

// Animated pieces used on the public pages (Framer Motion).
// All animations respect the visitor's "reduce motion" setting.

import { motion, AnimatePresence, useReducedMotion, useInView, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";

// ---------- Reveal: fades content up when it scrolls into view ----------
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ---------- Ring: the logo circle with the pink arc ----------
// "arc" is how much of the circle is pink (0 to 1). The arc draws itself on load.
export function Ring({ size = 120, arc = 0.2, stroke = 6, className = "" }: { size?: number; arc?: number; stroke?: number; className?: string }) {
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
        animate={{ pathLength: arc }}
        transition={{ duration: 1.4, delay: 0.2, ease: [0.65, 0, 0.35, 1] }}
      />
    </svg>
  );
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
          <AnimatePresence mode="wait">
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
export function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [value, setValue] = useState(reduce ? to : 0);

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
          <motion.li
            key={s.id}
            id={s.slug}
            className="scroll-mt-28"
            initial={reduce ? false : { opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + i * 0.07 }}
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
          </motion.li>
        );
      })}
    </ul>
  );
}
