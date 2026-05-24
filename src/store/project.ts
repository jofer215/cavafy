"use client";

import { create } from "zustand";
import { ProjectData, BinderNode, DocumentMetadata, findNode, PlotLine, PlotGrid } from "@/lib/project/schema";

export type ViewMode = "single" | "scrivenings";

interface ProjectStore {
  project: ProjectData | null;
  selectedNodeId: string | null;
  viewMode: ViewMode;
  inspectorTab: "meta" | "notes" | "synopsis";

  setProject: (p: ProjectData) => void;
  setSelectedNode: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setInspectorTab: (tab: ProjectStore["inspectorTab"]) => void;

  updateBinder: (binder: BinderNode[]) => void;
  toggleExpanded: (id: string) => void;
  toggleActive: (id: string) => void;

  updateMetadata: (nodeId: string, meta: Partial<DocumentMetadata>) => void;

  // Plot Grid
  addPlotLine: (name: string, color: string) => void;
  removePlotLine: (id: string) => void;
  setPlotCell: (plotLineId: string, nodeId: string, note: string) => void;

  save: () => Promise<void>;
}

function toggleNodeExpanded(nodes: BinderNode[], id: string): BinderNode[] {
  return nodes.map((n) => {
    if (n.id === id) return { ...n, isExpanded: !n.isExpanded };
    if (n.children) return { ...n, children: toggleNodeExpanded(n.children, id) };
    return n;
  });
}

function toggleNodeActive(nodes: BinderNode[], id: string): BinderNode[] {
  return nodes.map((n) => {
    if (n.id === id) return { ...n, isActive: n.isActive === false ? true : false };
    if (n.children) return { ...n, children: toggleNodeActive(n.children, id) };
    return n;
  });
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: null,
  selectedNodeId: null,
  viewMode: "single",
  inspectorTab: "meta",

  setProject: (project) => set({ project }),

  setSelectedNode: (id) => {
    if (!id) { set({ selectedNodeId: null, viewMode: "single" }); return; }
    const { project } = get();
    if (!project) { set({ selectedNodeId: id }); return; }
    const node = findNode(project.binder, id);
    const viewMode = node?.type === "folder" ? "scrivenings" : "single";
    set({ selectedNodeId: id, viewMode });
  },

  setViewMode: (mode) => set({ viewMode: mode }),
  setInspectorTab: (tab) => set({ inspectorTab: tab }),

  updateBinder: (binder) =>
    set((s) => s.project ? { project: { ...s.project, binder } } : {}),

  toggleExpanded: (id) =>
    set((s) =>
      s.project
        ? { project: { ...s.project, binder: toggleNodeExpanded(s.project.binder, id) } }
        : {}
    ),

  toggleActive: (id) =>
    set((s) =>
      s.project
        ? { project: { ...s.project, binder: toggleNodeActive(s.project.binder, id) } }
        : {}
    ),

  updateMetadata: (nodeId, meta) =>
    set((s) => {
      if (!s.project) return {};
      const existing = s.project.metadata[nodeId] ?? {};
      return {
        project: {
          ...s.project,
          metadata: { ...s.project.metadata, [nodeId]: { ...existing, ...meta } },
        },
      };
    }),

  addPlotLine: (name, color) =>
    set((s) => {
      if (!s.project) return {};
      const line: PlotLine = { id: crypto.randomUUID(), name, color };
      const existing = s.project.plotGrid ?? { plotLines: [], cells: {} };
      return {
        project: {
          ...s.project,
          plotGrid: { ...existing, plotLines: [...existing.plotLines, line] },
        },
      };
    }),

  removePlotLine: (id) =>
    set((s) => {
      if (!s.project?.plotGrid) return {};
      const { [id]: _, ...cells } = s.project.plotGrid.cells;
      return {
        project: {
          ...s.project,
          plotGrid: {
            plotLines: s.project.plotGrid.plotLines.filter((l) => l.id !== id),
            cells,
          },
        },
      };
    }),

  setPlotCell: (plotLineId, nodeId, note) =>
    set((s) => {
      if (!s.project) return {};
      const grid: PlotGrid = s.project.plotGrid ?? { plotLines: [], cells: {} };
      return {
        project: {
          ...s.project,
          plotGrid: {
            ...grid,
            cells: {
              ...grid.cells,
              [plotLineId]: { ...(grid.cells[plotLineId] ?? {}), [nodeId]: { note } },
            },
          },
        },
      };
    }),

  save: async () => {
    const { project } = get();
    if (!project) return;
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project),
      });
    } catch (e) {
      console.error("Failed to save project:", e);
    }
  },
}));
