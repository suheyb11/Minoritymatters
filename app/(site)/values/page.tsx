import { getValues } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import { Reveal } from "@/components/Motion";

export const metadata = { title: "Values" };

export default function ValuesPage() {
  const values = getValues();

  return (
    <>
      <PageHeader title="values" arc={0.85} intro="The nine principles behind every programme we run." />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <ul className="grid gap-px overflow-hidden rounded-[2rem] bg-grey/40 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((v, i) => (
            <li key={v.id} className="group bg-white p-8 sm:p-10">
              <Reveal delay={(i % 3) * 0.1}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={v.icon}
                  alt=""
                  className="h-24 w-24 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"
                />
                <h2 className="mt-6 font-display text-2xl font-semibold text-pink">{v.title}</h2>
                <p className="mt-3 leading-relaxed text-muted">{v.text}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
