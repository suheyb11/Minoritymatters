import { prisma, formatDate } from "@/lib/db";
import { requireAdministrator } from "@/lib/auth";
import { addManager, removeManager } from "../../actions";
import { Field, SaveButton, AdminTitle, Notice, ConfirmButton, NewPasswordField } from "@/components/AdminUI";

// Admin > Users: the people who can log in to this admin. Only the Administrator can add or remove them.

const errors: Record<string, string> = {
  missing: "Please fill in a name and a valid email address.",
  short: "The password must be at least 12 characters long.",
  exists: "There is already an account with this email address.",
};

export default async function UsersAdmin({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string; error?: string }> }) {
  await requireAdministrator();
  const { saved, deleted, error } = await searchParams;
  const managers = await prisma.adminUser.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <AdminTitle title="Users" />
      <p className="-mt-4 mb-8 max-w-2xl text-sm text-muted">
        Website managers log in at <strong>/admin/login</strong> with their email and password. They can change all the content,
        read and answer messages and see bookings. Only you (the Administrator) can add people and change Email sending.
      </p>
      {error && errors[error] ? (
        <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">{errors[error]}</p>
      ) : (
        <Notice saved={saved} deleted={deleted} />
      )}

      <form action={addManager} className="mb-10 space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="font-display text-xl font-bold">Add a Website manager</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" name="name" required />
          <Field label="Email" name="email" type="email" required />
        </div>
        <NewPasswordField />
        <SaveButton label="Add person" />
      </form>

      <h2 className="mb-3 font-display text-xl font-bold">Website managers</h2>
      {managers.length === 0 ? (
        <p className="mb-10 text-muted">No Website managers yet.</p>
      ) : (
        <ul className="mb-10 divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
          {managers.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <p className="font-semibold">{u.name}</p>
                <p className="text-sm text-muted">
                  {u.email} · added {formatDate(u.createdAt)}
                </p>
              </div>
              <form action={removeManager}>
                <input type="hidden" name="id" value={u.id} />
                <ConfirmButton
                  label="Remove"
                  message={`Remove ${u.name}? They can no longer log in.`}
                  className="rounded-full px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                />
              </form>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mb-3 font-display text-xl font-bold">Administrator</h2>
      <p className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-muted">
        The Administrator logs in with the password in <code>ADMIN_PASSWORD</code>
        {process.env.ADMIN_EMAIL ? (
          <>
            {" "}and the email <strong>{process.env.ADMIN_EMAIL}</strong>
          </>
        ) : (
          " (any email, or none: set ADMIN_EMAIL to require one)"
        )}
        . Change them in the website&apos;s settings on Vercel (Environment Variables).
      </p>
    </>
  );
}
