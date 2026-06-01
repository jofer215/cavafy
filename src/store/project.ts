"use client";

import { create } from "zustand";
import { ProjectData, BinderNode, DocumentMetadata, findNode, PlotLine, PlotGrid, Snapshot, Collection, getTotalWordCount } from "@/lib/project/schema";

export type ViewMode = "single" | "union";

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
  reorderChildren: (parentId: string | null, fromIndex: number, toIndex: number) => void;

  updateMetadata: (nodeId: string, meta: Partial<DocumentMetadata>) => void;

  // Plot Grid
  addPlotLine: (name: string, color: string) => void;
  removePlotLine: (id: string) => void;
  setPlotCell: (plotLineId: string, nodeId: string, note: string) => void;

  // Collections
  addCollection: (name: string) => void;
  deleteCollection: (id: string) => void;
  renameCollection: (id: string, name: string) => void;
  addToCollection: (collectionId: string, nodeId: string) => void;
  removeFromCollection: (collectionId: string, nodeId: string) => void;

  // Snapshots
  addSnapshot: (nodeId: string, snapshot: Snapshot) => void;
  deleteSnapshot: (nodeId: string, snapshotId: string) => void;

  // Word count history
  recordWordCount: () => void;

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
    const viewMode = node?.type === "folder" ? "union" : "single";
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

  reorderChildren: (parentId, fromIndex, toIndex) =>
    set((s) => {
      if (!s.project || fromIndex === toIndex) return {};
      const move = (arr: BinderNode[]): BinderNode[] => {
        const next = [...arr];
        const [item] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, item);
        return next;
      };
      const reorder = (nodes: BinderNode[]): BinderNode[] => {
        if (parentId === null) return move(nodes);
        return nodes.map((n) => {
          if (n.id === parentId && n.children) return { ...n, children: move(n.children) };
          if (n.children) return { ...n, children: reorder(n.children) };
          return n;
        });
      };
      return { project: { ...s.project, binder: reorder(s.project.binder) } };
    }),

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

  addCollection: (name) =>
    set((s) => {
      if (!s.project) return {};
      const collection: Collection = {
        id: crypto.randomUUID(),
        name: name.trim(),
        nodeIds: [],
        createdAt: new Date().toISOString(),
      };
      return { project: { ...s.project, collections: [...(s.project.collections ?? []), collection] } };
    }),

  deleteCollection: (id) =>
    set((s) => {
      if (!s.project) return {};
      return { project: { ...s.project, collections: (s.project.collections ?? []).filter((c) => c.id !== id) } };
    }),

  renameCollection: (id, name) =>
    set((s) => {
      if (!s.project) return {};
      return {
        project: {
          ...s.project,
          collections: (s.project.collections ?? []).map((c) =>
            c.id === id ? { ...c, name: name.trim() } : c
          ),
        },
      };
    }),

  addToCollection: (collectionId, nodeId) =>
    set((s) => {
      if (!s.project) return {};
      return {
        project: {
          ...s.project,
          collections: (s.project.collections ?? []).map((c) =>
            c.id === collectionId && !c.nodeIds.includes(nodeId)
              ? { ...c, nodeIds: [...c.nodeIds, nodeId] }
              : c
          ),
        },
      };
    }),

  removeFromCollection: (collectionId, nodeId) =>
    set((s) => {
      if (!s.project) return {};
      return {
        project: {
          ...s.project,
          collections: (s.project.collections ?? []).map((c) =>
            c.id === collectionId
              ? { ...c, nodeIds: c.nodeIds.filter((id) => id !== nodeId) }
              : c
          ),
        },
      };
    }),

  addSnapshot: (nodeId, snapshot) =>
    set((s) => {
      if (!s.project) return {};
      const existing = s.project.snapshots?.[nodeId] ?? [];
      return {
        project: {
          ...s.project,
          snapshots: { ...s.project.snapshots, [nodeId]: [...existing, snapshot] },
        },
      };
    }),

  deleteSnapshot: (nodeId, snapshotId) =>
    set((s) => {
      if (!s.project) return {};
      const existing = s.project.snapshots?.[nodeId] ?? [];
      return {
        project: {
          ...s.project,
          snapshots: {
            ...s.project.snapshots,
            [nodeId]: existing.filter((sn) => sn.id !== snapshotId),
          },
        },
      };
    }),

  recordWordCount: () =>
    set((s) => {
      if (!s.project) return {};
      const today = new Date().toISOString().slice(0, 10);
      const total = getTotalWordCount(s.project);
      return {
        project: {
          ...s.project,
          wordCountHistory: { ...s.project.wordCountHistory, [today]: total },
        },
      };
    }),

  save: async () => {
    get().recordWordCount();
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
