import Link from "next/link";
import { getProjects, getServices, prisma, PROJECT_CATEGORIES } from "@/lib/db";
import { saveProject, deleteProject } from "../../actions";
import { Field, TextArea, ImageField, Checkbox, SaveButton, DeleteButton, AdminTitle, Notice } from "@/components/AdminUI";

type Params = { edit?: string; new?: string; saved?: string; deleted?: string; error?: string };

export default async function ProjectsAdmin({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const projects = await getProjects(undefined, true);
  const services = await getServices(true);
  const editing = params.edit ? await prisma.project.findUnique({ where: { id: Number(params.edit) } }) : null;
  const showForm = Boolean(editing || params.new);

  // The list is grouped by period, newest period first
  const periods = [...new Set(projects.map((p) => p.period))].sort().reverse();
  const newestPeriod = periods[0] ?? "";

  return (
    <>
      <AdminTitle title="Projects" newHref="/admin/projects?new=1" newLabel="Add project" />
      <p className="-mt-4 mb-8 max-w-2xl text-sm text-muted">
        Projects are shown on the Impact page. The big total there adds up “People taking part” for every project in
        the same period.
      </p>
      <Notice saved={params.saved} deleted={params.deleted} error={params.error} />

      {showForm && (
        <form action={saveProject} className="mb-10 space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-display text-xl font-bold">{editing ? "Edit project" : "New project"}</h2>
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <Field label="Title" name="title" defaultValue={editing?.title} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Period" name="period" defaultValue={editing?.period ?? newestPeriod} required hint="For example 2025–26." />
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink">Category</span>
              <select name="category" defaultValue={editing?.category ?? PROJECT_CATEGORIES[0]} className="field">
                {PROJECT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <TextArea label="Summary" name="summary" defaultValue={editing?.summary} rows={2} hint="1–2 sentences, shown on the project card." />
          <TextArea label="Text" name="body" defaultValue={editing?.body} rows={10} hint="Leave an empty line between paragraphs." />
          <TextArea
            label="Numbers"
            name="stats"
            defaultValue={editing?.stats}
            rows={4}
            hint="One per line: number|label, e.g. 93|boys aged 11–16. The first one is shown big on the project card."
          />
          <Field
            label="People taking part"
            name="peopleReached"
            type="number"
            defaultValue={editing?.peopleReached ?? 0}
            hint="Added to the total on the Impact page. Use 0 to leave this project out of the total."
          />
          <ImageField label="Cover photo" name="coverImage" defaultValue={editing?.coverImage} />
          <div>
            <TextArea
              label="Gallery photos"
              name="gallery"
              defaultValue={editing?.gallery}
              rows={6}
              hint="One photo per line. You can add a short description after a | for people who can't see the photo, e.g. /images/projects/boxing/2.jpg | Children warming up on mats"
            />
            <label className="mt-3 block rounded-xl border border-dashed border-grey p-4">
              <span className="mb-2 block text-sm font-semibold text-ink">Add photos to the gallery</span>
              <input
                type="file"
                name="galleryFiles"
                accept="image/*"
                multiple
                className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-pink-soft file:px-4 file:py-2 file:font-semibold file:text-pink"
              />
              <span className="mt-2 block text-xs text-muted">
                The photos you choose are added to the end of the list when you save. Keep all photos together under 4 MB per
                save (add more in a second save if needed).
              </span>
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">Part of (service area)</span>
            <select name="relatedService" defaultValue={editing?.relatedService ?? ""} className="field">
              <option value="">None</option>
              {services.map((s) => (
                <option key={s.id} value={s.slug}>
                  {s.title}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-muted">The project is listed under this area on the Our work page.</span>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Web address (slug)" name="slug" defaultValue={editing?.slug} hint="Leave empty to create it from the title." />
            <Field label="Order" name="sortOrder" type="number" defaultValue={editing?.sortOrder ?? projects.length + 1} hint="Lower numbers show first." />
          </div>
          <Checkbox label="Show on website" name="published" defaultChecked={editing ? editing.published : true} />
          <fieldset className="space-y-4 rounded-xl border border-dashed border-grey p-4">
            <legend className="px-1 text-sm font-semibold text-ink">Home page</legend>
            <Checkbox label="Feature on the home page" name="isFeatured" defaultChecked={editing?.isFeatured ?? false} />
            <Field
              label="Home headline (optional)"
              name="featuredHeadline"
              defaultValue={editing?.featuredHeadline}
              hint="Shown as the big heading of the home page story. Leave empty to use the title. Only one project can be featured: ticking the box here removes it from the other project."
            />
          </fieldset>
          <div className="flex gap-3">
            <SaveButton />
            <Link href="/admin/projects" className="rounded-full px-5 py-2.5 font-semibold text-muted hover:bg-mist">
              Cancel
            </Link>
          </div>
        </form>
      )}

      {projects.length === 0 && <p className="text-muted">No projects yet.</p>}

      {periods.map((period) => {
        const rows = projects.filter((p) => p.period === period);
        const total = rows.filter((p) => p.published).reduce((sum, p) => sum + p.peopleReached, 0);
        return (
          <section key={period} className="mb-10">
            <h2 className="mb-3 font-display text-xl font-bold">
              {period || "No period"}{" "}
              <span className="text-sm font-normal text-muted">
                {rows.length} projects · {total} people taking part
              </span>
            </h2>
            <ul className="divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
              {rows.map((p) => (
                <li key={p.id} className="flex items-center gap-4 p-4">
                  {p.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.coverImage} alt="" className="h-12 w-16 shrink-0 rounded-md object-cover" />
                  ) : (
                    <span className="h-12 w-16 shrink-0 rounded-md bg-mist" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {p.title}{" "}
                      <span className="ml-2 rounded bg-pink-soft px-2 py-0.5 text-xs font-semibold text-pink">{p.category}</span>
                      {p.isFeatured && (
                        <span className="ml-2 rounded bg-pink px-2 py-0.5 text-xs font-semibold text-white">On home page</span>
                      )}
                      {!p.published && <span className="ml-2 rounded bg-mist px-2 py-0.5 text-xs text-muted">Hidden</span>}
                    </p>
                    <p className="truncate text-sm text-muted">{p.summary}</p>
                  </div>
                  <Link href={`/admin/projects?edit=${p.id}`} className="rounded-full px-3 py-1.5 text-sm font-semibold text-pink hover:bg-pink-soft">
                    Edit
                  </Link>
                  <form action={deleteProject}>
                    <input type="hidden" name="id" value={p.id} />
                    <DeleteButton />
                  </form>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
