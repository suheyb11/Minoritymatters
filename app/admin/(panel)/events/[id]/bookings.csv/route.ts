// /admin/events/<id>/bookings.csv: downloads the bookings of one event as a spreadsheet file (CSV).
// Only for a logged-in admin: requireAdmin sends everyone else to the login page.

import { prisma, formatEventDate } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// Put a value in quotes when it has a comma, quote or line break; quotes inside become "".
// Values starting with = + - @ get a ' in front, so a spreadsheet never runs them as a formula
// (phone numbers like "+44 20 7272 0039" are left as they are).
function cell(value: string | number) {
  let text = String(value);
  if (/^[=+\-@]/.test(text) && !/^\+[\d\s()]+$/.test(text)) text = "'" + text;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id: Number(id) || 0 },
    include: { bookings: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] } },
  });
  if (!event) return new Response("Event not found", { status: 404 });

  const rows = [
    ["Name", "Email", "Phone", "Adults", "Children", "Children's ages", "Notes", "Status", "Booked at"],
    ...event.bookings.map((b) => [
      b.name,
      b.email,
      b.phone,
      b.adults,
      b.children,
      b.childAges,
      b.notes,
      b.status,
      formatEventDate(b.createdAt, null),
    ]),
  ];
  // The "\uFEFF" at the start helps Excel read letters like "é" and "£" correctly
  const csv = "\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bookings-${event.slug}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
