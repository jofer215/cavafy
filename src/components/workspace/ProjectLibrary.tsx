// Cavafy — free novel writing software
// Copyright (C) 2024  Joshua Ferris
// SPDX-License-Identifier: GPL-3.0-or-later
"use client";

import { ProjectData } from "@/lib/project/schema";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BookOpen, Plus, Loader2 } from "lucide-react";
import { signOut } from "next-auth/react";

interface ProjectLibraryProps {
  initialProjects: ProjectData[];
}

export function ProjectLibrary({ initialProjects }: ProjectLibraryProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const p = await res.json();
      setProjects((prev) => [p, ...prev]);
      setNewName("");
      setShowNew(false);
      router.push(`/${p.id}`);
    } catch {
      alert("Failed to create project. Check your Google Drive access.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--bg)" }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-8 py-4 border-b"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-sidebar)" }}
      >
        <div className="flex items-center gap-2">
          <BookOpen size={22} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
          <span className="text-lg font-semibold" style={{ color: "var(--text)" }}>
            Cavafy
          </span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-xs px-3 py-1.5 rounded-lg hover:bg-[var(--bg-panel)] transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          Sign out
        </button>
      </header>

      <main className="flex-1 px-8 py-10 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text)" }}>
            My Projects
          </h1>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ backgroundColor: "var(--accent)", color: "var(--accent-fg)" }}
          >
            <Plus size={16} /> New Project
          </button>
        </div>

        {/* New project form */}
        {showNew && (
          <div
            className="mb-6 p-5 rounded-xl border"
            style={{
              backgroundColor: "var(--bg-elevated)",
              borderColor: "var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <form onSubmit={createProject} className="flex gap-3">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Project title…"
                className="flex-1 px-3 py-2 rounded-lg text-sm bg-transparent border outline-none focus:border-[var(--accent)]"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              />
              <button
                type="submit"
                disabled={creating || !newName.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                style={{ backgroundColor: "var(--accent)", color: "var(--accent-fg)" }}
              >
                {creating && <Loader2 size={14} className="animate-spin" />}
                {creating ? "Creating…" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => { setShowNew(false); setNewName(""); }}
                className="px-4 py-2 rounded-lg text-sm hover:bg-[var(--bg-panel)] transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* Project grid */}
        {projects.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border-2 border-dashed"
            style={{ borderColor: "var(--border)" }}
          >
            <BookOpen size={40} strokeWidth={1} style={{ color: "var(--text-faint)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No projects yet. Create your first novel.
            </p>
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ backgroundColor: "var(--accent)", color: "var(--accent-fg)" }}
            >
              <Plus size={16} /> New Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/${p.id}`}
                className="group flex flex-col gap-2 p-5 rounded-xl border transition-all hover:-translate-y-0.5"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--border)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div className="flex items-start justify-between">
                  <BookOpen
                    size={20}
                    strokeWidth={1.5}
                    style={{ color: "var(--accent)" }}
                    className="mt-0.5 shrink-0"
                  />
                </div>
                <h2 className="text-base font-semibold leading-snug" style={{ color: "var(--text)" }}>
                  {p.name}
                </h2>
                <p className="text-xs mt-auto pt-2" style={{ color: "var(--text-faint)" }}>
                  Modified {formatDate(p.modified)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
