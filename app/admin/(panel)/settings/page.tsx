import { getSettings } from "@/lib/db";
import { saveSettings } from "../../actions";
import { Field, TextArea, ImageField, SaveButton, AdminTitle, Notice } from "@/components/AdminUI";

export default async function SettingsAdmin({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const s = await getSettings();

  return (
    <>
      <AdminTitle title="Site settings" />
      <Notice saved={saved} />
      <form action={saveSettings} className="space-y-8">
        <fieldset className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
          <legend className="font-display text-xl font-bold">Home page</legend>
          <TextArea label="Hero text (under the big title)" name="heroTagline" defaultValue={s.heroTagline} rows={2} hint="Not shown on the website at the moment — the pink tagline (Brochure text) is shown instead." />
          <Field label="Welcome heading" name="introHeading" defaultValue={s.introHeading} />
          <Field label="Welcome subtitle" name="introSubtitle" defaultValue={s.introSubtitle} />
          <TextArea label="Welcome text" name="introText" defaultValue={s.introText} rows={5} />
        </fieldset>

        <fieldset className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
          <legend className="font-display text-xl font-bold">Brochure text</legend>
          <TextArea
            label="Who we are"
            name="whoWeAre"
            defaultValue={s.whoWeAre}
            rows={7}
            hint="Shown on the home page and the About page. Leave an empty line between paragraphs — the second paragraph is also the intro on the Our work page."
          />
          <TextArea
            label="Referral text"
            name="referralText"
            defaultValue={s.referralText}
            rows={3}
            hint="Shown in the pink band on the Our work page and above the contact form."
          />
          <Field label="Tagline" name="tagline" defaultValue={s.tagline} hint="Shown in pink under the big title on the home page." />
          <Field
            label="Community line"
            name="communityLine"
            defaultValue={s.communityLine}
            hint="Shown on the large photo on the Our work page and in the footer."
          />
        </fieldset>

        <fieldset className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
          <legend className="font-display text-xl font-bold">Founder video</legend>
          <p className="text-sm text-muted">
            Shown on the <a href="/our-founder" target="_blank" className="font-semibold text-pink hover:underline">Our founder</a> page.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Founder's name" name="founderName" defaultValue={s.founderName} />
            <Field label="Role" name="founderRole" defaultValue={s.founderRole} />
          </div>
          <Field
            label="Video link"
            name="founderVideoUrl"
            defaultValue={s.founderVideoUrl}
            hint="Paste a YouTube or Vimeo link, or a link to an .mp4 file."
          />
          <ImageField label="Photo (shown before the video plays)" name="founderPhoto" defaultValue={s.founderPhoto} />
          <TextArea label="Introduction" name="founderIntro" defaultValue={s.founderIntro} rows={3} />
          <TextArea
            label="Transcript"
            name="founderTranscript"
            defaultValue={s.founderTranscript}
            rows={10}
            hint="Start a line with [mm:ss] to add a timestamp. Leave an empty line between paragraphs."
          />
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
