import Link from "next/link";
import { getServices, getRowById, type Service } from "@/lib/db";
import { saveService, deleteService } from "../../actions";
import { Field, TextArea, ImageField, Checkbox, SaveButton, DeleteButton, AdminTitle, Notice } from "@/components/AdminUI";

type Params = { edit?: string; new?: string; saved?: string; deleted?: string; error?: string };

export default async function ServicesAdmin({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const services = getServices(true);
  const editing = params.edit ? getRowById<Service>("Service", Number(params.edit)) : undefined;
  const showForm = Boolean(editing || params.new);

  return (
    <>
      <AdminTitle title="Our work (programmes)" newHref="/admin/services?new=1" newLabel="Add programme" />
      <Notice saved={params.saved} deleted={params.deleted} error={params.error} />

      {showForm && (
        <form action={saveService} className="mb-10 space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-display text-xl font-bold">{editing ? "Edit programme" : "New programme"}</h2>
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <Field label="Title" name="title" defaultValue={editing?.title} required />
          <Field label="Short summary" name="summary" defaultValue={editing?.summary} hint="One sentence, shown on the home page and in the list." />
          <TextArea label="Introduction" name="intro" defaultValue={editing?.intro} rows={2} />
          <TextArea label="Bullet points" name="points" defaultValue={editing?.points} rows={8} hint="Write one bullet point per line." />
          <TextArea label="Extra paragraphs" name="outro" defaultValue={editing?.outro} rows={5} hint="Leave an empty line between paragraphs." />
          <ImageField label="Icon" name="icon" defaultValue={editing?.icon ?? "/images/icons/promotion.svg"} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Web address (slug)" name="slug" defaultValue={editing?.slug} hint="Leave empty to create it from the title." />
            <Field label="Order" name="sortOrder" type="number" defaultValue={editing?.sortOrder ?? services.length + 1} hint="Lower numbers show first." />
          </div>
          <Checkbox label="Show on website" name="published" defaultChecked={editing ? editing.published === 1 : true} />
          <div className="flex gap-3">
            <SaveButton />
            <Link href="/admin/services" className="rounded-full px-5 py-2.5 font-semibold text-muted hover:bg-mist">Cancel</Link>
          </div>
        </form>
      )}

      <ul className="divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
        {services.map((s) => (
          <li key={s.id} className="flex items-center gap-4 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.icon} alt="" className="h-10 w-10 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {s.title} {!s.published && <span className="ml-2 rounded bg-mist px-2 py-0.5 text-xs text-muted">Hidden</span>}
              </p>
              <p className="truncate text-sm text-muted">{s.summary}</p>
            </div>
            <Link href={`/admin/services?edit=${s.id}`} className="rounded-full px-3 py-1.5 text-sm font-semibold text-pink hover:bg-pink-soft">Edit</Link>
            <form action={deleteService}>
              <input type="hidden" name="id" value={s.id} />
              <DeleteButton />
            </form>
          </li>
        ))}
      </ul>
    </>
  );
}
