// The ways to donate that are filled in under Admin > Site settings (PayPal, Givey).
// The buttons and the "choose how to donate" window are in components/Donate.tsx.

export type DonateOption = { name: string; text: string; url: string };

export function donateOptions(settings: { donateUrl: string; donateGiveyUrl: string }): DonateOption[] {
  return [
    { name: "PayPal", text: "Give with your PayPal account or a debit or credit card.", url: settings.donateUrl },
    { name: "Givey", text: "Give through our Givey page.", url: settings.donateGiveyUrl },
  ].filter((o) => o.url.trim());
}
