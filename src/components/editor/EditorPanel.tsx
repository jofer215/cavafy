"use client";

import { useProjectStore } from "@/store/project";
import { TipTapEditor } from "./TipTapEditor";
import { BookOpen } from "lucide-react";

function findNode(nodes: import("@/lib/project/schema").BinderNode[], id: string): import("@/lib/project/schema").BinderNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const found = findNode(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function EditorPanel() {
  const { project, selectedNodeId, updateMetadata, save } = useProjectStore();

  if (!project) return null;

  if (!selectedNodeId) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center gap-3"
        style={{ backgroundColor: "var(--bg)" }}
      >
        <BookOpen size={40} strokeWidth={1} style={{ color: "var(--text-faint)" }} />
        <p className="text-sm" style={{ color: "var(--text-faint)" }}>
          Select a document in the binder to start writing
        </p>
      </div>
    );
  }

  const node = findNode(project.binder, selectedNodeId);
  if (!node || node.type !== "document") {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: "var(--bg)" }}
      >
        <p className="text-sm" style={{ color: "var(--text-faint)" }}>
          Select a document to edit
        </p>
      </div>
    );
  }

  const handleWordCount = (wc: number) => {
    updateMetadata(node.id, {
      customFields: {
        ...(project.metadata[node.id]?.customFields ?? {}),
        _wordCount: wc,
      },
    });
    save();
  };

  return (
    <div
      className="flex-1 flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: "var(--bg)" }}
    >
      {node.driveId ? (
        <TipTapEditor
          key={node.id}
          docId={node.driveId}
          projectId={project.id}
          title={node.title}
          onWordCountChange={handleWordCount}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm" style={{ color: "var(--text-faint)" }}>
            This document has no Drive file yet. Try recreating the project.
          </p>
        </div>
      )}
    </div>
  );
}
