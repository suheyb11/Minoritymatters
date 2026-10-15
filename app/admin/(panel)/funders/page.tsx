import Link from "next/link";
import { getFunders, getRowById, type Funder } from "@/lib/db";
import { saveFunder, deleteFunder } from "../../actions";
import { Field, ImageField, Checkbox, SaveButton, DeleteButton, AdminTitle, Notice } from "@/components/AdminUI";

type Params = { edit?: string; new?: string; saved?: string; deleted?: string };

export default async function FundersAdmin({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const funders = getFunders();
  const editing = params.edit ? getRowById<Funder>("Funder", Number(params.edit)) : undefined;
  const showForm = Boolean(editing || params.new);

  return (
    <>
      <AdminTitle title="Funders and partners" newHref="/admin/funders?new=1" newLabel="Add funder" />
      <Notice saved={params.saved} deleted={params.deleted} />

      {showForm && (
        <form action={saveFunder} className="mb-10 space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-display text-xl font-bold">{editing ? "Edit funder" : "New funder"}</h2>
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <Field label="Name" name="name" defaultValue={editing?.name} required />
          <Field label="Website (optional)" name="url" type="url" defaultValue={editing?.url} />
          <ImageField label="Logo (optional)" name="logo" defaultValue={editing?.logo} />
          <Field label="Order" name="sortOrder" type="number" defaultValue={editing?.sortOrder ?? funders.length + 1} />
          <Checkbox label="Show logo in the strip on the home page" name="showLogo" defaultChecked={editing ? editing.showLogo === 1 : false} />
          <div className="flex gap-3">
            <SaveButton />
            <Link href="/admin/funders" className="rounded-full px-5 py-2.5 font-semibold text-muted hover:bg-mist">Cancel</Link>
          </div>
        </form>
      )}

      <ul className="divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
        {funders.map((f) => (
          <li key={f.id} className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-20 shrink-0 items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {f.logo && <img src={f.logo} alt="" className="max-h-10 max-w-20 object-contain" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{f.name}</p>
              {f.showLogo === 1 && <p className="text-xs text-pink">On home page</p>}
            </div>
            <Link href={`/admin/funders?edit=${f.id}`} className="rounded-full px-3 py-1.5 text-sm font-semibold text-pink hover:bg-pink-soft">Edit</Link>
            <form action={deleteFunder}>
              <input type="hidden" name="id" value={f.id} />
              <DeleteButton />
            </form>
          </li>
        ))}
      </ul>
    </>
  );
}
