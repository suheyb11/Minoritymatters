import Link from "next/link";
import { getSettings } from "@/lib/db";
import { donateOptions } from "@/lib/donate";
import PageHeader from "@/components/PageHeader";
import { Reveal } from "@/components/Motion";
import { DonateChoices } from "@/components/Donate";

export const metadata = { title: "Donate" };

// /donate: the ways to donate (PayPal, Givey). The Donate buttons open the same choice in a window;
// this page is for links shared elsewhere and for browsers without JavaScript.
export default async function DonatePage() {
  const settings = await getSettings();
  const options = donateOptions(settings);

  return (
    <>
      <PageHeader
        title="donate"
        arc={0.6}
        intro="Your donation funds tutoring, parent programmes and support for families affected by exploitation."
      />

      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
        <Reveal>
          <h2 className="mb-6 font-display text-3xl font-bold text-ink">Choose how you would like to give</h2>
          {options.length ? (
            <DonateChoices options={options} />
          ) : (
            <p className="text-muted">Online donations are not open at the moment. Please contact us to support our work.</p>
          )}
          <p className="mt-8 text-muted">
            Registered charity number {settings.charityNumber}. Questions about giving?{" "}
            <Link href="/contact" className="font-semibold text-pink underline-offset-4 hover:underline">
              Contact us
            </Link>
            .
          </p>
        </Reveal>
      </section>
    </>
  );
}
