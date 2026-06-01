import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import { signIn } from "@/auth";
import {
  BookOpen, FolderOpen, Layout, Table2, Grid3x3,
  FileText, Tag, Github, Lock
} from "lucide-react";

export default async function Home() {
  const session = await auth();
  if (session) redirect("/projects");

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-sidebar)" }}>
        <div className="flex items-center gap-2">
          <BookOpen size={20} style={{ color: "var(--accent)" }} strokeWidth={1.5} />
          <span className="text-base font-semibold tracking-tight">Cavafy</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="https://github.com/jofer215/cavafy" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm transition-colors hover:text-[var(--accent)]"
            style={{ color: "var(--text-muted)" }}>
            <Github size={14} /> GitHub
          </a>
          <SignInButton />
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-24 pb-16 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-8"
          style={{ backgroundColor: "var(--bg-panel)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
          <Lock size={10} />
          Open source · GPL v3 · Your data never leaves your Google Drive
        </div>
        <h1 className="text-5xl font-bold tracking-tight mb-5 leading-tight" style={{ color: "var(--text)" }}>
          Write your novel.<br />
          <span style={{ color: "var(--accent)" }}>Organized like Scrivener.</span>
        </h1>
        <p className="text-lg mb-10 max-w-xl" style={{ color: "var(--text-muted)" }}>
          Cavafy is a free, open-source writing app that lives entirely in your Google Drive.
          Binder, corkboard, plot grid, and a distraction-free editor — with no subscription and no lock-in.
        </p>
        <div className="flex items-center gap-4">
          <SignInButtonLarge />
          <a href="https://github.com/jofer215/cavafy" target="_blank" rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-xl text-sm font-medium border transition-colors hover:bg-[var(--bg-panel)]"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
            View source
          </a>
        </div>
        <p className="text-xs mt-4" style={{ color: "var(--text-faint)" }}>
          Sign in with Google · No credit card required
        </p>
      </section>

      {/* Features */}
      <section className="px-8 py-16 max-w-5xl mx-auto w-full">
        <h2 className="text-2xl font-semibold text-center mb-10" style={{ color: "var(--text)" }}>
          Everything a novelist needs
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex gap-4 p-5 rounded-xl"
              style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
              <div className="shrink-0 mt-0.5" style={{ color: "var(--accent)" }}>{f.icon}</div>
              <div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>{f.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Drive callout */}
      <section className="px-8 py-16 border-t" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-sidebar)" }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: "var(--text)" }}>Your words belong to you</h2>
          <p className="text-sm leading-relaxed mb-2" style={{ color: "var(--text-muted)" }}>
            Every document is a native Google Doc in your own Drive. No proprietary format, no export step, no vendor lock-in.
            Open any chapter directly in Google Docs when you&apos;re away from Cavafy — your edits sync back automatically.
          </p>
          <p className="text-sm" style={{ color: "var(--text-faint)" }}>
            Cavafy stores nothing on its own servers. No analytics. No ads. No tracking.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-6 border-t text-xs flex items-center justify-between"
        style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}>
        <span>© {new Date().getFullYear()} Cavafy. Open source under GPL v3.</span>
        <div className="flex items-center gap-5">
          <Link href="/privacy" className="hover:text-[var(--text)] transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-[var(--text)] transition-colors">Terms of Service</Link>
          <a href="https://github.com/jofer215/cavafy" target="_blank" rel="noopener noreferrer"
            className="hover:text-[var(--text)] transition-colors">GitHub</a>
        </div>
      </footer>
    </div>
  );
}

const FEATURES = [
  {
    icon: <FolderOpen size={18} />,
    title: "Binder",
    description: "Collapsible tree of folders and scenes. Drag to reorder, rename, archive, or mark scenes inactive.",
  },
  {
    icon: <FileText size={18} />,
    title: "Distraction-free editor",
    description: "Clean prose editor with auto-save to Google Drive every 1.5 seconds. Your words are always safe.",
  },
  {
    icon: <Layout size={18} />,
    title: "Corkboard",
    description: "Index card view of your scenes. See title, synopsis, status, and word count at a glance.",
  },
  {
    icon: <Table2 size={18} />,
    title: "Outliner",
    description: "Spreadsheet view across your manuscript. Edit status, label, and synopsis inline.",
  },
  {
    icon: <Grid3x3 size={18} />,
    title: "Plot Grid",
    description: "A matrix of plot lines × scenes. See where each thread appears and add notes to any cell.",
  },
  {
    icon: <Tag size={18} />,
    title: "Tags & References",
    description: "Tag scenes with @pov, @char, @location and more. References panel shows every scene a character appears in.",
  },
];

function SignInButton() {
  return (
    <form action={async () => {
      "use server";
      await signIn("google", { redirectTo: "/projects" });
    }}>
      <button type="submit"
        className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
        style={{ backgroundColor: "var(--accent)", color: "var(--accent-fg)" }}>
        Sign in
      </button>
    </form>
  );
}

function SignInButtonLarge() {
  return (
    <form action={async () => {
      "use server";
      await signIn("google", { redirectTo: "/projects" });
    }}>
      <button type="submit"
        className="flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-medium cursor-pointer transition-opacity hover:opacity-90"
        style={{ backgroundColor: "var(--accent)", color: "var(--accent-fg)" }}>
        <GoogleIcon />
        Get started — it&apos;s free
      </button>
    </form>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="currentColor" fillOpacity=".9"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="currentColor" fillOpacity=".75"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="currentColor" fillOpacity=".6"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="currentColor" fillOpacity=".45"/>
    </svg>
  );
}
