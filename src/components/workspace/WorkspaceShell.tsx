"use client";

import { useEffect } from "react";
import { useProjectStore } from "@/store/project";
import { ProjectData } from "@/lib/project/schema";
import { Binder } from "@/components/binder/Binder";
import { EditorPanel } from "@/components/editor/EditorPanel";
import { Inspector } from "@/components/inspector/Inspector";
import { BookOpen, ChevronLeft, PanelRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface WorkspaceShellProps {
  initialProject: ProjectData;
}

export function WorkspaceShell({ initialProject }: WorkspaceShellProps) {
  const { setProject } = useProjectStore();
  const [showInspector, setShowInspector] = useState(true);

  useEffect(() => {
    setProject(initialProject);
  }, [initialProject, setProject]);

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ backgroundColor: "var(--bg)" }}
    >
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-4 h-10 shrink-0 border-b"
        style={{
          backgroundColor: "var(--bg-sidebar)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="flex items-center gap-1 text-xs hover:text-[var(--accent)] transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <ChevronLeft size={14} />
            Projects
          </Link>
          <span style={{ color: "var(--border)" }}>|</span>
          <BookOpen size={14} style={{ color: "var(--accent)" }} />
          <span className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
            {initialProject.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInspector((v) => !v)}
            className="p-1.5 rounded hover:bg-[var(--bg-panel)] transition-colors"
            style={{ color: showInspector ? "var(--accent)" : "var(--text-muted)" }}
            title="Toggle inspector"
          >
            <PanelRight size={16} />
          </button>
        </div>
      </header>

      {/* Main area */}
      <div className="flex flex-1 min-h-0">
        <Binder />
        <EditorPanel />
        {showInspector && <Inspector />}
      </div>
    </div>
  );
}
