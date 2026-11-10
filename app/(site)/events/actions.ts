"use server";

import { revalidatePath } from "next/cache";
import { prisma, getPlacesTaken, isFinished, formatEventDay } from "@/lib/db";
import { sendMail, EMAIL_PATTERN } from "@/lib/mail";
import { tooMany } from "@/lib/rate-limit";

export type BookingState = { ok: boolean; waitlist: boolean; message: string; error: string };

// Remove HTML tags, trim, and cut to a maximum length
function clean(formData: FormData, name: string, max: number) {
  return String(formData.get(name) || "")
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, max);
}

// A whole number from 0 to 10, or null when it is something else
function count(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "0").trim() || "0";
  if (!/^\d+$/.test(value)) return null;
  const n = Number(value);
  return n <= 10 ? n : null;
}

function fail(error: string): BookingState {
  return { ok: false, waitlist: false, message: "", error };
}

// Saves a booking from the form on an event page. Everything is checked here on the server,
// because anyone can send anything to a form. Admins see bookings under Admin > Events > Bookings.
export async function bookPlace(_prev: BookingState, formData: FormData): Promise<BookingState> {
  // Hidden field: bots fill it, people don't. Pretend it worked so the bot moves on.
  if (String(formData.get("website") || "")) return { ok: true, waitlist: false, message: "Thank you.", error: "" };
  // At most 15 bookings per visitor in 10 minutes, so events can't be filled up by a script
  if (await tooMany("book", 15)) return fail("Too many bookings from your connection. Please wait a few minutes and try again.");

  const eventId = Number(formData.get("eventId")) || 0;
  const name = clean(formData, "name", 200);
  const email = clean(formData, "email", 200);
  const phone = clean(formData, "phone", 50);
  const childAges = clean(formData, "childAges", 200);
  const notes = clean(formData, "notes", 1000);
  const adults = count(formData, "adults");
  const children = count(formData, "children");

  // ---------- Is this event open for booking? ----------
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || !event.published) return fail("Sorry, we couldn't find this event.");
  if (isFinished(event)) return fail("Sorry, this event has finished.");
  if (event.bookingClosesAt && event.bookingClosesAt < new Date()) return fail("Sorry, booking for this event has closed.");
  if (event.bookingType !== "form") return fail("This event can't be booked with this form.");

  // ---------- Are the details right? ----------
  if (!name || !email) return fail("Please fill in your name and email.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Please enter a valid email address.");
  if (adults === null || children === null) return fail("Please choose between 0 and 10 adults and 0 and 10 children.");
  if (adults + children < 1) return fail("Please book at least 1 place.");
  if (formData.get("consent") !== "on") return fail("Please tick the box to agree to how we use your details.");

  // ---------- Not too many bookings from the same email ----------
  const earlier = await prisma.booking.count({
    where: { eventId, email /* MySQL compares text without case */, status: { not: "cancelled" } },
  });
  if (earlier >= 3) {
    return fail("You've already made 3 bookings for this event. Please contact us if you need to change them.");
  }

  // ---------- Save: confirmed if there is room, otherwise the waiting list ----------
  // "FOR UPDATE" locks this event's row until the transaction ends, so two people booking
  // at the same moment are handled one after the other and the event can't be overbooked.
  const places = adults + children;
  const status = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM \`Event\` WHERE id = ${eventId} FOR UPDATE`;
    const taken = await getPlacesTaken(eventId, tx);
    const fits = event.capacity === null || taken + places <= event.capacity;
    const status = fits ? "confirmed" : "waitlist";
    await tx.booking.create({ data: { eventId, name, email, phone, adults, children, childAges, notes, status } });
    return status;
  });

  await notifyCharity(event.title, name, places, status);

  // Update the places left on the event pages and the home page
  revalidatePath(`/events/${event.slug}`);
  revalidatePath("/events");
  revalidatePath("/");

  if (status === "waitlist") {
    return {
      ok: true,
      waitlist: true,
      message: "You're on the waiting list – we'll contact you if a place opens up.",
      error: "",
    };
  }
  return {
    ok: true,
    waitlist: false,
    message: `You're booked! We've saved your place for ${event.title} on ${formatEventDay(event.startsAt)}.`,
    error: "",
  };
}

// Optional: email the charity a short notice. Only when "Booking notification email" is filled in under
// Site settings (or BOOKING_NOTIFY_EMAIL in .env). Sent through Email sending, or Resend when that is off (lib/mail.ts).
// A failed email never stops the booking.
async function notifyCharity(eventTitle: string, name: string, places: number, status: string) {
  const settings = await prisma.setting.findUnique({ where: { id: 1 } });
  const to = (settings?.bookingNotifyEmail || "").trim() || process.env.BOOKING_NOTIFY_EMAIL || "";
  if (!EMAIL_PATTERN.test(to)) return;
  await sendMail({
    to,
    subject: `New booking: ${eventTitle}`,
    text: `${name} booked ${places} ${places === 1 ? "place" : "places"} for ${eventTitle} (${status}).\n\nSee all bookings in the admin panel: Admin > Events > Bookings.`,
  });
}
