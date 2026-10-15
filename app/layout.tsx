import type { Metadata } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/figtree";
import "./globals.css";

// Public pages are cached, so they open instantly. Every save in the admin refreshes the
// cache straight away (revalidatePath in app/admin/actions.ts); as a backup, pages also refresh
// once an hour (for example after changing data in Prisma Studio). Admin pages are never cached.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: {
    default: "Minority Matters — community, education and child safeguarding in London",
    template: "%s | Minority Matters",
  },
  description:
    "Minority Matters is a London charity working with minority communities to support children's education, empower parents and protect young people from criminal exploitation.",
  icons: { icon: "/images/logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
