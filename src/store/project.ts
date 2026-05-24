"use client";

import { create } from "zustand";
import { ProjectData, BinderNode, DocumentMetadata } from "@/lib/project/schema";

interface ProjectStore {
  project: ProjectData | null;
  selectedNodeId: string | null;
  inspectorTab: "meta" | "notes" | "synopsis" | "snapshots";

  setProject: (p: ProjectData) => void;
  setSelectedNode: (id: string | null) => void;
  setInspectorTab: (tab: ProjectStore["inspectorTab"]) => void;

  // Binder mutations
  updateBinder: (binder: BinderNode[]) => void;
  toggleExpanded: (id: string) => void;

  // Metadata mutations
  updateMetadata: (nodeId: string, meta: Partial<DocumentMetadata>) => void;

  // Persist to Drive (fire-and-forget)
  save: () => Promise<void>;
}

function toggleNodeExpanded(nodes: BinderNode[], id: string): BinderNode[] {
  return nodes.map((n) => {
    if (n.id === id) return { ...n, isExpanded: !n.isExpanded };
    if (n.children) return { ...n, children: toggleNodeExpanded(n.children, id) };
    return n;
  });
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: null,
  selectedNodeId: null,
  inspectorTab: "meta",

  setProject: (project) => set({ project }),
  setSelectedNode: (id) => set({ selectedNodeId: id }),
  setInspectorTab: (tab) => set({ inspectorTab: tab }),

  updateBinder: (binder) =>
    set((s) => s.project ? { project: { ...s.project, binder } } : {}),

  toggleExpanded: (id) =>
    set((s) =>
      s.project
        ? { project: { ...s.project, binder: toggleNodeExpanded(s.project.binder, id) } }
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
