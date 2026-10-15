import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSettings } from "@/lib/db";

// Layout for every public page: header on top, footer at the bottom
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded focus:bg-white focus:px-4 focus:py-2">
        Skip to content
      </a>
      <Header donateUrl={settings.donateUrl} />
      {/* overflow-x-clip: soft photo hazes may spread past the edge of the screen without causing sideways scrolling */}
      <main id="main" className="overflow-x-clip">
        {children}
      </main>
      <Footer settings={settings} />
    </>
  );
}
