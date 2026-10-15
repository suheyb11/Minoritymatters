import Link from "next/link";
import { Ring } from "@/components/Motion";

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center px-4 py-28 text-center">
      <Ring size={120} arc={0.04} />
      <h1 className="mt-8 font-display text-5xl font-bold lowercase text-pink">page not found</h1>
      <p className="mt-4 text-lg text-muted">This page has moved or no longer exists.</p>
      <Link href="/" className="mt-8 rounded-full bg-pink px-6 py-3.5 font-semibold text-white hover:bg-pink-dark">
        Go to the home page
      </Link>
    </section>
  );
}
