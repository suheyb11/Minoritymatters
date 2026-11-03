import { getSettings } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getMailConfig, mailReady, senderAddress } from "@/lib/mail";
import { saveSettings, saveMailSettings, sendTestEmail } from "../../actions";
import { Field, TextArea, ImageField, SaveButton, AdminTitle, Notice } from "@/components/AdminUI";

export default async function SettingsAdmin({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; mail?: string; to?: string }>;
}) {
  const { saved, mail: mailState, to } = await searchParams;
  const s = await getSettings();
  const admin = await requireAdmin();
  const mail = await getMailConfig();
  const ready = mailReady(mail);

  return (
    <>
      <AdminTitle title="Site settings" />
      <Notice saved={saved} />
      <form action={saveSettings} className="space-y-8">
        <fieldset className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
          <legend className="font-display text-xl font-bold">Home page</legend>
          <TextArea label="Hero text (under the big title)" name="heroTagline" defaultValue={s.heroTagline} rows={2} hint="Not shown on the website at the moment — the Tagline (Brochure text) is shown instead." />
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
          <Field label="Tagline" name="tagline" defaultValue={s.tagline} hint="Shown under the big title on the home page." />
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
          <Field label="Donate link 1 (PayPal)" name="donateUrl" type="url" defaultValue={s.donateUrl} />
          <Field
            label="Donate link 2 (Givey)"
            name="donateGiveyUrl"
            type="url"
            defaultValue={s.donateGiveyUrl}
            hint="When both links are filled in, the Donate buttons let people choose. Leave one empty to use only the other."
          />
          <Field
            label="Booking notification email"
            name="bookingNotifyEmail"
            type="email"
            defaultValue={s.bookingNotifyEmail}
            hint="Optional: we email this address when someone books a place on an event. Empty = no emails (bookings are always saved under Events > Bookings)."
          />
          <Field
            label="Contact form email"
            name="contactNotifyEmail"
            type="email"
            defaultValue={s.contactNotifyEmail}
            hint="We email a copy of every contact form message to this address, and email answers to your replies go here. Empty = no copies (messages are always saved under Messages)."
          />
        </fieldset>

        <fieldset className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 sm:grid-cols-2">
          <legend className="font-display text-xl font-bold">Social media</legend>
          <Field label="TikTok" name="tiktokUrl" defaultValue={s.tiktokUrl} hint="Leave empty to hide" />
          <Field label="X (Twitter)" name="xUrl" defaultValue={s.xUrl} />
          <Field label="Facebook" name="facebookUrl" defaultValue={s.facebookUrl} />
          <Field label="YouTube" name="youtubeUrl" defaultValue={s.youtubeUrl} />
          <Field label="Instagram" name="instagramUrl" defaultValue={s.instagramUrl} />
          <Field label="LinkedIn" name="linkedinUrl" defaultValue={s.linkedinUrl} />
        </fieldset>

        <div className="sticky bottom-4">
          <SaveButton label="Save settings" />
        </div>
      </form>

      {/* ---------- Email sending (Administrator only): see lib/mail.ts ---------- */}
      {admin.isAdministrator && (
        <section id="mail" className="mt-12 scroll-mt-6 space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-display text-xl font-bold">Email sending</h2>
          <p className="max-w-3xl text-sm text-muted">
            The website sends emails (replies from Messages, contact form copies, booking notices) through your Google account, from
            your own address. Then they reach people&apos;s inbox instead of Spam, and a copy is kept in that mailbox&apos;s
            &quot;Sent&quot; folder. When people answer your replies by email, their answers are also added to their conversation in
            Messages (the website reads that mailbox, read-only, and only copies emails from people who wrote through the website).
          </p>
          <p className={`text-sm font-semibold ${ready ? "text-green-700" : "text-red-700"}`}>
            {ready
              ? `On: emails are sent through ${mail.host} as ${senderAddress(mail)}.`
              : "Off: replies from Messages can't be sent by email until this is filled in."}
          </p>
          {mailState === "saved" && (
            <p className="rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800" role="status">
              Saved. Send a test email below to check it works.
            </p>
          )}
          {mailState === "sent" && (
            <p className="rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800" role="status">
              Test email sent to {to}. Check that it arrived in the inbox (not Spam).
            </p>
          )}
          {mailState === "bad-to" && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
              Please enter a valid email address for the test.
            </p>
          )}
          {mailState === "failed" && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
              The test email could not be sent{mail.lastError ? `: ${mail.lastError}` : "."}
              {/auth|credentials|password/i.test(mail.lastError) && (
                <>
                  <br />
                  Check the Google account email and the App password (16 letters).
                </>
              )}
            </p>
          )}

          <form action={saveMailSettings} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Google account (email)"
                name="user"
                type="email"
                defaultValue={mail.user}
                hint="The Google Workspace mailbox that sends the emails, e.g. info@minoritymatters.org.uk."
              />
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-ink">App password</span>
                <input
                  name="pass"
                  type="password"
                  placeholder={mail.pass ? "•••••••••••••••• (saved)" : "16 letters from Google"}
                  autoComplete="new-password"
                  className="field"
                />
                <span className="mt-1 block text-xs text-muted">
                  Not the normal password: a Google &quot;App password&quot;. Leave empty to keep the saved one.
                </span>
              </label>
              <Field
                label="Send as"
                name="fromAddress"
                type="email"
                defaultValue={mail.fromAddress}
                hint="Optional. Must be the account itself or one of its aliases in Google."
              />
              <div className="grid grid-cols-[1fr_7rem] gap-3">
                <Field label="Mail server" name="host" defaultValue={mail.host} />
                <Field label="Port" name="port" type="number" defaultValue={mail.port} />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <SaveButton label="Save email sending" />
              {mail.pass && (
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input type="checkbox" name="forget" className="h-4 w-4 accent-[#e71d73]" /> Remove the saved password (turns it off)
                </label>
              )}
            </div>
          </form>

          <form action={sendTestEmail} className="flex flex-wrap items-end gap-3 border-t border-gray-200 pt-4">
            <div className="min-w-64 flex-1">
              <Field label="Send a test email to" name="to" type="email" defaultValue={to || s.email} required />
            </div>
            <SaveButton label="Send test email" />
          </form>
        </section>
      )}
    </>
  );
}
