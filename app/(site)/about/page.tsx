import { getSettings, getValues, toParagraphs } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import { Reveal } from "@/components/Motion";

export const metadata = { title: "About" };

// Text wrapped in *stars* is shown in pink (you can use this in the admin "About lead" field)
function Highlight({ text }: { text: string }) {
  const parts = text.split("*");
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="text-pink">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

const milestones = [
  { year: "2010", text: "Minority Matters starts, offering educational support to children and young people." },
  { year: "Growing", text: "Parents come to us with wider issues, and we begin working with local authorities." },
  { year: "2015", text: "We start safeguarding training for supplementary school and madrasah teachers." },
  { year: "2021", text: "We call on London's mayoral candidates to end child criminal exploitation." },
];

export default function AboutPage() {
  const settings = getSettings();
  const values = getValues();

  return (
    <>
      <PageHeader title="about" arc={0.65} />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <Reveal>
          <p className="max-w-5xl font-display text-3xl font-semibold leading-snug text-ink/45 sm:text-5xl sm:leading-tight">
            <Highlight text={settings.aboutLead} />
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-10 max-w-3xl text-lg leading-relaxed text-muted">{settings.aboutStory}</p>
        </Reveal>
      </section>

      {/* Timeline */}
      <section className="bg-mist">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <h2 className="font-display text-4xl font-bold lowercase">our journey</h2>
          <ol className="relative mt-12 grid gap-10 md:grid-cols-4 md:gap-6">
            <span className="absolute left-[7px] top-2 h-[calc(100%-1rem)] w-0.5 bg-grey/60 md:left-0 md:top-[7px] md:h-0.5 md:w-full" aria-hidden="true" />
            {milestones.map((m, i) => (
              <li key={m.year} className="relative pl-10 md:pl-0 md:pt-10">
                <Reveal delay={i * 0.12}>
                  <span className="absolute left-0 top-1 h-4 w-4 rounded-full border-4 border-pink bg-white md:top-0" aria-hidden="true" />
                  <p className="font-display text-3xl font-bold text-pink">{m.year}</p>
                  <p className="mt-2 leading-relaxed text-muted">{m.text}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Vision & mission */}
      <section className="mx-auto grid max-w-7xl gap-16 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1fr_1.4fr]">
        <Reveal>
          <div className="lg:sticky lg:top-28">
            <h2 className="font-display text-4xl font-bold text-pink">Our vision</h2>
            <p className="mt-5 text-xl leading-relaxed text-ink">{settings.vision}</p>
          </div>
        </Reveal>
        <div>
          <Reveal>
            <h2 className="font-display text-4xl font-bold text-pink">Our mission</h2>
          </Reveal>
          {toParagraphs(settings.mission).map((p, i) => (
            <Reveal key={i} delay={0.05}>
              <p className="mt-5 text-lg leading-relaxed text-muted">{p}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Icon row, like the original site */}
      <section className="border-t border-mist">
        <ul className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-8 px-4 py-14 sm:px-6">
          {values.map((v, i) => (
            <li key={v.id}>
              <Reveal delay={i * 0.05}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={v.icon} alt={v.title} title={v.title} className="h-16 w-16" />
              </Reveal>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
