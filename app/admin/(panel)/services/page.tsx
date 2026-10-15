import Link from "next/link";
import { getServices, prisma } from "@/lib/db";
import { saveService, deleteService } from "../../actions";
import { Field, TextArea, ImageField, Checkbox, SaveButton, DeleteButton, AdminTitle, Notice } from "@/components/AdminUI";

type Params = { edit?: string; new?: string; kind?: string; saved?: string; deleted?: string; error?: string };

export default async function ServicesAdmin({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const services = await getServices(true);
  const editing = params.edit ? await prisma.service.findUnique({ where: { id: Number(params.edit) } }) : null;
  const showForm = Boolean(editing || params.new);

  // The list is shown in two groups: the 5 main service areas, then the programmes
  const groups = [
    { kind: "area", label: "Service areas", rows: services.filter((s) => s.kind === "area") },
    { kind: "programme", label: "Programmes", rows: services.filter((s) => s.kind !== "area") },
  ];
  const newKind = (editing?.kind ?? params.kind) === "area" ? "area" : "programme";
  const nextOrder = (newKind === "area" ? groups[0] : groups[1]).rows.length + 1;

  return (
    <>
      <AdminTitle title="Our work" />
      <Notice saved={params.saved} deleted={params.deleted} error={params.error} />

      {showForm && (
        <form action={saveService} className="mb-10 space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-display text-xl font-bold">{editing ? "Edit" : "New"} {newKind === "area" ? "service area" : "programme"}</h2>
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">Type</span>
            <select name="kind" defaultValue={newKind} className="field">
              <option value="area">Service area (one of the 5 main areas)</option>
              <option value="programme">Programme (in the list that opens and closes)</option>
            </select>
          </label>
          <Field label="Title" name="title" defaultValue={editing?.title} required />
          <Field label="Short summary" name="summary" defaultValue={editing?.summary} hint="One sentence, shown on the home page and in the list." />
          <TextArea label="Introduction" name="intro" defaultValue={editing?.intro} rows={2} />
          <TextArea label="Bullet points" name="points" defaultValue={editing?.points} rows={8} hint="Write one bullet point per line." />
          <TextArea label="Extra paragraphs" name="outro" defaultValue={editing?.outro} rows={5} hint="Leave an empty line between paragraphs." />
          <ImageField label="Icon" name="icon" defaultValue={editing?.icon ?? "/images/icons/promotion.svg"} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Web address (slug)" name="slug" defaultValue={editing?.slug} hint="Leave empty to create it from the title." />
            <Field label="Order" name="sortOrder" type="number" defaultValue={editing?.sortOrder ?? nextOrder} hint="Lower numbers show first." />
          </div>
          <Checkbox label="Show on website" name="published" defaultChecked={editing ? editing.published : true} />
          <div className="flex gap-3">
            <SaveButton />
            <Link href="/admin/services" className="rounded-full px-5 py-2.5 font-semibold text-muted hover:bg-mist">Cancel</Link>
          </div>
        </form>
      )}

      {groups.map((group) => (
        <section key={group.kind} className="mb-10">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 className="font-display text-xl font-bold">{group.label}</h2>
            <Link href={`/admin/services?new=1&kind=${group.kind}`} className="text-sm font-semibold text-pink hover:underline">
              + Add {group.kind === "area" ? "service area" : "programme"}
            </Link>
          </div>
          <ul className="divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
            {group.rows.length === 0 && <li className="p-4 text-sm text-muted">None yet.</li>}
            {group.rows.map((s) => (
              <li key={s.id} className="flex items-center gap-4 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.icon} alt="" className="h-10 w-10 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {s.title}{" "}
                    <span
                      className={`ml-2 rounded px-2 py-0.5 text-xs font-semibold ${
                        s.kind === "area" ? "bg-pink-soft text-pink" : "bg-mist text-muted"
                      }`}
                    >
                      {s.kind === "area" ? "Service area" : "Programme"}
                    </span>
                    {!s.published && <span className="ml-2 rounded bg-mist px-2 py-0.5 text-xs text-muted">Hidden</span>}
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
        </section>
      ))}
    </>
  );
}
