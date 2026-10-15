// The choices in the "Reason" box on the contact form.
// Used by the form, by the server check in app/(site)/contact/actions.ts, and by the admin.
// (Kept in its own small file so the contact form can use it without loading the database code.)

export const REASONS = ["General enquiry", "Make a referral", "Advice", "Press", "Volunteering"];

export const REFERRAL = "Make a referral";
