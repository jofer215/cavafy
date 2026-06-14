// Cavafy — free novel writing software
// Copyright (C) 2024  Joshua Ferris
// SPDX-License-Identifier: GPL-3.0-or-later
import Link from "next/link";
import { BookOpen } from "lucide-react";

export const metadata = { title: "Privacy Policy — Cavafy" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <nav className="flex items-center justify-between px-8 py-4 border-b"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-sidebar)" }}>
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <BookOpen size={18} style={{ color: "var(--accent)" }} strokeWidth={1.5} />
          <span className="text-sm font-semibold">Cavafy</span>
        </Link>
      </nav>

      <article className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text)" }}>Privacy Policy</h1>
        <p className="text-sm mb-10" style={{ color: "var(--text-faint)" }}>
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <Section title="The short version">
          <p>Cavafy stores all of your writing in your own Google Drive. We do not have access to your
          documents, we do not collect your writing, and we do not sell or share your data.
          The only information we handle is what is necessary to sign you in with Google and keep your
          session active.</p>
        </Section>

        <Section title="What we collect">
          <p>When you sign in with Google, we receive:</p>
          <ul>
            <li>Your Google account email address and display name, used to identify your session.</li>
            <li>An OAuth access token and refresh token, used to read and write files in your Google Drive
            on your behalf. These are stored in an encrypted session cookie on your device and are never
            written to any Cavafy server or database.</li>
          </ul>
          <p className="mt-3">We do not collect, store, or process the content of any documents you write.</p>
        </Section>

        <Section title="Google Drive access">
          <p>Cavafy requests the <code>drive.file</code> scope, which grants access only to files that
          Cavafy itself creates. We cannot access your other Google Drive files. All project files
          (documents, project metadata) are stored directly in your Google Drive account under a
          folder named <strong>Cavafy</strong>.</p>
        </Section>

        <Section title="Cookies and sessions">
          <p>We use a single session cookie managed by NextAuth.js to keep you signed in. This cookie
          contains your encrypted Google tokens and expires when your browser session ends or when
          you sign out. We do not use advertising cookies, tracking pixels, or third-party analytics.</p>
        </Section>

        <Section title="Third-party services">
          <p>Cavafy is hosted on Vercel. Vercel may collect standard server access logs (IP address,
          request path, timestamp) as part of normal hosting operations. See{" "}
          <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer"
            style={{ color: "var(--accent)" }}>Vercel&apos;s Privacy Policy</a> for details.</p>
          <p className="mt-3">Authentication is handled via Google OAuth 2.0. See{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer"
            style={{ color: "var(--accent)" }}>Google&apos;s Privacy Policy</a>.</p>
        </Section>

        <Section title="Data retention">
          <p>We retain no user data on Cavafy servers. Your writing lives entirely in your Google Drive.
          You can delete it at any time by removing the Cavafy folder from your Drive. Revoking
          Cavafy&apos;s access in your{" "}
          <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer"
            style={{ color: "var(--accent)" }}>Google Account permissions</a>{" "}
          immediately prevents any further access.</p>
        </Section>

        <Section title="Children">
          <p>Cavafy is not directed at children under 13. We do not knowingly collect any information
          from children under 13.</p>
        </Section>

        <Section title="Changes">
          <p>If we make material changes to this policy, we will update the date at the top of this page
          and note it in the project&apos;s GitHub repository.</p>
        </Section>

        <Section title="Contact">
          <p>Questions about this policy can be sent to{" "}
            <a href="mailto:joshuaferris@gmail.com" style={{ color: "var(--accent)" }}>
              joshuaferris@gmail.com
            </a>
            {" "}or opened as an issue on{" "}
            <a href="https://github.com/jofer215/cavafy" target="_blank" rel="noopener noreferrer"
              style={{ color: "var(--accent)" }}>GitHub</a>.
          </p>
        </Section>
      </article>

      <footer className="px-8 py-6 border-t text-xs text-center" style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}>
        <Link href="/" className="hover:text-[var(--text)] transition-colors mr-6">Home</Link>
        <Link href="/terms" className="hover:text-[var(--text)] transition-colors">Terms of Service</Link>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>{title}</h2>
      <div className="text-sm leading-relaxed space-y-2" style={{ color: "var(--text-muted)" }}>
        {children}
      </div>
    </section>
  );
}
