import { redirect } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import { loginAction } from "../actions";
import { SaveButton } from "@/components/AdminUI";

export const metadata = { title: "Admin login" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isLoggedIn()) redirect("/admin");
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-mist px-4">
      <form action={loginAction} className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo.png" alt="Minority Matters" className="h-16 w-16" />
        <h1 className="mt-6 font-display text-2xl font-bold">Admin login</h1>
        <p className="mt-1 text-sm text-muted">Enter the admin password to manage the website.</p>
        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">
            Wrong password. Try again.
          </p>
        )}
        <label className="mt-6 block">
          <span className="mb-1.5 block text-sm font-semibold">Password</span>
          <input name="password" type="password" required autoFocus className="field" />
        </label>
        <div className="mt-6">
          <SaveButton label="Log in" />
        </div>
      </form>
    </main>
  );
}
