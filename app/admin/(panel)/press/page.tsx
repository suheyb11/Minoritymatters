import Link from "next/link";
import { getPress, prisma } from "@/lib/db";
import { savePress, deletePress } from "../../actions";
import { Field, ImageField, SaveButton, DeleteButton, AdminTitle, Notice } from "@/components/AdminUI";

type Params = { edit?: string; new?: string; saved?: string; deleted?: string };

export default async function PressAdmin({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const items = await getPress();
  const editing = params.edit ? await prisma.pressItem.findUnique({ where: { id: Number(params.edit) } }) : null;
  const showForm = Boolean(editing || params.new);

  return (
    <>
      <AdminTitle title="Press" newHref="/admin/press?new=1" newLabel="Add press item" />
      <Notice saved={params.saved} deleted={params.deleted} />

      {showForm && (
        <form action={savePress} className="mb-10 space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-display text-xl font-bold">{editing ? "Edit press item" : "New press item"}</h2>
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <Field label="Headline" name="title" defaultValue={editing?.title} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Publisher" name="source" defaultValue={editing?.source} hint="For example: The Guardian" />
            <Field label="Link to the article" name="url" type="url" defaultValue={editing?.url} required />
          </div>
          <ImageField label="Image" name="image" defaultValue={editing?.image} />
          <Field label="Order" name="sortOrder" type="number" defaultValue={editing?.sortOrder ?? 0} hint="Lower numbers show first." />
          <div className="flex gap-3">
            <SaveButton />
            <Link href="/admin/press" className="rounded-full px-5 py-2.5 font-semibold text-muted hover:bg-mist">Cancel</Link>
          </div>
        </form>
      )}

      <ul className="divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
        {items.map((p) => (
          <li key={p.id} className="flex items-center gap-4 p-4">
            <div className="h-12 w-16 shrink-0 overflow-hidden rounded bg-mist">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.image && <img src={p.image} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{p.title}</p>
              <p className="text-sm text-muted">{p.source}</p>
            </div>
            <Link href={`/admin/press?edit=${p.id}`} className="rounded-full px-3 py-1.5 text-sm font-semibold text-pink hover:bg-pink-soft">Edit</Link>
            <form action={deletePress}>
              <input type="hidden" name="id" value={p.id} />
              <DeleteButton />
            </form>
          </li>
        ))}
      </ul>
    </>
  );
}
