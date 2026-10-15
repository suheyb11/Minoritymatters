import Link from "next/link";
import Image from "next/image";
import { getServices, getSettings, toLines, toParagraphs } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import { ServiceAreas, ServiceList, FullBleedBand, Reveal } from "@/components/Motion";

export const metadata = { title: "Our work" };

export default async function OurWorkPage() {
  const settings = await getSettings();
  const services = await getServices();

  // The 5 main service areas (from the brochure)
  const areas = services
    .filter((s) => s.kind === "area")
    .map((s) => ({ id: s.id, slug: s.slug, title: s.title, summary: s.summary, icon: s.icon, points: toLines(s.points) }));

  // The named programmes (the list that opens and closes)
  const programmes = services
    .filter((s) => s.kind === "programme")
    .map((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      summary: s.summary,
      icon: s.icon,
      intro: s.intro,
      points: toLines(s.points),
      outro: toParagraphs(s.outro),
    }));

  // The intro is the second paragraph of "Who we are" ("We have a wide mandate…")
  const whoWeAre = toParagraphs(settings.whoWeAre);
  const intro = whoWeAre[1] ?? whoWeAre[0];
  const phoneLink = `tel:${settings.phone.replace(/\s/g, "")}`;

  return (
    <>
      <PageHeader title="our work" arc={0.35} intro={intro} />

      {/* ---------- Main service areas ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24" aria-labelledby="areas-title">
        <Reveal>
          <h2 id="areas-title" className="font-display text-4xl font-bold lowercase sm:text-5xl">
            what we do
          </h2>
          <p className="mt-3 max-w-2xl text-lg text-muted">Our five main service areas.</p>
        </Reveal>
        <div className="mt-12">
          <ServiceAreas areas={areas} />
        </div>
      </section>

      {/* ---------- Full-width photo ---------- */}
      <FullBleedBand line={settings.communityLine} />
      <div className="h-16 sm:h-24" aria-hidden="true" />

      {/* ---------- Programmes ---------- */}
      {programmes.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24" aria-labelledby="programmes-title">
          <Reveal>
            <h2 id="programmes-title" className="font-display text-4xl font-bold lowercase sm:text-5xl">
              our programmes
            </h2>
            <p className="mt-3 max-w-2xl text-lg text-muted">Select a programme to read more.</p>
          </Reveal>
          <div className="mt-10">
            <ServiceList services={programmes} />
          </div>
        </section>
      )}

      {/* ---------- Referral (full-width, on a pink-tinted photo) ---------- */}
      <section className="relative flex min-h-[60svh] items-center overflow-hidden bg-pink text-white">
        {/* Only the photo fades at the top and bottom; the pink overlay stays strong for the white text */}
        <div className="feather-y absolute inset-0">
          <Image
            src="/images/photos/parents-workshop.jpg"
            alt="Parents and professionals seated at tables in a community hall, listening to a speaker at a workshop"
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
        {/* Pink "duotone": pink multiplied over the photo, plus a little plum so white text stays readable */}
        <div className="absolute inset-0 bg-pink/90 mix-blend-multiply" aria-hidden="true" />
        <div className="absolute inset-0 bg-plum/25" aria-hidden="true" />
        <div className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <Reveal>
            <div className="grid gap-10 md:grid-cols-[1.5fr_1fr] md:items-center">
              <div>
                <h2 className="font-display text-4xl font-bold leading-tight sm:text-5xl">Not sure if we can help?</h2>
                {settings.referralText && <p className="mt-4 max-w-2xl text-lg text-white/90">{settings.referralText}</p>}
              </div>
              <div className="flex flex-wrap gap-3 md:justify-end">
                <Link
                  href="/contact?reason=referral"
                  className="rounded-full bg-white px-6 py-3.5 font-semibold text-pink transition-colors hover:bg-plum hover:text-white"
                >
                  Make a referral
                </Link>
                <a
                  href={phoneLink}
                  className="rounded-full border-2 border-white px-6 py-3 font-semibold text-white transition-colors hover:bg-white hover:text-pink"
                >
                  Call {settings.phone}
                </a>
              </div>
            </div>
            <p className="mt-10 border-t border-white/30 pt-6 text-sm text-white/90">
              If a child is in immediate danger, call <a href="tel:999" className="font-semibold underline">999</a>. To
              report a missing child, call <a href="tel:116000" className="font-semibold underline">116 000</a>.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
