import { requireAdmin } from "@/lib/auth";
import { changePassword } from "../../actions";
import { SaveButton, AdminTitle } from "@/components/AdminUI";

// Admin > My account: change your own password

const errors: Record<string, string> = {
  wrong: "Your current password is not right.",
  short: "The new password must be at least 12 characters long.",
};

export default async function AccountAdmin({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const admin = await requireAdmin();
  const { saved, error } = await searchParams;

  return (
    <>
      <AdminTitle title="My account" />
      {error && errors[error] ? (
        <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">{errors[error]}</p>
      ) : (
        saved && <p className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800">Your new password is saved.</p>
      )}
      <p className="mb-8 text-muted">
        {admin.name}
        {admin.email && <> · {admin.email}</>}
      </p>

      {admin.isAdministrator ? (
        <p className="max-w-xl rounded-2xl border border-gray-200 bg-white p-6 text-sm text-muted">
          You are the Administrator. Your password is <code>ADMIN_PASSWORD</code> in the website&apos;s settings on Vercel
          (Environment Variables): change it there.
        </p>
      ) : (
        <form action={changePassword} className="max-w-md space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-display text-xl font-bold">Change password</h2>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">
              Current password <span className="text-pink">*</span>
            </span>
            <input name="current" type="password" required autoComplete="current-password" className="field" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">
              New password <span className="text-pink">*</span>
            </span>
            <input name="new" type="password" required minLength={12} autoComplete="new-password" className="field" />
            <span className="mt-1 block text-xs text-muted">At least 12 characters.</span>
          </label>
          <SaveButton label="Save new password" />
        </form>
      )}
    </>
  );
}
