"use client";

// The parts of Admin > Messages that run in the browser: the reply form (with files),
// live updates, and showing the newest message of a conversation.

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { prepareAttachments, sendReply } from "../../actions";

const fileProblems = {
  files: "Please attach at most 5 files.",
  "file-size": "The files are too big: at most 10 MB each, and 20 MB together.",
  "file-type": "That kind of file cannot be sent. Please use PDF, Word, Excel, PowerPoint, text, photo or ZIP files.",
  "file-failed": "A file could not be uploaded. Please try again.",
};

export function ReplyForm({ email, name, accept, max, children }: { email: string; name: string; accept: string; max: number; children: React.ReactNode }) {
  const [pending, startTransition] = useTransition();
  const [problem, setProblem] = useState("");
  const filesRef = useRef<HTMLInputElement>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    data.delete("attach");
    // The same limits as the server (lib/conversations.ts), checked here first so the reply is not lost
    const chosen = Array.from(filesRef.current?.files ?? []);
    const total = chosen.reduce((sum, f) => sum + f.size, 0);
    if (chosen.length > max) return setProblem(fileProblems.files);
    if (chosen.some((f) => f.size > 10 * 1024 * 1024) || total > 20 * 1024 * 1024) return setProblem(fileProblems["file-size"]);
    setProblem("");

    startTransition(async () => {
      let files: { name: string; path: string }[] = [];
      if (chosen.length) {
        // The files go straight to Storage (Vercel refuses requests bigger than 4.5 MB)
        const result = await prepareAttachments(chosen.map((f) => ({ name: f.name, size: f.size })));
        if ("error" in result) return setProblem(fileProblems[result.error!]);
        for (let i = 0; i < chosen.length; i++) {
          const body = new FormData();
          body.append("cacheControl", "3600");
          body.append("", chosen[i]);
          const response = await fetch(result.uploads[i].url, { method: "PUT", body }).catch(() => null);
          if (!response?.ok) return setProblem(fileProblems["file-failed"]);
        }
        files = result.uploads.map((u) => ({ name: u.name, path: u.path }));
      }
      data.set("files", JSON.stringify(files));
      await sendReply(data);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3 border-t border-gray-200 bg-white p-5">
      <span id="reply" className="block scroll-mt-6" />
      <input type="hidden" name="with" value={email} />
      {problem && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
          {problem}
        </p>
      )}
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-muted">Subject</span>
        <input name="subject" defaultValue="Re: your message to Minority Matters" maxLength={200} className="field" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-muted">Reply to {name}</span>
        <textarea
          name="body"
          rows={5}
          required
          maxLength={10000}
          placeholder="Write your reply…"
          className="field leading-relaxed"
          data-reply-box
          // Ctrl+Enter (or Cmd+Enter) sends the reply
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) e.currentTarget.form?.requestSubmit();
          }}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-muted">Attach files (optional)</span>
        <input
          ref={filesRef}
          type="file"
          name="attach"
          multiple
          accept={accept}
          data-reply-files
          className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-pink-soft file:px-4 file:py-2 file:font-semibold file:text-pink"
        />
        <span className="mt-1 block text-xs text-muted">
          Up to {max} files, 10 MB each (20 MB together): PDF, Word, Excel, PowerPoint, text, photos or ZIP.
        </span>
      </label>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">{children}</p>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-pink px-6 py-2.5 font-semibold text-white transition-colors hover:bg-pink-dark disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send reply"}
        </button>
      </div>
    </form>
  );
}

// Live updates: every 15 seconds ask whether a message or reply came in (/admin/messages/stamp).
// If so, refresh the page's content. A reply being written stays as it is.
export function LiveRefresh() {
  const router = useRouter();
  useEffect(() => {
    let stamp = "";
    let busy = false;
    let stopped = false;
    const check = async () => {
      if (stopped || busy || document.visibilityState !== "visible") return;
      busy = true;
      try {
        const response = await fetch("/admin/messages/stamp", { cache: "no-store" });
        if (response.status === 401) stopped = true; // logged out: stop asking
        const data = response.ok ? await response.json() : null;
        if (data?.stamp) {
          if (stamp && data.stamp !== stamp) router.refresh();
          stamp = data.stamp;
        }
      } catch {
        // offline for a moment: try again next time
      }
      busy = false;
    };
    check();
    const timer = window.setInterval(check, 15000);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [router]);
  return null;
}

// The list of a conversation: starts at the newest message, and stays there when new ones arrive
export function ScrollToEnd({ className, children }: { className: string; children: React.ReactNode }) {
  const ref = useRef<HTMLOListElement>(null);
  const atEnd = useRef(true);
  useLayoutEffect(() => {
    if (ref.current && atEnd.current) ref.current.scrollTop = ref.current.scrollHeight;
  });
  return (
    <ol
      ref={ref}
      className={className}
      onScroll={(e) => {
        const el = e.currentTarget;
        atEnd.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
      }}
    >
      {children}
    </ol>
  );
}
