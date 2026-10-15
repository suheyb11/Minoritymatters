"use client";

import { useActionState, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sendMessage, type ContactState } from "./actions";
import { REASONS, REFERRAL } from "@/lib/reasons";

const startState: ContactState = { ok: false, error: "" };

export default function ContactForm() {
  const [state, formAction, pending] = useActionState(sendMessage, startState);
  const [reason, setReason] = useState(REASONS[0]);

  // /contact?reason=referral opens the form with "Make a referral" already chosen
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("reason") === "referral") setReason(REFERRAL);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {state.ok ? (
        <motion.div
          key="done"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl bg-pink-soft p-10 text-center"
          role="status"
        >
          <p className="font-display text-3xl font-bold text-pink">Message sent</p>
          <p className="mt-3 text-muted">Thank you for getting in touch. We&apos;ll reply as soon as we can.</p>
        </motion.div>
      ) : (
        <motion.form key="form" action={formAction} className="space-y-5" exit={{ opacity: 0 }}>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">Name *</span>
              <input name="name" required autoComplete="name" className="field" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">Email *</span>
              <input name="email" type="email" required autoComplete="email" className="field" />
            </label>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">Phone</span>
              <input name="phone" type="tel" autoComplete="tel" className="field" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">Reason</span>
              <select name="reason" value={reason} onChange={(e) => setReason(e.target.value)} className="field">
                {REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Message *</span>
            <textarea name="message" required rows={6} className="field" />
          </label>
          {/* Hidden spam trap */}
          <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

          {state.error && (
            <p className="rounded-lg bg-pink-soft px-4 py-3 text-sm font-medium text-pink-dark" role="alert">
              {state.error}
            </p>
          )}
          <p className="text-sm text-muted">* required</p>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-pink px-7 py-3.5 font-semibold text-white transition-colors hover:bg-pink-dark disabled:opacity-60"
          >
            {pending ? "Sending…" : "Send message"}
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
