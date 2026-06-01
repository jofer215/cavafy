import { signIn } from "@/auth";
import { BookOpen } from "lucide-react";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { error, callbackUrl } = await searchParams;
  const redirectTo = callbackUrl ?? "/projects";
  const sessionExpired = error === "session_expired";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center"
      style={{ backgroundColor: "var(--bg)" }}>
      <div className="flex flex-col items-center gap-8 p-12 rounded-2xl"
        style={{
          backgroundColor: "var(--bg-elevated)",
          boxShadow: "var(--shadow-md)",
          border: "1px solid var(--border)",
        }}>
        <div className="flex flex-col items-center gap-3">
          <BookOpen size={40} style={{ color: "var(--accent)" }} strokeWidth={1.5} />
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>
            Cavafy
          </h1>
          <p className="text-sm text-center max-w-xs" style={{ color: "var(--text-muted)" }}>
            Your novels, organized. Your words, protected.
            <br />
            Everything stored in your own Google Drive.
          </p>
        </div>

        {sessionExpired && (
          <div className="px-4 py-3 rounded-lg text-sm text-center max-w-xs"
            style={{ backgroundColor: "var(--bg-panel)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
            Your session expired. Please sign in again to continue.
          </div>
        )}

        <form action={async () => {
          "use server";
          await signIn("google", { redirectTo });
        }}>
          <button type="submit"
            className="flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer"
            style={{ backgroundColor: "var(--accent)", color: "var(--accent-fg)" }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#fff" fillOpacity=".9"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#fff" fillOpacity=".75"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#fff" fillOpacity=".6"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#fff" fillOpacity=".45"/>
            </svg>
            Continue with Google
          </button>
        </form>

        <p className="text-xs" style={{ color: "var(--text-faint)" }}>
          Open source · GPL v3 · Your data stays in your Drive
        </p>
      </div>

      <div className="mt-6 flex gap-4 text-xs" style={{ color: "var(--text-faint)" }}>
        <Link href="/privacy" className="hover:text-[var(--text)] transition-colors">Privacy Policy</Link>
        <Link href="/terms" className="hover:text-[var(--text)] transition-colors">Terms of Service</Link>
      </div>
    </div>
  );
}
