import Link from "next/link";
import { getPosts, getRowById, formatDate, type Post } from "@/lib/db";
import { savePost, deletePost } from "../../actions";
import { Field, TextArea, ImageField, Checkbox, SaveButton, DeleteButton, AdminTitle, Notice } from "@/components/AdminUI";

type Params = { edit?: string; new?: string; saved?: string; deleted?: string; error?: string };

export default async function BlogAdmin({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const posts = getPosts(true);
  const editing = params.edit ? getRowById<Post>("Post", Number(params.edit)) : undefined;
  const showForm = Boolean(editing || params.new);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <AdminTitle title="Blog" newHref="/admin/blog?new=1" newLabel="Write a post" />
      <Notice saved={params.saved} deleted={params.deleted} error={params.error} />

      {showForm && (
        <form action={savePost} className="mb-10 space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-display text-xl font-bold">{editing ? "Edit post" : "New post"}</h2>
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <Field label="Title" name="title" defaultValue={editing?.title} required />
          <TextArea label="Short excerpt" name="excerpt" defaultValue={editing?.excerpt} rows={2} hint="Shown in the blog list." />
          <TextArea label="Post text" name="body" defaultValue={editing?.body} rows={16} required hint="Leave an empty line between paragraphs." />
          <ImageField label="Cover image (optional)" name="coverImage" defaultValue={editing?.coverImage} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Author" name="author" defaultValue={editing?.author ?? "Minority Matters"} />
            <Field label="Date" name="publishedAt" type="date" defaultValue={editing ? editing.publishedAt.slice(0, 10) : today} />
            <Field label="Web address (slug)" name="slug" defaultValue={editing?.slug} hint="Empty = made from the title." />
          </div>
          <Checkbox label="Published (visible on the website)" name="published" defaultChecked={editing ? editing.published === 1 : true} />
          <div className="flex gap-3">
            <SaveButton />
            <Link href="/admin/blog" className="rounded-full px-5 py-2.5 font-semibold text-muted hover:bg-mist">Cancel</Link>
          </div>
        </form>
      )}

      <ul className="divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
        {posts.map((p) => (
          <li key={p.id} className="flex items-center gap-4 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {p.title} {!p.published && <span className="ml-2 rounded bg-mist px-2 py-0.5 text-xs text-muted">Draft</span>}
              </p>
              <p className="text-sm text-muted">{formatDate(p.publishedAt)} · {p.author}</p>
            </div>
            {p.published === 1 && (
              <Link href={`/blog/${p.slug}`} target="_blank" className="rounded-full px-3 py-1.5 text-sm font-semibold text-muted hover:bg-mist">View</Link>
            )}
            <Link href={`/admin/blog?edit=${p.id}`} className="rounded-full px-3 py-1.5 text-sm font-semibold text-pink hover:bg-pink-soft">Edit</Link>
            <form action={deletePost}>
              <input type="hidden" name="id" value={p.id} />
              <DeleteButton />
            </form>
          </li>
        ))}
      </ul>
    </>
  );
}
