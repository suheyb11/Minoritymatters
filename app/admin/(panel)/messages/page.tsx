import { getMessages } from "@/lib/db";
import { toggleMessageRead, deleteMessage } from "../../actions";
import { DeleteButton, AdminTitle, Notice } from "@/components/AdminUI";

export default async function MessagesAdmin({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const { deleted } = await searchParams;
  const messages = await getMessages();

  return (
    <>
      <AdminTitle title="Messages" />
      <Notice deleted={deleted} />
      {messages.length === 0 && (
        <p className="rounded-2xl border border-gray-200 bg-white p-6 text-muted">No messages yet. Messages sent from the contact page will appear here.</p>
      )}
      <ul className="space-y-4">
        {messages.map((m) => (
          <li key={m.id} className={`rounded-2xl border border-gray-200 bg-white p-6 ${m.isRead ? "" : "ring-2 ring-pink"}`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-semibold">
                  {m.name} {!m.isRead && <span className="ml-2 rounded-full bg-pink px-2 py-0.5 text-xs text-white">New</span>}
                </p>
                <p className="text-sm text-muted">
                  <a href={`mailto:${m.email}`} className="hover:text-pink">{m.email}</a>
                  {m.phone && <> · <a href={`tel:${m.phone}`} className="hover:text-pink">{m.phone}</a></>}
                </p>
              </div>
              <p className="text-sm text-muted">{m.createdAt.toLocaleString("en-GB")}</p>
            </div>
            <p className="mt-4 whitespace-pre-line leading-relaxed">{m.message}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your message to Minority Matters")}`} className="rounded-full bg-ink px-4 py-1.5 text-sm font-semibold text-white hover:bg-pink">
                Reply by email
              </a>
              <form action={toggleMessageRead}>
                <input type="hidden" name="id" value={m.id} />
                <button className="rounded-full px-3 py-1.5 text-sm font-semibold text-muted hover:bg-mist">
                  {m.isRead ? "Mark as unread" : "Mark as read"}
                </button>
              </form>
              <form action={deleteMessage}>
                <input type="hidden" name="id" value={m.id} />
                <DeleteButton message="Delete this message? This cannot be undone." />
              </form>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
