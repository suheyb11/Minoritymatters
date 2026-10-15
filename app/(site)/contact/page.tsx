import { getSettings } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import ContactForm from "./ContactForm";

export const metadata = { title: "Contact" };

export default async function ContactPage() {
  const settings = await getSettings();
  const mapQuery = encodeURIComponent(settings.address);

  return (
    <>
      <PageHeader title="contact" arc={0.45} intro="Questions about our programmes, support for your family, or working together — send us a message." />

      <section className="mx-auto grid max-w-7xl gap-14 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-8">
          <div>
            <h2 className="font-display text-2xl font-semibold text-pink">Visit us</h2>
            <p className="mt-2 text-lg">{settings.address}</p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block font-semibold underline-offset-4 hover:text-pink hover:underline"
            >
              Open in Google Maps
            </a>
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold text-pink">Call us</h2>
            <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="mt-2 block text-lg hover:text-pink">
              {settings.phone}
            </a>
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold text-pink">Email us</h2>
            <a href={`mailto:${settings.email}`} className="mt-2 block text-lg hover:text-pink">
              {settings.email}
            </a>
            <p className="mt-1 text-muted">
              Press: <a href={`mailto:${settings.pressEmail}`} className="hover:text-pink">{settings.pressEmail}</a>
            </p>
          </div>
          <p className="text-sm text-muted">Registered charity number {settings.charityNumber}</p>
        </div>

        <div className="rounded-[2rem] bg-mist p-6 sm:p-10">
          {settings.referralText && (
            <p className="mb-8 border-l-4 border-pink pl-5 text-lg leading-relaxed text-ink">{settings.referralText}</p>
          )}
          <ContactForm />
        </div>
      </section>
    </>
  );
}
