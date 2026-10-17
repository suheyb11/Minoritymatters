import Link from "next/link";
import { getProjects, getProjectPeriods, toProjectCard, toStats, PROJECT_CATEGORIES } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import { ImpactExplorer, Reveal } from "@/components/Motion";

export const metadata = {
  title: "Our impact",
  description: "What we delivered with families, children and young people across Islington and Camden this year.",
};

// The 3 highlight numbers next to the big total: the biggest number of each of these projects
const HIGHLIGHT_SLUGS = ["girls-baking-art", "football-mentoring", "welfare-advice"];

export default async function ImpactPage() {
  // Every period is sent to the page, so switching years is instant (the newest one shows first)
  const periods = await getProjectPeriods();
  const data = await Promise.all(
    periods.map(async (period) => {
      const projects = await getProjects(period);
      const highlights = HIGHLIGHT_SLUGS.flatMap((slug) => {
        const project = projects.find((p) => p.slug === slug);
        if (!project) return [];
        const biggest = toStats(project.stats).sort((a, b) => Number(b.number) - Number(a.number))[0];
        return biggest ? [{ ...biggest, slug, title: project.title }] : [];
      });
      return { period, projects: projects.map(toProjectCard), highlights };
    })
  );

  return (
    <>
      <PageHeader
        title="our impact"
        arc={0.8}
        intro="What we delivered with families, children and young people across Islington and Camden this year."
      />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <ImpactExplorer periods={data} categories={PROJECT_CATEGORIES} />
      </div>

      {/* ---------- Thank you ---------- */}
      <section className="px-4 pb-20 sm:px-6">
        <Reveal className="mx-auto max-w-7xl">
          <Link
            href="/our-funders"
            className="group flex flex-col gap-6 rounded-[2rem] bg-mist px-8 py-12 transition-colors hover:bg-pink-soft sm:px-14 md:flex-row md:items-center md:justify-between"
          >
            <span>
              <span className="block font-display text-4xl font-bold text-pink sm:text-5xl">Thank you</span>
              <span className="mt-3 block max-w-2xl text-lg leading-relaxed text-ink">
                Special thanks to our trustees, staff, volunteers, tutors, youth workers, partners and parent contributors.
              </span>
            </span>
            <span className="shrink-0 font-semibold text-pink underline-offset-4 group-hover:underline">See our funders</span>
          </Link>
        </Reveal>
      </section>
    </>
  );
}
