import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getEventsForProject,
  getProjects,
  getProjectBySlug,
  getServices,
  getSettings,
  toParagraphs,
  toStats,
  toGallery,
  formatEventDay,
} from "@/lib/db";
import { donateOptions } from "@/lib/donate";
import { DonateButton } from "@/components/Donate";
import { Reveal, CountUp, ProjectGallery } from "@/components/Motion";

// Build every published project in advance so it opens instantly. New projects are built on their first visit.
export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project not found" };
  return {
    title: project.title,
    description: project.summary,
    openGraph: {
      title: project.title,
      description: project.summary,
      images: project.coverImage ? [project.coverImage] : [],
    },
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const settings = await getSettings();
  const stats = toStats(project.stats);
  const gallery = toGallery(project.gallery, project.title);
  const coverAlt = gallery.find((g) => g.src === project.coverImage)?.alt ?? project.title;
  const service = project.relatedService
    ? (await getServices()).find((s) => s.slug === project.relatedService)
    : undefined;

  const sessions = await getEventsForProject(project.slug);

  // Previous / next project in the same period
  const siblings = await getProjects(project.period);
  const at = siblings.findIndex((p) => p.slug === project.slug);
  const previous = at > 0 ? siblings[at - 1] : null;
  const next = at >= 0 && at < siblings.length - 1 ? siblings[at + 1] : null;

  return (
    <article>
      <header className="bg-mist">
        <div className="mx-auto max-w-7xl px-4 pb-14 pt-16 sm:px-6 sm:pt-24">
          <Link href="/impact" className="text-sm font-semibold text-pink hover:underline">
            Back to our impact
          </Link>
          <Reveal>
            <p className="mt-6 font-semibold text-pink">
              {project.category} <span className="text-muted">· {project.period}</span>
            </p>
            <h1 className="mt-3 max-w-4xl font-display text-4xl font-bold leading-tight text-ink sm:text-6xl">{project.title}</h1>
            {project.summary && <p className="mt-5 max-w-2xl text-lg text-muted">{project.summary}</p>}
          </Reveal>
        </div>
      </header>

      {project.coverImage && (
        <div className="mx-auto max-w-5xl px-4 pt-12 sm:px-6">
          <div className="photo-frame aspect-[16/10] bg-mist">
            <Image
              src={project.coverImage}
              alt={coverAlt}
              fill
              priority
              sizes="(min-width: 1024px) 1024px, 100vw"
              unoptimized={!project.coverImage.startsWith("/")}
              className="object-cover"
            />
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        {/* Numbers */}
        {stats.length > 0 && (
          <ul className="mb-12 flex flex-wrap gap-3">
            {stats.map((s, i) => (
              <li key={i} className="flex items-baseline gap-2 rounded-full bg-pink-soft px-5 py-3">
                <span className="font-display text-3xl font-bold text-pink">
                  {/^\d+$/.test(s.number) ? <CountUp to={Number(s.number)} /> : s.number}
                </span>
                <span className="text-ink">{s.label}</span>
              </li>
            ))}
          </ul>
        )}

        {toParagraphs(project.body).map((p, i) => (
          <p key={i} className="mb-6 text-lg leading-[1.75] text-ink/85">
            {p}
          </p>
        ))}

        {sessions.length > 0 && (
          <section aria-labelledby="sessions-title" className="mt-12">
            <h2 id="sessions-title" className="font-display text-2xl font-bold text-ink">
              Sessions in this project
            </h2>
            <ul className="mt-4 divide-y divide-[#e5e3e8]">
              {sessions.map((e) => (
                <li key={e.id} className="flex flex-wrap items-baseline gap-x-6 gap-y-1 py-3">
                  <time dateTime={e.startsAt.toISOString()} className="w-full shrink-0 text-sm text-muted sm:w-36">
                    {formatEventDay(e.startsAt)}
                  </time>
                  <Link href={`/events/${e.slug}`} className="min-w-0 flex-1 font-semibold hover:text-pink">
                    {e.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {service && (
          <p className="mt-10 text-lg">
            <span className="text-muted">Part of: </span>
            <Link href={`/our-work#${service.slug}`} className="font-semibold text-pink underline-offset-4 hover:underline">
              {service.title}
            </Link>
          </p>
        )}
      </div>

      {/* Gallery */}
      {gallery.length > 0 && (
        <section aria-labelledby="photos-title" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <h2 id="photos-title" className="mb-8 font-display text-4xl font-bold lowercase">
            photos
          </h2>
          <ProjectGallery images={gallery} />
        </section>
      )}

      {/* Previous / next project */}
      {(previous || next) && (
        <nav aria-label="More projects" className="mx-auto grid max-w-7xl gap-4 px-4 pb-16 sm:grid-cols-2 sm:px-6">
          {previous ? (
            <Link href={`/impact/${previous.slug}`} className="group rounded-2xl border border-mist p-6 transition-colors hover:border-pink">
              <span className="block text-sm text-muted">Previous project</span>
              <span className="mt-1 block font-display text-xl font-semibold group-hover:text-pink">{previous.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={`/impact/${next.slug}`} className="group rounded-2xl border border-mist p-6 text-right transition-colors hover:border-pink">
              <span className="block text-sm text-muted">Next project</span>
              <span className="mt-1 block font-display text-xl font-semibold group-hover:text-pink">{next.title}</span>
            </Link>
          )}
        </nav>
      )}

      {/* Call to action */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 rounded-[2rem] bg-pink px-8 py-14 text-white sm:px-14 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-4xl font-bold leading-tight sm:text-5xl">Support our work</h2>
            <p className="mt-3 max-w-xl text-lg text-white/85">Your donation helps us run projects like this for local families.</p>
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
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}
