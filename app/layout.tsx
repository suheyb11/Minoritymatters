import type { Metadata } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/figtree";
import "./globals.css";

// Always read fresh data from the database, so admin changes show straight away
export const dynamic = "force-dynamic";

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
