import Link from "next/link";
import { prisma, formatDate, getUpcomingEvents } from "@/lib/db";
import { ReasonBadge } from "@/components/AdminUI";

export default async function AdminDashboard() {
  const cards = [
    { label: "Messages", value: await prisma.message.count(), href: "/admin/messages" },
    { label: "Programmes", value: await prisma.service.count(), href: "/admin/services" },
    { label: "Projects", value: await prisma.project.count(), href: "/admin/projects" },
    { label: "Upcoming events", value: (await getUpcomingEvents()).length, href: "/admin/events" },
    {
      label: "New bookings (last 7 days)",
      value: await prisma.booking.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      href: "/admin/events",
    },
    { label: "Blog posts", value: await prisma.post.count(), href: "/admin/blog" },
    { label: "Press items", value: await prisma.pressItem.count(), href: "/admin/press" },
    { label: "Values", value: await prisma.value.count(), href: "/admin/values" },
    { label: "Funders", value: await prisma.funder.count(), href: "/admin/funders" },
  ];
  const latest = await prisma.message.findMany({ orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 5 });

  return (
    <>
      <h1 className="font-display text-3xl font-bold">Welcome back</h1>
      <p className="mt-1 text-muted">Manage the content of minoritymatters.org.uk from here.</p>

      <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <li key={c.label}>
            <Link href={c.href} className="block rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md">
              <p className="font-display text-4xl font-bold text-pink">{c.value}</p>
              <p className="mt-1 text-sm font-semibold text-muted">{c.label}</p>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Latest messages</h2>
          <Link href="/admin/messages" className="text-sm font-semibold text-pink">
            See all
          </Link>
        </div>
        {latest.length === 0 ? (
          <p className="mt-4 text-muted">No messages yet. Messages sent from the contact page will appear here.</p>
        ) : (
          <ul className="mt-4 divide-y divide-gray-200">
            {latest.map((m) => (
              <li key={m.id} className="flex items-start justify-between gap-4 py-3">
                <div>
                  <p className="font-semibold">
                    {m.name} {!m.isRead && <span className="ml-2 rounded-full bg-pink px-2 py-0.5 text-xs text-white">New</span>}{" "}
                    <ReasonBadge reason={m.reason} />
                  </p>
                  <p className="line-clamp-1 text-sm text-muted">{m.message}</p>
                </div>
                <span className="shrink-0 text-xs text-muted">{formatDate(m.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
