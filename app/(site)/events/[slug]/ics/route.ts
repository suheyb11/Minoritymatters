// /events/<slug>/ics: a calendar file (.ics) for the "Add to calendar" button.
// It opens in Apple Calendar, Google Calendar, Outlook and most phone calendars.

import { getEventBySlug, SITE_URL } from "@/lib/db";

// 2027-02-14T11:00:00.000Z -> "20270214T110000Z" (calendar files use UTC in this short form)
function icsDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// Commas, semicolons, backslashes and line breaks must be escaped in calendar text
function icsText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

// Lines longer than 75 bytes are split, and each extra line starts with a space
// (bytes, not letters: "£" or "–" take more than one byte)
function fold(line: string) {
  const parts = [];
  let current = "";
  for (const letter of line) {
    if (Buffer.byteLength(current + letter) > 75) {
      parts.push(current);
      current = " ";
    }
    current += letter;
  }
  parts.push(current);
  return parts.join("\r\n");
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return new Response("Event not found", { status: 404 });

  const url = `${SITE_URL}/events/${event.slug}`;
  const end = event.endsAt ?? new Date(event.startsAt.getTime() + 60 * 60 * 1000); // no end time: 1 hour
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Minority Matters//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:event-${event.id}@minoritymatters.org.uk`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(event.startsAt)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsText(event.title)}`,
    `LOCATION:${icsText([event.location, event.address].filter(Boolean).join(", "))}`,
    `DESCRIPTION:${icsText([event.summary, url].filter(Boolean).join("\n\n"))}`,
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return new Response(lines.map(fold).join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}.ics"`,
    },
  });
}
