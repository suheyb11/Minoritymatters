import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logoutAction } from "../actions";

export const metadata = { title: "Admin", robots: { index: false } };

const menu = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/services", label: "Our work" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/press", label: "Press" },
  { href: "/admin/values", label: "Values" },
  { href: "/admin/funders", label: "Funders" },
  { href: "/admin/settings", label: "Site settings" },
];

// Every page inside (panel) needs the admin to be logged in
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const unread = await prisma.message.count({ where: { isRead: false } });

  return (
    <div className="min-h-screen bg-white lg:flex">
      <aside className="border-b border-gray-200 bg-white text-ink lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3 px-6 py-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="" className="h-10 w-10 rounded-full border border-gray-200 bg-white" />
          <span className="font-display text-lg font-semibold text-plum">MM Admin</span>
        </div>
        <nav className="overflow-x-auto px-3 pb-3 lg:pb-0">
          <ul className="flex gap-1 lg:flex-col">
            {menu.map((m) => (
              <li key={m.href}>
                <Link
                  href={m.href}
                  className="flex items-center justify-between gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm text-ink/80 hover:bg-gray-100 hover:text-ink"
                >
                  {m.label}
                  {m.href === "/admin/messages" && unread > 0 && (
                    <span className="rounded-full bg-pink px-2 py-0.5 text-xs font-bold text-white">{unread}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden space-y-1 border-t border-gray-200 px-3 pt-4 mt-4 mx-3 lg:block">
          <Link href="/" target="_blank" className="block rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-gray-100 hover:text-ink">
            View website
          </Link>
          <form action={logoutAction}>
            <button className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-muted hover:bg-gray-100 hover:text-ink">
              Log out
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
        {children}
        <form action={logoutAction} className="mt-10 lg:hidden">
          <button className="text-sm font-semibold text-muted underline">Log out</button>
        </form>
      </main>
    </div>
  );
}
