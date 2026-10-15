import Link from "next/link";
import { getValues, prisma } from "@/lib/db";
import { saveValue, deleteValue } from "../../actions";
import { Field, TextArea, ImageField, SaveButton, DeleteButton, AdminTitle, Notice } from "@/components/AdminUI";

type Params = { edit?: string; new?: string; saved?: string; deleted?: string };

export default async function ValuesAdmin({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const values = await getValues();
  const editing = params.edit ? await prisma.value.findUnique({ where: { id: Number(params.edit) } }) : null;
  const showForm = Boolean(editing || params.new);

  return (
    <>
      <AdminTitle title="Values" newHref="/admin/values?new=1" newLabel="Add value" />
      <Notice saved={params.saved} deleted={params.deleted} />

      {showForm && (
        <form action={saveValue} className="mb-10 space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-display text-xl font-bold">{editing ? "Edit value" : "New value"}</h2>
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <Field label="Title" name="title" defaultValue={editing?.title} required />
          <TextArea label="Text" name="text" defaultValue={editing?.text} rows={4} />
          <ImageField label="Icon" name="icon" defaultValue={editing?.icon} />
          <Field label="Order" name="sortOrder" type="number" defaultValue={editing?.sortOrder ?? values.length + 1} />
          <div className="flex gap-3">
            <SaveButton />
            <Link href="/admin/values" className="rounded-full px-5 py-2.5 font-semibold text-muted hover:bg-mist">Cancel</Link>
          </div>
        </form>
      )}

      <ul className="divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
        {values.map((v) => (
          <li key={v.id} className="flex items-center gap-4 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={v.icon} alt="" className="h-10 w-10 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{v.title}</p>
              <p className="truncate text-sm text-muted">{v.text}</p>
            </div>
            <Link href={`/admin/values?edit=${v.id}`} className="rounded-full px-3 py-1.5 text-sm font-semibold text-pink hover:bg-pink-soft">Edit</Link>
            <form action={deleteValue}>
              <input type="hidden" name="id" value={v.id} />
              <DeleteButton />
            </form>
          </li>
        ))}
      </ul>
    </>
  );
}
