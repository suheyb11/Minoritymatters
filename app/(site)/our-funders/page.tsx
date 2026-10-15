import { getFunders } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import { Reveal } from "@/components/Motion";

export const metadata = { title: "Our funders" };

export default async function FundersPage() {
  const funders = await getFunders();
  const withLogo = funders.filter((f) => f.logo);

  return (
    <>
      <PageHeader
        title="our funders"
        arc={0.25}
        intro="Our work is possible thanks to the trusts, councils and partners who fund it. Thank you."
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {withLogo.map((f, i) => (
            <li key={f.id}>
              <Reveal delay={(i % 3) * 0.08}>
                <a
                  href={f.url || undefined}
                  target={f.url ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="flex h-36 items-center justify-center rounded-2xl border border-mist bg-white p-6 transition-colors hover:border-pink"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.logo} alt={f.name} className="max-h-16 w-auto max-w-full object-contain" />
                </a>
              </Reveal>
            </li>
          ))}
        </ul>

        <div className="mt-20 grid gap-10 lg:grid-cols-[1fr_2fr]">
          <h2 className="font-display text-4xl font-bold leading-tight">Our current and previous funders include</h2>
          <ul className="divide-y divide-grey/40 border-y border-grey/40">
            {funders.map((f) => (
              <li key={f.id} className="flex items-center gap-4 py-4 text-lg">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-pink" aria-hidden="true" />
                {f.url ? (
                  <a href={f.url} target="_blank" rel="noopener noreferrer" className="hover:text-pink">
                    {f.name}
                  </a>
                ) : (
                  <span>{f.name}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
