"use client";

// Small building blocks for the admin forms, so every admin page looks the same.

import { useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { REFERRAL } from "@/lib/reasons";

export function Field({
  label,
  name,
  defaultValue = "",
  type = "text",
  required = false,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">
        {label} {required && <span className="text-pink">*</span>}
      </span>
      <input name={name} type={type} defaultValue={defaultValue} required={required} className="field" />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function TextArea({
  label,
  name,
  defaultValue = "",
  rows = 4,
  required = false,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">
        {label} {required && <span className="text-pink">*</span>}
      </span>
      <textarea name={name} defaultValue={defaultValue} rows={rows} required={required} className="field leading-relaxed" />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Checkbox({ label, name, defaultChecked }: { label: string; name: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center gap-3 text-sm font-semibold">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-5 w-5 accent-[#e71d73]" />
      {label}
    </label>
  );
}

// Image: type an address OR upload a file. Shows a preview.
export function ImageField({ label, name, defaultValue = "" }: { label: string; name: string; defaultValue?: string }) {
  const [preview, setPreview] = useState(defaultValue);
  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      <div className="flex gap-4 rounded-xl border border-dashed border-grey p-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-mist">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-xs text-muted">No image</span>
          )}
        </div>
        <div className="flex-1 space-y-3">
          <input
            name={name}
            defaultValue={defaultValue}
            onChange={(e) => setPreview(e.target.value)}
            placeholder="/images/... or https://..."
            className="field"
          />
          <input
            type="file"
            name={name + "File"}
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setPreview(URL.createObjectURL(file));
            }}
            className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-pink-soft file:px-4 file:py-2 file:font-semibold file:text-pink"
          />
          <p className="text-xs text-muted">Upload a new image, or paste an image address. Max 4 MB.</p>
        </div>
      </div>
    </div>
  );
}

export function SaveButton({ label = "Save" }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-pink px-6 py-2.5 font-semibold text-white transition-colors hover:bg-pink-dark disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

// A delete button that asks "Are you sure?" first
export function DeleteButton({ message = "Delete this item? This cannot be undone." }: { message?: string }) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
      className="rounded-full px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
    >
      Delete
    </button>
  );
}

// Header row on each admin page
export function AdminTitle({ title, newHref, newLabel }: { title: string; newHref?: string; newLabel?: string }) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      {newHref && (
        <Link href={newHref} className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink">
          {newLabel || "Add new"}
        </Link>
      )}
    </div>
  );
}

// Green / red message after saving, based on the page address (?saved=1 etc.)
export function Notice({ saved, deleted, error }: { saved?: string; deleted?: string; error?: string }) {
  if (error === "slug")
    return (
      <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        That web address (slug) is already used. Change the title or the slug and save again.
      </p>
    );
  if (saved) return <p className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800">Saved. The website is updated.</p>;
  if (deleted) return <p className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800">Deleted.</p>;
  return null;
}

// The reason a message was sent. "Make a referral" is pink so it stands out.
export function ReasonBadge({ reason }: { reason: string }) {
  const referral = reason === REFERRAL;
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${referral ? "bg-pink-soft text-pink ring-1 ring-pink" : "bg-mist text-muted"}`}
    >
      {reason}
    </span>
  );
}
