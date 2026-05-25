"use client";

import { useEffect, useState } from "react";
import { useProjectStore } from "@/store/project";
import { ProjectData } from "@/lib/project/schema";
import { Binder } from "@/components/binder/Binder";
import { EditorPanel } from "@/components/editor/EditorPanel";
import { Inspector } from "@/components/inspector/Inspector";
import { PlotGridView } from "@/components/plot-grid/PlotGrid";
import { CorkboardView } from "@/components/corkboard/Corkboard";
import { OutlinerView } from "@/components/outliner/Outliner";
import { BookOpen, ChevronLeft, PanelRight, Grid3x3, FileText, LayoutGrid, Table2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type WorkspaceView = "editor" | "corkboard" | "outliner" | "plot-grid";

interface WorkspaceShellProps {
  initialProject: ProjectData;
  initialView?: WorkspaceView;
}

export function WorkspaceShell({ initialProject, initialView = "editor" }: WorkspaceShellProps) {
  const { setProject } = useProjectStore();
  const [showInspector, setShowInspector] = useState(true);
  const [activeView, setActiveView] = useState<WorkspaceView>(initialView);

  useEffect(() => {
    setProject(initialProject);
  }, [initialProject, setProject]);

  const navItems: { view: WorkspaceView; icon: React.ReactNode; label: string }[] = [
    { view: "editor",    icon: <FileText size={14} />,    label: "Editor"    },
    { view: "corkboard", icon: <LayoutGrid size={14} />,  label: "Corkboard" },
    { view: "outliner",  icon: <Table2 size={14} />,      label: "Outliner"  },
    { view: "plot-grid", icon: <Grid3x3 size={14} />,     label: "Plot Grid" },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-4 h-10 shrink-0 border-b"
        style={{ backgroundColor: "var(--bg-sidebar)", borderColor: "var(--border)" }}
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
          <span className="text-sm font-medium truncate max-w-[200px]" style={{ color: "var(--text)" }}>
            {initialProject.name}
          </span>
        </div>

        {/* View switcher */}
        <nav className="flex items-center gap-0.5">
          {navItems.map(({ view, icon, label }) => (
            <Link
              key={view}
              href={view === "editor" ? `/${initialProject.id}` : `/${initialProject.id}/${view}`}
              onClick={() => setActiveView(view)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors",
                activeView === view
                  ? "bg-[var(--bg-panel)] text-[var(--text)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-panel)]"
              )}
            >
              {icon}
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {(activeView === "editor" || activeView === "corkboard") && (
            <button
              onClick={() => setShowInspector((v) => !v)}
              className="p-1.5 rounded hover:bg-[var(--bg-panel)] transition-colors"
              style={{ color: showInspector ? "var(--accent)" : "var(--text-muted)" }}
              title="Toggle inspector"
            >
              <PanelRight size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Main area */}
      <div className="flex flex-1 min-h-0">
        {activeView === "editor" && (
          <>
            <Binder />
            <EditorPanel />
            {showInspector && <Inspector />}
          </>
        )}
        {activeView === "corkboard" && (
          <>
            <Binder />
            <CorkboardView />
            {showInspector && <Inspector />}
          </>
        )}
        {activeView === "outliner" && <OutlinerView />}
        {activeView === "plot-grid" && <PlotGridView />}
      </div>
    </div>
  );
}
