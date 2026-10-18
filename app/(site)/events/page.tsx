import Link from "next/link";
import {
  getUpcomingEvents,
  getPastEvents,
  getBookingTotals,
  getSettings,
  toEventCard,
  formatEventDay,
  EVENT_AUDIENCES,
} from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import { EventList } from "@/components/Motion";

export const metadata = {
  title: "Events",
  description: "Activities, trips and sessions for children, young people and families in Islington and Camden.",
};

// Refresh at least every 5 minutes, so finished events move to "Past events" and places left stay correct
export const revalidate = 300;

export default async function EventsPage() {
  const settings = await getSettings();
  const upcoming = await getUpcomingEvents();
  const past = await getPastEvents(20);
  const totals = await getBookingTotals(upcoming.map((e) => e.id));
  const cards = upcoming.map((e) => toEventCard(e, (totals[e.id]?.confirmed ?? 0) + (totals[e.id]?.attended ?? 0)));

  return (
    <>
      <PageHeader
        title="events"
        arc={0.28}
        intro="Activities, trips and sessions for children, young people and families in Islington and Camden."
      />

      <section aria-labelledby="upcoming-title" className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 id="upcoming-title" className="font-display text-4xl font-bold lowercase sm:text-5xl">
          upcoming
        </h2>
        {cards.length > 0 ? (
          <EventList events={cards} audiences={EVENT_AUDIENCES} />
        ) : (
          <p className="mt-6 max-w-xl text-lg text-muted">
            No upcoming events right now.{" "}
            {settings.instagramUrl && (
              <>
                Follow us on{" "}
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-pink underline-offset-4 hover:underline"
                >
                  Instagram
                </a>{" "}
                or{" "}
              </>
            )}
            <Link href="/contact" className="font-semibold text-pink underline-offset-4 hover:underline">
              {settings.instagramUrl ? "contact us" : "Contact us"}
            </Link>{" "}
            to hear about the next one.
          </p>
        )}
      </section>

      {past.length > 0 && (
        <section aria-labelledby="past-title" className="border-t border-mist">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
            <h2 id="past-title" className="font-display text-3xl font-bold lowercase">
              past events
            </h2>
            <ul className="mt-6 divide-y divide-[#e5e3e8]">
              {past.map((e) => (
                <li key={e.id} className="flex flex-wrap items-baseline gap-x-6 gap-y-1 py-4">
                  <time dateTime={e.startsAt.toISOString()} className="w-full shrink-0 text-sm text-muted sm:w-36">
                    {formatEventDay(e.startsAt)}
                  </time>
                  <Link href={`/events/${e.slug}`} className="min-w-0 flex-1 font-semibold hover:text-pink">
                    {e.title}
                  </Link>
                  {e.projectSlug && (
                    <Link href={`/impact/${e.projectSlug}`} className="text-sm font-semibold text-pink hover:underline">
                      See what happened
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
