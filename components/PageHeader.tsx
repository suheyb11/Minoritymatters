import { Ring, Reveal } from "./Motion";

// The coloured title band at the top of each inner page.
// "arc" sets how much of the ring is pink, so each page gets its own small variation.
export default function PageHeader({ title, intro, arc = 0.2 }: { title: string; intro?: string; arc?: number }) {
  return (
    <section className="relative overflow-hidden bg-mist">
      <div className="mx-auto flex max-w-7xl items-end justify-between gap-8 px-4 pb-14 pt-16 sm:px-6 sm:pb-20 sm:pt-24">
        <Reveal>
          <h1 className="font-display text-6xl font-bold lowercase leading-[0.9] text-pink sm:text-8xl">{title}</h1>
          {intro && <p className="mt-6 max-w-xl text-lg text-muted">{intro}</p>}
        </Reveal>
        <Ring size={150} arc={arc} stroke={5} className="hidden shrink-0 md:block" />
      </div>
    </section>
  );
}
