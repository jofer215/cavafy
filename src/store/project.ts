// Cavafy — free novel writing software
// Copyright (C) 2024  Joshua Ferris
// SPDX-License-Identifier: GPL-3.0-or-later
"use client";

import { create } from "zustand";
import { ProjectData, BinderNode, DocumentMetadata, findNode, PlotLine, PlotGrid, Snapshot, Collection, Piece, PieceNote, PieceType, getPieceTypes, getTotalWordCount } from "@/lib/project/schema";
import { generateId } from "@/lib/utils";
import { pendingQueue } from "@/lib/cache/db";

export type ViewMode = "single" | "union";

interface ProjectStore {
  project: ProjectData | null;
  selectedNodeId: string | null;
  selectedPieceId: string | null;
  viewMode: ViewMode;
  inspectorTab: "meta" | "notes" | "synopsis";

  setProject: (p: ProjectData) => void;
  setSelectedNode: (id: string | null) => void;
  setSelectedPiece: (id: string | null) => void;

  // Pieces
  addPiece: (piece: Piece) => void;
  updatePiece: (id: string, updates: Partial<Piece>) => void;
  deletePiece: (id: string) => void;
  addPieceNote: (pieceId: string, note: PieceNote) => void;
  updatePieceNote: (pieceId: string, noteId: string, updates: Partial<PieceNote>) => void;
  deletePieceNote: (pieceId: string, noteId: string) => void;
  addPieceRelation: (pieceId: string, relatedId: string) => void;
  removePieceRelation: (pieceId: string, relatedId: string) => void;
  addPieceType: (type: PieceType) => void;
  updatePieceType: (id: string, updates: Partial<PieceType>) => void;
  deletePieceType: (id: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setInspectorTab: (tab: ProjectStore["inspectorTab"]) => void;

  updateBinder: (binder: BinderNode[]) => void;
  deleteNode: (id: string) => void;
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
  selectedPieceId: null,
  viewMode: "single",
  inspectorTab: "meta",

  setProject: (project) => set({ project }),

  setSelectedNode: (id) => {
    if (!id) { set({ selectedNodeId: null, selectedPieceId: null, viewMode: "single" }); return; }
    const { project } = get();
    if (!project) { set({ selectedNodeId: id, selectedPieceId: null }); return; }
    const node = findNode(project.binder, id);
    const viewMode = node?.type === "folder" ? "union" : "single";
    set({ selectedNodeId: id, selectedPieceId: null, viewMode });
  },

  setSelectedPiece: (id) => set({ selectedPieceId: id, selectedNodeId: null }),

  setViewMode: (mode) => set({ viewMode: mode }),
  setInspectorTab: (tab) => set({ inspectorTab: tab }),

  updateBinder: (binder) =>
    set((s) => s.project ? { project: { ...s.project, binder } } : {}),

  deleteNode: (id) =>
    set((s) => {
      if (!s.project) return {};
      const removeNode = (nodes: BinderNode[]): BinderNode[] =>
        nodes.filter((n) => n.id !== id).map((n) =>
          n.children ? { ...n, children: removeNode(n.children) } : n
        );
      return {
        project: { ...s.project, binder: removeNode(s.project.binder) },
        selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
      };
    }),

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
      const line: PlotLine = { id: generateId(), name, color };
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
        id: generateId(),
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

  // ── Pieces ────────────────────────────────────────────────────────────────

  addPiece: (piece) =>
    set((s) => {
      if (!s.project) return {};
      return { project: { ...s.project, pieces: [...(s.project.pieces ?? []), piece] } };
    }),

  updatePiece: (id, updates) =>
    set((s) => {
      if (!s.project) return {};
      return {
        project: {
          ...s.project,
          pieces: (s.project.pieces ?? []).map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
          ),
        },
      };
    }),

  deletePiece: (id) =>
    set((s) => {
      if (!s.project) return {};
      return {
        project: {
          ...s.project,
          pieces: (s.project.pieces ?? []).filter((p) => p.id !== id),
          // Also remove this piece from other pieces' relations
        },
        selectedPieceId: s.selectedPieceId === id ? null : s.selectedPieceId,
      };
    }),

  addPieceNote: (pieceId, note) =>
    set((s) => {
      if (!s.project) return {};
      return {
        project: {
          ...s.project,
          pieces: (s.project.pieces ?? []).map((p) =>
            p.id === pieceId ? { ...p, pieceNotes: [...p.pieceNotes, note], updatedAt: Date.now() } : p
          ),
        },
      };
    }),

  updatePieceNote: (pieceId, noteId, updates) =>
    set((s) => {
      if (!s.project) return {};
      return {
        project: {
          ...s.project,
          pieces: (s.project.pieces ?? []).map((p) =>
            p.id === pieceId
              ? {
                  ...p,
                  pieceNotes: p.pieceNotes.map((n) => (n.id === noteId ? { ...n, ...updates } : n)),
                  updatedAt: Date.now(),
                }
              : p
          ),
        },
      };
    }),

  deletePieceNote: (pieceId, noteId) =>
    set((s) => {
      if (!s.project) return {};
      return {
        project: {
          ...s.project,
          pieces: (s.project.pieces ?? []).map((p) =>
            p.id === pieceId
              ? { ...p, pieceNotes: p.pieceNotes.filter((n) => n.id !== noteId), updatedAt: Date.now() }
              : p
          ),
        },
      };
    }),

  addPieceRelation: (pieceId, relatedId) =>
    set((s) => {
      if (!s.project) return {};
      return {
        project: {
          ...s.project,
          pieces: (s.project.pieces ?? []).map((p) =>
            p.id === pieceId && !p.relations.includes(relatedId)
              ? { ...p, relations: [...p.relations, relatedId], updatedAt: Date.now() }
              : p
          ),
        },
      };
    }),

  removePieceRelation: (pieceId, relatedId) =>
    set((s) => {
      if (!s.project) return {};
      return {
        project: {
          ...s.project,
          pieces: (s.project.pieces ?? []).map((p) =>
            p.id === pieceId
              ? { ...p, relations: p.relations.filter((r) => r !== relatedId), updatedAt: Date.now() }
              : p
          ),
        },
      };
    }),

  // ── Piece Types ───────────────────────────────────────────────────────────

  addPieceType: (type) =>
    set((s) => {
      if (!s.project) return {};
      return { project: { ...s.project, pieceTypes: [...getPieceTypes(s.project), type] } };
    }),

  updatePieceType: (id, updates) =>
    set((s) => {
      if (!s.project) return {};
      return {
        project: {
          ...s.project,
          pieceTypes: getPieceTypes(s.project).map((t: PieceType) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        },
      };
    }),

  deletePieceType: (id) =>
    set((s) => {
      if (!s.project) return {};
      return {
        project: {
          ...s.project,
          pieceTypes: getPieceTypes(s.project).filter((t: PieceType) => t.id !== id),
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

    // Always mirror to localStorage so the binder is readable offline
    try {
      localStorage.setItem(`cavafy:project:${project.id}`, JSON.stringify(project));
    } catch { /* storage quota — not fatal */ }

    const url = `/api/projects/${project.id}`;
    const body = JSON.stringify(project);
    try {
      await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body,
      });
    } catch {
      // Offline — queue for sync
      pendingQueue.push({ url, method: "PUT", body, createdAt: new Date().toISOString() });
      window.dispatchEvent(new CustomEvent("cavafy:pending-writes-changed"));
    }
  },
}));
