// Cavafy — free novel writing software
// Copyright (C) 2024  Joshua Ferris
// SPDX-License-Identifier: GPL-3.0-or-later
import Link from "next/link";
import { BookOpen } from "lucide-react";

export const metadata = { title: "Terms of Service — Cavafy" };

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text)" }}>Terms of Service</h1>
        <p className="text-sm mb-10" style={{ color: "var(--text-faint)" }}>
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <Section title="About Cavafy">
          <p>Cavafy is free, open-source software licensed under the GNU General Public License v3.
          By using Cavafy, you agree to these terms. If you do not agree, please do not use the application.</p>
        </Section>

        <Section title="Your content">
          <p>You retain full ownership of all writing and content you create using Cavafy. Your files
          are stored directly in your own Google Drive account. Cavafy makes no claim to your content
          and has no ability to access it once you revoke the application&apos;s Google Drive permission.</p>
        </Section>

        <Section title="Acceptable use">
          <p>You agree not to use Cavafy to:</p>
          <ul>
            <li>Violate any applicable laws or regulations.</li>
            <li>Infringe the intellectual property rights of others.</li>
            <li>Attempt to reverse-engineer, disrupt, or abuse the service.</li>
          </ul>
          <p className="mt-3">Because Cavafy is open-source, you are free to run your own instance under
          the terms of the GPL v3 license.</p>
        </Section>

        <Section title="No warranty">
          <p>Cavafy is provided <strong>&quot;as is&quot;</strong> without warranty of any kind, express or implied.
          We make no guarantees about uptime, data integrity, or fitness for any particular purpose.
          This is consistent with the GPL v3 license under which the software is distributed.</p>
        </Section>

        <Section title="Limitation of liability">
          <p>To the fullest extent permitted by law, the Cavafy authors shall not be liable for any
          indirect, incidental, special, or consequential damages arising from your use of the application,
          including but not limited to loss of data or lost profits.</p>
          <p className="mt-3">Because your data lives in your Google Drive, you should maintain your own
          backups through Google Drive&apos;s standard features.</p>
        </Section>

        <Section title="Third-party services">
          <p>Cavafy relies on Google OAuth and Google Drive. Your use of those services is governed by
          Google&apos;s own Terms of Service and Privacy Policy. Cavafy is not affiliated with or endorsed
          by Google LLC.</p>
        </Section>

        <Section title="Changes to these terms">
          <p>We may update these terms from time to time. Changes will be noted in the project&apos;s
          GitHub repository. Continued use of Cavafy after changes constitutes acceptance.</p>
        </Section>

        <Section title="Contact">
          <p>Questions about these terms can be sent to{" "}
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
        <Link href="/privacy" className="hover:text-[var(--text)] transition-colors">Privacy Policy</Link>
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
