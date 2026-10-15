import type { Metadata } from "next";
import Link from "next/link";
import { getSettings, toParagraphs } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import { VideoPlayer, Transcript, ShareButton, Reveal } from "@/components/Motion";

// All text on this page is edited in Admin → Site settings → Founder video.

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: "Our founder",
    description: settings.founderIntro,
    openGraph: {
      title: "Our founder | Minority Matters",
      description: settings.founderIntro,
      images: settings.founderPhoto ? [settings.founderPhoto] : [],
    },
  };
}

export default async function OurFounderPage() {
  const settings = await getSettings();
  const transcript = toParagraphs(settings.founderTranscript);
  const isPlaceholder = settings.founderTranscript.includes("[Placeholder");
  const nameAndRole = [settings.founderName, settings.founderRole].filter(Boolean).join(" — ");

  return (
    <>
      <PageHeader title="our founder" arc={0.55} intro={nameAndRole} />

      {/* ---------- Video ---------- */}
      <section className="mx-auto max-w-5xl px-4 pt-12 sm:px-6 sm:pt-16">
        <VideoPlayer url={settings.founderVideoUrl} poster={settings.founderPhoto} name={settings.founderName} />
        <div className="mt-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          {settings.founderIntro && (
            <p className="max-w-3xl font-display text-2xl leading-snug text-ink sm:text-3xl">{settings.founderIntro}</p>
          )}
          <div className="shrink-0">
            <ShareButton />
          </div>
        </div>
      </section>

      {/* ---------- Transcript ---------- */}
      {transcript.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="transcript-title">
          <div className="max-w-3xl rounded-[2rem] bg-mist p-7 sm:p-10">
            <h2 id="transcript-title" className="font-display text-3xl font-bold">
              Transcript
            </h2>
            {isPlaceholder && <p className="mt-2 text-sm text-muted">Transcript coming soon.</p>}
            <div className="mt-6">
              <Transcript paragraphs={transcript} />
            </div>
          </div>
        </section>
      )}

      {/* ---------- Call to action (same style as the home page) ---------- */}
      <section className="px-4 pb-20 sm:px-6">
        <Reveal>
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 rounded-[2rem] bg-pink px-8 py-14 text-white sm:px-14 md:flex-row md:items-center">
            <div>
              <h2 className="font-display text-4xl font-bold leading-tight sm:text-5xl">Stand with our community</h2>
              <p className="mt-3 max-w-xl text-lg text-white/85">
                See the work our founder started, or help it grow with a donation.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/our-work"
                className="rounded-full bg-white px-6 py-3.5 font-semibold text-pink transition-colors hover:bg-plum hover:text-white"
              >
                See our work
              </Link>
              <a
                href={settings.donateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border-2 border-white px-6 py-3 font-semibold text-white transition-colors hover:bg-white hover:text-pink"
              >
                Donate
              </a>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
