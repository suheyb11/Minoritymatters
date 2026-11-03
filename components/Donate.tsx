"use client";

// Donating: the ways to donate filled in under Admin > Site settings (PayPal, Givey).
// With one way, every Donate button opens that page. With two, it opens the "choose how to donate" window
// (DonateDialog, once in the site layout), or the /donate page when JavaScript is off.

import { useEffect, useRef } from "react";
import type { DonateOption } from "@/lib/donate";

const OPEN_EVENT = "mm:donate";

export function DonateButton({ options, className, children }: { options: DonateOption[]; className: string; children: React.ReactNode }) {
  if (options.length === 1) {
    return (
      <a href={options[0].url} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <a
      href="/donate"
      className={className}
      onClick={(e) => {
        e.preventDefault();
        window.dispatchEvent(new Event(OPEN_EVENT));
      }}
    >
      {children}
    </a>
  );
}

// The list of ways to donate (in the window and on the /donate page)
export function DonateChoices({ options }: { options: DonateOption[] }) {
  return (
    <ul className="space-y-3">
      {options.map((o) => (
        <li key={o.name}>
          <a
            href={o.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between gap-4 rounded-2xl border-2 border-mist bg-white p-5 transition-colors hover:border-pink hover:bg-pink-soft/40"
          >
            <span>
              <span className="block font-display text-2xl font-semibold text-ink group-hover:text-pink">Donate with {o.name}</span>
              <span className="mt-1 block text-sm text-muted">{o.text}</span>
            </span>
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pink text-xl text-white transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            >
              →
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function DonateDialog({ options }: { options: DonateOption[] }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const open = () => ref.current?.showModal();
    window.addEventListener(OPEN_EVENT, open);
    // A shared link ending in #donate (for example on social media) opens the window straight away
    if (window.location.hash === "#donate") open();
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, []);

  if (options.length < 2) return null;
  return (
    <dialog
      ref={ref}
      aria-labelledby="donate-title"
      // A click on the dark background closes it
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      className="m-auto w-[min(92vw,32rem)] rounded-3xl bg-white p-0 text-ink shadow-2xl backdrop:bg-plum/70 backdrop:backdrop-blur-sm"
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <h2 id="donate-title" className="font-display text-3xl font-bold text-pink">
            Donate to our work
          </h2>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="Close"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mist text-2xl leading-none text-ink transition-colors hover:bg-pink hover:text-white"
          >
            ×
          </button>
        </div>
        <p className="mb-6 mt-2 text-muted">Choose how you would like to give. Thank you for supporting our community.</p>
        <DonateChoices options={options} />
      </div>
    </dialog>
  );
}
