import { redirect } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import { loginAction } from "../actions";
import { SaveButton } from "@/components/AdminUI";

export const metadata = { title: "Admin login" };

const errors: Record<string, string> = {
  wrong: "Wrong email or password. Try again.",
  busy: "Too many tries. Please wait 10 minutes and try again.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; out?: string }> }) {
  if (await isLoggedIn()) redirect("/admin");
  const { error, out } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-mist px-4">
      <form action={loginAction} className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo.png" alt="Minority Matters" className="h-16 w-16" />
        <h1 className="mt-6 font-display text-2xl font-bold">Admin login</h1>
        <p className="mt-1 text-sm text-muted">Log in to manage the website.</p>
        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">
            {errors[error] || errors.wrong}
          </p>
        ) : (
          out && (
            <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-800" role="status">
              You are logged out.
            </p>
          )
        )}
        <label className="mt-6 block">
          <span className="mb-1.5 block text-sm font-semibold">Email</span>
          <input name="email" type="email" autoComplete="username" autoFocus className="field" />
        </label>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-sm font-semibold">Password</span>
          <input name="password" type="password" required autoComplete="current-password" className="field" />
        </label>
        <label className="mt-4 flex items-center gap-3 text-sm">
          <input type="checkbox" name="remember" className="h-4 w-4 accent-[#e71d73]" /> Keep me logged in
        </label>
        <div className="mt-6">
          <SaveButton label="Log in" />
        </div>
      </form>
    </main>
  );
}
