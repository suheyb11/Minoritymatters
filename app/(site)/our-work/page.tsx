import Link from "next/link";
import { getServices, toLines, toParagraphs } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import { ServiceList, Reveal } from "@/components/Motion";

export const metadata = { title: "Our work" };

export default async function OurWorkPage() {
  const services = (await getServices()).map((s) => ({
    id: s.id,
    slug: s.slug,
    title: s.title,
    summary: s.summary,
    icon: s.icon,
    intro: s.intro,
    points: toLines(s.points),
    outro: toParagraphs(s.outro),
  }));

  return (
    <>
      <PageHeader
        title="our work"
        arc={0.35}
        intro="From tutoring and career advice to supporting families affected by child criminal exploitation, these are the programmes we run. Select one to read more."
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <ServiceList services={services} />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <Reveal>
          <div className="grid gap-8 rounded-[2rem] bg-mist p-8 sm:p-14 md:grid-cols-[1.5fr_1fr] md:items-center">
            <div>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">Need support, or want to work with us?</h2>
              <p className="mt-3 text-lg text-muted">
                Parents, young people and professionals can contact us about any of our programmes.
              </p>
            </div>
            <div className="md:text-right">
              <Link
                href="/contact"
                className="inline-block rounded-full bg-pink px-6 py-3.5 font-semibold text-white transition-colors hover:bg-pink-dark"
              >
                Contact us
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
