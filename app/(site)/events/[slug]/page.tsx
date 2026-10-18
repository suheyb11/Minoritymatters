import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  prisma,
  getEventBySlug,
  getPlacesTaken,
  formatEventDate,
  formatEventDay,
  ageRange,
  placesLeft,
  isFinished,
  toParagraphs,
  SITE_URL,
} from "@/lib/db";
import { Reveal, BookingForm } from "@/components/Motion";

// Refresh at least every 5 minutes, so "places left" and "finished" stay correct
export const revalidate = 300;

// Build every published event in advance so it opens instantly. New events are built on their first visit.
export async function generateStaticParams() {
  const events = await prisma.event.findMany({ where: { published: true }, select: { slug: true } });
  return events.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event not found" };
  return {
    title: event.title,
    description: event.summary,
    openGraph: {
      title: event.title,
      description: event.summary,
      images: event.coverImage ? [event.coverImage] : [],
    },
  };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const left = placesLeft(event, await getPlacesTaken(event.id));
  const finished = isFinished(event);
  const closed = Boolean(event.bookingClosesAt && event.bookingClosesAt < new Date());
  const ages = ageRange(event);
  const isFree = event.price.trim().toLowerCase() === "free";
  const dateLine = formatEventDate(event.startsAt, event.endsAt);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    [event.location, event.address].filter(Boolean).join(", ")
  )}`;

  // Information for search engines (schema.org Event), so the event can show up in Google
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.summary,
    startDate: event.startsAt.toISOString(),
    endDate: (event.endsAt ?? event.startsAt).toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.location || event.address,
      address: event.address || event.location,
    },
    organizer: { "@type": "Organization", name: "Minority Matters", url: SITE_URL },
    ...(isFree ? { isAccessibleForFree: true } : {}),
    ...(event.coverImage ? { image: [new URL(event.coverImage, SITE_URL).href] } : {}),
    url: `${SITE_URL}/events/${event.slug}`,
  };

  const details = [
    { label: "When", value: dateLine },
    ...(event.audience || ages ? [{ label: "Who", value: `${event.audience}${ages ? `, ages ${ages}` : ""}` }] : []),
    { label: "Price", value: event.price || "Free" },
    ...(left !== null && !finished
      ? [{ label: "Places", value: left > 0 ? `${left} ${left === 1 ? "place" : "places"} left` : "Fully booked – join the waiting list" }]
      : []),
  ];

  return (
    <article>
      {/* "<" is escaped so the text can never close the script tag */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <header className="bg-mist">
        <div className="mx-auto max-w-7xl px-4 pb-14 pt-16 sm:px-6 sm:pt-24">
          <Link href="/events" className="text-sm font-semibold text-pink hover:underline">
            Back to all events
          </Link>
          <Reveal>
            <p className="mt-6 font-semibold text-pink">
              <time dateTime={event.startsAt.toISOString()}>{dateLine}</time>
            </p>
            <h1 className="mt-3 max-w-4xl font-display text-4xl font-bold leading-tight text-ink sm:text-6xl">{event.title}</h1>
            {event.summary && <p className="mt-5 max-w-2xl text-lg text-muted">{event.summary}</p>}
          </Reveal>
        </div>
      </header>

      {/* On phones: details, then the booking box, then the text. On desktop the booking box sticks in the right column. */}
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
        <div className="lg:col-start-1">
          <dl className="space-y-5">
            {details.map((d) => (
              <div key={d.label} className="sm:grid sm:grid-cols-[8rem_1fr] sm:gap-8">
                <dt className="font-semibold text-ink">{d.label}</dt>
                <dd className="text-lg text-muted">{d.value}</dd>
              </div>
            ))}
            {(event.location || event.address) && (
              <div className="sm:grid sm:grid-cols-[8rem_1fr] sm:gap-8">
                <dt className="font-semibold text-ink">Where</dt>
                <dd className="text-lg text-muted">
                  {event.location && <span className="block text-ink">{event.location}</span>}
                  {event.address && <span className="block">{event.address}</span>}
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-base font-semibold text-pink underline-offset-4 hover:underline"
                  >
                    Open in Google Maps
                  </a>
                </dd>
              </div>
            )}
          </dl>
          {!finished && (
            <a
              href={`/events/${event.slug}/ics`}
              className="mt-8 inline-flex rounded-full border-2 border-ink px-5 py-2.5 font-semibold text-ink transition-colors hover:border-pink hover:bg-pink hover:text-white"
            >
              Add to calendar
            </a>
          )}
        </div>

        <aside aria-labelledby="booking-title" className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div className="rounded-3xl bg-pink-soft p-6 sm:p-8 lg:sticky lg:top-28">
            <h2 id="booking-title" className="font-display text-2xl font-bold text-ink">
              {finished ? "This event has finished." : "Book a place"}
            </h2>

            {finished ? (
              event.projectSlug && (
                <Link href={`/impact/${event.projectSlug}`} className="mt-4 inline-block font-semibold text-pink hover:underline">
                  See what happened
                </Link>
              )
            ) : event.bookingType === "none" ? (
              <p className="mt-3 text-lg text-ink">No booking needed – just come along.</p>
            ) : closed ? (
              <p className="mt-3 text-lg text-ink">Booking has closed.</p>
            ) : event.bookingType === "external" && event.bookingUrl ? (
              <>
                <a
                  href={event.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex rounded-full bg-pink px-7 py-3.5 font-semibold text-white transition-colors hover:bg-pink-dark"
                >
                  Book a place
                </a>
                <p className="mt-3 text-sm text-muted">You&apos;ll book on our partner&apos;s booking page.</p>
              </>
            ) : event.bookingType === "form" ? (
              <>
                {event.bookingClosesAt && (
                  <p className="mt-2 text-sm text-muted">Booking closes {formatEventDay(event.bookingClosesAt)}.</p>
                )}
                <BookingForm eventId={event.id} placesLeft={left} />
              </>
            ) : (
              <p className="mt-3 text-lg text-ink">
                Please{" "}
                <Link href="/contact" className="font-semibold text-pink hover:underline">
                  contact us
                </Link>{" "}
                to book.
              </p>
            )}
          </div>
        </aside>

        <div className="lg:col-start-1">
          {event.coverImage && (
            <div className="photo-frame relative mb-10 aspect-[16/10] bg-mist">
              <Image
                src={event.coverImage}
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 800px, 100vw"
                unoptimized={!event.coverImage.startsWith("/")}
                className="object-cover"
              />
            </div>
          )}
          {toParagraphs(event.body).map((p, i) => (
            <p key={i} className="mb-6 max-w-3xl text-lg leading-[1.75] text-ink/85">
              {p}
            </p>
          ))}
        </div>
      </div>
    </article>
  );
}
