// Cavafy — free novel writing software
// Copyright (C) 2024  Joshua Ferris
// SPDX-License-Identifier: GPL-3.0-or-later
"use client";

import { useEffect, useRef, useState } from "react";
import { useProjectStore } from "@/store/project";
import { ProjectData } from "@/lib/project/schema";
import { Binder } from "@/components/binder/Binder";
import { EditorPanel } from "@/components/editor/EditorPanel";
import { Inspector } from "@/components/inspector/Inspector";
import { WordCountWidget } from "./WordCountWidget";
import { OfflineBanner } from "./OfflineBanner";
import { PlotGridView } from "@/components/plot-grid/PlotGrid";
import { CorkboardView } from "@/components/corkboard/Corkboard";
import { OutlinerView } from "@/components/outliner/Outliner";
import { CollectionsView } from "@/components/collections/CollectionsView";
import { PiecesView } from "@/components/pieces/PiecesView";
import { migrateBinderFoldersToPieces } from "@/lib/pieces/migration";
import { BookOpen, BookMarked, ChevronLeft, PanelLeft, PanelRight, Grid3x3, FileText, LayoutGrid, Table2, Layers, Maximize2, Minimize2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type WorkspaceView = "editor" | "corkboard" | "outliner" | "plot-grid" | "collections" | "pieces";

interface WorkspaceShellProps {
  initialProject: ProjectData;
  initialView?: WorkspaceView;
}

export function WorkspaceShell({ initialProject, initialView = "editor" }: WorkspaceShellProps) {
  const { setProject, save, selectedNodeId } = useProjectStore();
  const [showBinder, setShowBinder] = useState(true);
  const [showInspector, setShowInspector] = useState(true);
  const [activeView, setActiveView] = useState<WorkspaceView>(initialView);
  const [inspectorWidth, setInspectorWidth] = useState(248);
  const [focusMode, setFocusMode] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(true);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setProject(initialProject);

    // Run one-time migration of Characters + Places folders → Pieces
    const migrated = migrateBinderFoldersToPieces(initialProject);
    if (migrated) {
      setProject(migrated);
      save();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProject]);

  const startResizingInspector = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = inspectorWidth;
    const onMove = (ev: MouseEvent) => {
      const delta = startX - ev.clientX;
      setInspectorWidth(Math.min(600, Math.max(200, startWidth + delta)));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Allow Binder to switch the active view via custom event
  useEffect(() => {
    const handler = (e: Event) => setActiveView((e as CustomEvent<WorkspaceView>).detail);
    window.addEventListener("cavafy:set-view", handler);
    return () => window.removeEventListener("cavafy:set-view", handler);
  }, []);

  // Selecting a binder node while in a non-editor view switches back to editor
  useEffect(() => {
    if (!selectedNodeId) return;
    if (activeView === "pieces" || activeView === "outliner" || activeView === "plot-grid") {
      setActiveView("editor");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNodeId]);

  // Focus mode: Escape to toggle, mouse movement reveals chrome
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeView === "editor") {
        setFocusMode((v) => {
          if (v) setChromeVisible(true);
          return !v;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeView]);

  useEffect(() => {
    if (!focusMode) { setChromeVisible(true); return; }
    const onMove = () => {
      setChromeVisible(true);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => setChromeVisible(false), 2000);
    };
    // Brief delay before fading so the transition feels intentional
    idleTimer.current = setTimeout(() => setChromeVisible(false), 1500);
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [focusMode]);

  const navItems: { view: WorkspaceView; icon: React.ReactNode; label: string }[] = [
    { view: "editor",      icon: <FileText size={14} />,     label: "Editor"      },
    { view: "corkboard",   icon: <LayoutGrid size={14} />,   label: "Corkboard"   },
    { view: "outliner",    icon: <Table2 size={14} />,       label: "Outliner"    },
    { view: "plot-grid",   icon: <Grid3x3 size={14} />,      label: "Plot Grid"   },
    { view: "collections", icon: <Layers size={14} />,       label: "Collections" },
    { view: "pieces",      icon: <BookMarked size={14} />,   label: "Pieces"      },
  ];

  const showBinderToggle = ["editor", "corkboard", "collections", "pieces"].includes(activeView);
  const showInspectorToggle = ["editor", "corkboard", "pieces"].includes(activeView);

  const showChrome = !focusMode || chromeVisible;

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-4 h-10 shrink-0 border-b transition-opacity duration-500"
        style={{
          backgroundColor: "var(--bg-sidebar)",
          borderColor: "var(--border)",
          opacity: showChrome ? 1 : 0,
          pointerEvents: showChrome ? undefined : "none",
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
          {showBinderToggle && (
            <button
              onClick={() => setShowBinder((v) => !v)}
              className="p-1.5 rounded hover:bg-[var(--bg-panel)] transition-colors"
              style={{ color: showBinder ? "var(--accent)" : "var(--text-muted)" }}
              title="Toggle binder"
            >
              <PanelLeft size={16} />
            </button>
          )}
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
          <OfflineBanner />
          <WordCountWidget />
          {showInspectorToggle && (
            <button
              onClick={() => setShowInspector((v) => !v)}
              className="p-1.5 rounded hover:bg-[var(--bg-panel)] transition-colors"
              style={{ color: showInspector ? "var(--accent)" : "var(--text-muted)" }}
              title="Toggle inspector"
            >
              <PanelRight size={16} />
            </button>
          )}
          {activeView === "editor" && (
            <button
              onClick={() => setFocusMode((v) => !v)}
              className="p-1.5 rounded hover:bg-[var(--bg-panel)] transition-colors"
              style={{ color: focusMode ? "var(--accent)" : "var(--text-muted)" }}
              title={focusMode ? "Exit focus mode (Esc)" : "Focus mode (Esc)"}
            >
              {focusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          )}
        </div>
      </header>

      {/* Main area */}
      <div className="flex flex-1 min-h-0">
        {activeView === "editor" && (
          <>
            {showBinder && !focusMode && <Binder />}
            <EditorPanel />
            {showInspector && !focusMode && <ResizableInspector width={inspectorWidth} onStartResize={startResizingInspector} />}
          </>
        )}
        {activeView === "corkboard" && (
          <>
            {showBinder && <Binder />}
            <CorkboardView />
            {showInspector && <ResizableInspector width={inspectorWidth} onStartResize={startResizingInspector} />}
          </>
        )}
        {activeView === "outliner" && <OutlinerView />}
        {activeView === "plot-grid" && <PlotGridView />}
        {activeView === "collections" && (
          <>
            {showBinder && <Binder />}
            <CollectionsView projectId={initialProject.id} />
          </>
        )}
        {activeView === "pieces" && (
          <>
            {showBinder && <Binder />}
            <PiecesView projectId={initialProject.id} />
            {showInspector && <ResizableInspector width={inspectorWidth} onStartResize={startResizingInspector} />}
          </>
        )}
      </div>
    </div>
  );
}

function ResizableInspector({
  width,
  onStartResize,
}: {
  width: number;
  onStartResize: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="flex shrink-0 h-full" style={{ width }}>
      {/* Drag handle */}
      <div
        onMouseDown={onStartResize}
        className="w-1 shrink-0 h-full cursor-col-resize hover:bg-[var(--accent)] transition-colors"
        style={{ backgroundColor: "var(--border)" }}
      />
      <div className="flex-1 min-w-0">
        <Inspector />
      </div>
    </div>
  );
}
