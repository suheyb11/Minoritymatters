import { getSettings } from "@/lib/db";
import { saveSettings } from "../../actions";
import { Field, TextArea, SaveButton, AdminTitle, Notice } from "@/components/AdminUI";

export default async function SettingsAdmin({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const s = getSettings();

  return (
    <>
      <AdminTitle title="Site settings" />
      <Notice saved={saved} />
      <form action={saveSettings} className="space-y-8">
        <fieldset className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
          <legend className="font-display text-xl font-bold">Home page</legend>
          <TextArea label="Hero text (under the big title)" name="heroTagline" defaultValue={s.heroTagline} rows={2} />
          <Field label="Welcome heading" name="introHeading" defaultValue={s.introHeading} />
          <Field label="Welcome subtitle" name="introSubtitle" defaultValue={s.introSubtitle} />
          <TextArea label="Welcome text" name="introText" defaultValue={s.introText} rows={5} />
        </fieldset>

        <fieldset className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
          <legend className="font-display text-xl font-bold">About page</legend>
          <TextArea label="Lead paragraph" name="aboutLead" defaultValue={s.aboutLead} rows={3} hint="Words between *stars* are shown in pink." />
          <TextArea label="Our story" name="aboutStory" defaultValue={s.aboutStory} rows={5} />
          <TextArea label="Our vision" name="vision" defaultValue={s.vision} rows={4} />
          <TextArea label="Our mission" name="mission" defaultValue={s.mission} rows={10} hint="Leave an empty line between paragraphs." />
        </fieldset>

        <fieldset className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 sm:grid-cols-2">
          <legend className="font-display text-xl font-bold">Contact details</legend>
          <Field label="Address" name="address" defaultValue={s.address} />
          <Field label="Telephone" name="phone" defaultValue={s.phone} />
          <Field label="Email" name="email" type="email" defaultValue={s.email} />
          <Field label="Press email" name="pressEmail" type="email" defaultValue={s.pressEmail} />
          <Field label="Charity number" name="charityNumber" defaultValue={s.charityNumber} />
          <Field label="Donate link (PayPal)" name="donateUrl" type="url" defaultValue={s.donateUrl} />
        </fieldset>

        <fieldset className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 sm:grid-cols-2">
          <legend className="font-display text-xl font-bold">Social media</legend>
          <Field label="TikTok" name="tiktokUrl" defaultValue={s.tiktokUrl} hint="Leave empty to hide" />
          <Field label="X (Twitter)" name="xUrl" defaultValue={s.xUrl} />
          <Field label="Facebook" name="facebookUrl" defaultValue={s.facebookUrl} />
          <Field label="YouTube" name="youtubeUrl" defaultValue={s.youtubeUrl} />
        </fieldset>

        <div className="sticky bottom-4">
          <SaveButton label="Save settings" />
        </div>
      </form>
    </>
  );
}
