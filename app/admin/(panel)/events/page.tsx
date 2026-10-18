import Link from "next/link";
import type { Event } from "@prisma/client";
import {
  prisma,
  getProjects,
  getBookingTotals,
  isFinished,
  formatEventDate,
  toLondonInput,
  EVENT_AUDIENCES,
} from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import {
  saveEvent,
  deleteEvent,
  duplicateEvent,
  setBookingStatus,
  markAllAttended,
  deleteOldBookings,
} from "../../actions";
import {
  Field,
  TextArea,
  ImageField,
  Checkbox,
  SaveButton,
  DeleteButton,
  ConfirmButton,
  PrintButton,
  BookingTypeFields,
  AdminTitle,
  Notice,
} from "@/components/AdminUI";

type Params = { edit?: string; new?: string; bookings?: string; saved?: string; deleted?: string; error?: string; cleaned?: string };

type Totals = Awaited<ReturnType<typeof getBookingTotals>>;

const bookingTypeLabels: Record<string, string> = { form: "Our form", external: "Other site", none: "No booking" };

export default async function EventsAdmin({ searchParams }: { searchParams: Promise<Params> }) {
  await requireAdmin();
  const params = await searchParams;
  if (params.bookings) return <BookingsView eventId={Number(params.bookings)} saved={params.saved} />;

  const events = await prisma.event.findMany({ orderBy: { startsAt: "asc" } });
  const projects = await getProjects(undefined, true);
  const totals = await getBookingTotals(events.map((e) => e.id));
  const editing = params.edit ? await prisma.event.findUnique({ where: { id: Number(params.edit) } }) : null;
  const showForm = Boolean(editing || params.new);

  const upcoming = events.filter((e) => !isFinished(e));
  const past = events.filter((e) => isFinished(e)).reverse(); // newest first

  return (
    <>
      <AdminTitle title="Events" newHref="/admin/events?new=1" newLabel="Add event" />
      <p className="-mt-4 mb-8 max-w-2xl text-sm text-muted">
        Events are shown on the Events page, and the next one in a slim bar on the home page. All dates and times are
        London time.
      </p>
      <Notice saved={params.saved} deleted={params.deleted} error={params.error} />
      {params.cleaned !== undefined && (
        <p className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          Deleted {params.cleaned} {params.cleaned === "1" ? "booking" : "bookings"} for events older than 12 months.
        </p>
      )}

      {showForm && (
        <form action={saveEvent} className="mb-10 space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-display text-xl font-bold">{editing ? "Edit event" : "New event"}</h2>
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <Field label="Title" name="title" defaultValue={editing?.title} required />
          <TextArea label="Summary" name="summary" defaultValue={editing?.summary} rows={2} hint="1–2 sentences, shown on the event card." />
          <TextArea label="Text" name="body" defaultValue={editing?.body} rows={8} hint="Leave an empty line between paragraphs." />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Starts" name="startsAt" type="datetime-local" defaultValue={toLondonInput(editing?.startsAt ?? null)} required hint="London time." />
            <Field label="Ends" name="endsAt" type="datetime-local" defaultValue={toLondonInput(editing?.endsAt ?? null)} hint="Optional. London time." />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Place" name="location" defaultValue={editing?.location} hint="For example Sobell Leisure Centre." />
            <Field label="Address" name="address" defaultValue={editing?.address} hint="Full address with postcode." />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink">Who is it for?</span>
              <select name="audience" defaultValue={editing?.audience ?? "Everyone"} className="field">
                {EVENT_AUDIENCES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
            <Field label="Age from" name="ageMin" type="number" defaultValue={editing?.ageMin ?? ""} hint="Optional." />
            <Field label="Age to" name="ageMax" type="number" defaultValue={editing?.ageMax ?? ""} hint="Optional." />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Price" name="price" defaultValue={editing?.price ?? "Free"} hint="For example Free or £2 per child." />
            <Field label="Places" name="capacity" type="number" defaultValue={editing?.capacity ?? ""} hint="Adults and children together. Leave empty for no limit." />
          </div>
          <div className="rounded-xl border border-dashed border-grey p-4">
            <BookingTypeFields defaultType={editing?.bookingType ?? "form"} defaultUrl={editing?.bookingUrl ?? ""} />
          </div>
          <Field
            label="Booking closes"
            name="bookingClosesAt"
            type="datetime-local"
            defaultValue={toLondonInput(editing?.bookingClosesAt ?? null)}
            hint="Optional. London time. After this, the page says “Booking has closed”."
          />
          <ImageField label="Cover photo" name="coverImage" defaultValue={editing?.coverImage} />
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">Part of (Impact project)</span>
            <select name="projectSlug" defaultValue={editing?.projectSlug ?? ""} className="field">
              <option value="">None</option>
              {projects.map((p) => (
                <option key={p.id} value={p.slug}>
                  {p.title} ({p.period})
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-muted">
              The event is listed on that project&apos;s page, and after the event a “See what happened” link appears.
            </span>
          </label>
          <Field label="Web address (slug)" name="slug" defaultValue={editing?.slug} hint="Leave empty to create it from the title." />
          <Checkbox label="Show on website" name="published" defaultChecked={editing ? editing.published : true} />
          <div className="flex gap-3">
            <SaveButton />
            <Link href="/admin/events" className="rounded-full px-5 py-2.5 font-semibold text-muted hover:bg-mist">
              Cancel
            </Link>
          </div>
        </form>
      )}

      <section className="mb-10">
        <h2 className="mb-3 font-display text-xl font-bold">
          Upcoming <span className="text-sm font-normal text-muted">{upcoming.length} events</span>
        </h2>
        {upcoming.length === 0 ? <p className="text-muted">No upcoming events.</p> : <EventTable rows={upcoming} totals={totals} />}
      </section>

      {past.length > 0 && (
        <details className="mb-10">
          <summary className="mb-3 cursor-pointer font-display text-xl font-bold">
            Past <span className="text-sm font-normal text-muted">{past.length} events</span>
          </summary>
          <EventTable rows={past} totals={totals} />
        </details>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="font-display text-xl font-bold">Data protection</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          We should not keep people&apos;s booking details for longer than we need them. This deletes all bookings for
          events that ended more than 12 months ago. The events themselves stay.
        </p>
        <form action={deleteOldBookings} className="mt-4">
          <ConfirmButton
            label="Delete bookings for events older than 12 months"
            message="Delete all bookings for events that ended more than 12 months ago? This cannot be undone."
            className="rounded-full px-4 py-2 text-sm font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50"
          />
        </form>
      </section>
    </>
  );
}

// One table row per event
function EventRow({ event, totals }: { event: Event; totals: Totals }) {
  const t: Record<string, number> = totals[event.id] ?? {};
  const booked = (t.confirmed ?? 0) + (t.attended ?? 0);
  return (
    <tr className="align-top">
      <td className="whitespace-nowrap p-3 text-sm">{formatEventDate(event.startsAt, event.endsAt)}</td>
      <td className="p-3 font-semibold">{event.title}</td>
      <td className="p-3 text-sm">{event.audience}</td>
      <td className="p-3 text-sm">{bookingTypeLabels[event.bookingType] ?? event.bookingType}</td>
      <td className="whitespace-nowrap p-3 text-sm">
        {event.bookingType === "form" || booked > 0 ? (
          <>
            {booked}
            {event.capacity !== null && ` / ${event.capacity}`} booked
            {t.waitlist ? <span className="block text-muted">+{t.waitlist} waitlist</span> : null}
          </>
        ) : (
          <span className="text-muted">–</span>
        )}
      </td>
      <td className="p-3">
        {event.published ? (
          <span className="rounded bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-800">Published</span>
        ) : (
          <span className="rounded bg-mist px-2 py-0.5 text-xs text-muted">Hidden</span>
        )}
      </td>
      <td className="p-3">
        <div className="flex flex-wrap items-center gap-1">
          <Link href={`/admin/events?edit=${event.id}`} className="rounded-full px-3 py-1.5 text-sm font-semibold text-pink hover:bg-pink-soft">
            Edit
          </Link>
          <Link href={`/admin/events?bookings=${event.id}`} className="rounded-full px-3 py-1.5 text-sm font-semibold text-pink hover:bg-pink-soft">
            Bookings
          </Link>
          <form action={duplicateEvent}>
            <input type="hidden" name="id" value={event.id} />
            <button className="rounded-full px-3 py-1.5 text-sm font-semibold text-ink hover:bg-gray-100">Duplicate</button>
          </form>
          <form action={deleteEvent}>
            <input type="hidden" name="id" value={event.id} />
            <DeleteButton message="Delete this event and all its bookings? This cannot be undone." />
          </form>
        </div>
      </td>
    </tr>
  );
}

function EventTable({ rows, totals }: { rows: Event[]; totals: Totals }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
      <table className="w-full min-w-[56rem] text-left">
        <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="p-3 font-semibold">Date</th>
            <th className="p-3 font-semibold">Title</th>
            <th className="p-3 font-semibold">Audience</th>
            <th className="p-3 font-semibold">Booking</th>
            <th className="p-3 font-semibold">Places</th>
            <th className="p-3 font-semibold">Status</th>
            <th className="p-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {rows.map((e) => (
            <EventRow key={e.id} event={e} totals={totals} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- Bookings for one event (/admin/events?bookings=<id>) ----------
async function BookingsView({ eventId, saved }: { eventId: number; saved?: string }) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { bookings: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] } },
  });
  if (!event) {
    return (
      <p className="text-muted">
        Event not found.{" "}
        <Link href="/admin/events" className="font-semibold text-pink">
          Back to events
        </Link>
      </p>
    );
  }

  const placesWith = (status: string) =>
    event.bookings.filter((b) => b.status === status).reduce((sum, b) => sum + b.adults + b.children, 0);
  const register = event.bookings.filter((b) => b.status === "confirmed" || b.status === "attended");

  return (
    <>
      {/* Normal screen (hidden when printing) */}
      <div className="print:hidden">
        <Link href="/admin/events" className="text-sm font-semibold text-pink hover:underline">
          Back to events
        </Link>
        <h1 className="mt-3 font-display text-3xl font-bold">Bookings: {event.title}</h1>
        <p className="mb-6 mt-1 text-muted">
          {formatEventDate(event.startsAt, event.endsAt)}
          {event.location && ` · ${event.location}`}
          {event.capacity !== null && ` · ${event.capacity} places`}
        </p>
        {saved && <p className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800">Saved.</p>}

        <dl className="mb-6 grid grid-cols-3 gap-4 sm:max-w-xl">
          {[
            ["Confirmed places", placesWith("confirmed")],
            ["Waitlist places", placesWith("waitlist")],
            ["Attended", placesWith("attended")],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-gray-200 bg-white p-4">
              <dd className="font-display text-3xl font-bold text-pink">{value}</dd>
              <dt className="text-sm font-semibold text-muted">{label}</dt>
            </div>
          ))}
        </dl>

        <div className="mb-6 flex flex-wrap gap-2">
          <a
            href={`/admin/events/${event.id}/bookings.csv`}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-ink hover:bg-gray-100"
          >
            Download CSV
          </a>
          <PrintButton />
          <form action={markAllAttended}>
            <input type="hidden" name="eventId" value={event.id} />
            <ConfirmButton label="Mark all confirmed as attended" message="Mark every confirmed booking as attended?" />
          </form>
        </div>

        {event.bookings.length === 0 ? (
          <p className="text-muted">No bookings yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full min-w-[64rem] text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-muted">
                <tr>
                  {["Name", "Email", "Phone", "Adults", "Children", "Ages", "Notes", "Status", "Booked at"].map((h) => (
                    <th key={h} className="p-3 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {event.bookings.map((b) => (
                  <tr key={b.id} className="align-top">
                    <td className="p-3 font-semibold">{b.name}</td>
                    <td className="p-3">
                      <a href={`mailto:${b.email}`} className="text-pink hover:underline">
                        {b.email}
                      </a>
                    </td>
                    <td className="whitespace-nowrap p-3">{b.phone}</td>
                    <td className="p-3">{b.adults}</td>
                    <td className="p-3">{b.children}</td>
                    <td className="p-3">{b.childAges}</td>
                    <td className="max-w-xs whitespace-pre-line p-3">{b.notes}</td>
                    <td className="p-3">
                      <form action={setBookingStatus} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={b.id} />
                        <select name="status" defaultValue={b.status} aria-label={`Status for ${b.name}`} className="field !w-auto !py-1.5">
                          {["confirmed", "waitlist", "cancelled", "attended"].map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <button className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-pink">Save</button>
                      </form>
                    </td>
                    <td className="whitespace-nowrap p-3 text-muted">
                      {formatEventDate(b.createdAt, null)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printed register (only shows when printing): confirmed and attended bookings with a tick box */}
      <div className="hidden text-black print:block">
        <h1 className="text-2xl font-bold">Register: {event.title}</h1>
        <p className="mb-4">
          {formatEventDate(event.startsAt, event.endsAt)}
          {event.location && ` · ${event.location}`} · {placesWith("confirmed") + placesWith("attended")} places
        </p>
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr>
              {["Here", "Name", "Adults", "Children", "Ages", "Phone", "Notes"].map((h) => (
                <th key={h} className="border border-black p-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {register.map((b) => (
              <tr key={b.id}>
                <td className="w-12 border border-black p-2 text-center text-lg">{b.status === "attended" ? "☑" : "☐"}</td>
                <td className="border border-black p-2">{b.name}</td>
                <td className="border border-black p-2">{b.adults}</td>
                <td className="border border-black p-2">{b.children}</td>
                <td className="border border-black p-2">{b.childAges}</td>
                <td className="border border-black p-2">{b.phone}</td>
                <td className="border border-black p-2">{b.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
