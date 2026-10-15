import { getPress, getSettings } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import { Reveal } from "@/components/Motion";

export const metadata = { title: "Press" };

export default async function PressPage() {
  const press = await getPress();
  const settings = await getSettings();

  return (
    <>
      <PageHeader title="press" arc={0.12} intro="Coverage of our work with families affected by county lines and criminal exploitation." />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="text-lg">
          For press enquiries contact{" "}
          <a href={`mailto:${settings.pressEmail}`} className="font-semibold text-pink underline-offset-4 hover:underline">
            {settings.pressEmail}
          </a>
        </p>

        <ul className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {press.map((item, i) => (
            <li key={item.id}>
              <Reveal delay={(i % 3) * 0.08}>
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="group block">
                  <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-mist">
                    {item.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt=""
                        className="h-full w-full object-cover grayscale transition duration-500 group-hover:scale-105 group-hover:grayscale-0"
                      />
                    )}
                  </div>
                  <p className="mt-4 text-sm font-semibold text-pink">{item.source}</p>
                  <h2 className="mt-1 font-display text-xl font-semibold leading-snug group-hover:underline">
                    {item.title}
                  </h2>
                  <span className="mt-2 inline-block text-sm text-muted">Opens on {item.source || "the publisher's site"}</span>
                </a>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
