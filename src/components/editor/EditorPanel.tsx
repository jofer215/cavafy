"use client";

import { useProjectStore } from "@/store/project";
import { findNode } from "@/lib/project/schema";
import { TipTapEditor } from "./TipTapEditor";
import { ScriveningsView } from "./ScriveningsView";
import { BookOpen } from "lucide-react";

export function EditorPanel() {
  const { project, selectedNodeId, viewMode, updateMetadata } = useProjectStore();

  if (!project) return null;

  if (!selectedNodeId) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center gap-3"
        style={{ backgroundColor: "var(--bg)" }}
      >
        <BookOpen size={40} strokeWidth={1} style={{ color: "var(--text-faint)" }} />
        <p className="text-sm" style={{ color: "var(--text-faint)" }}>
          Select a document to write, or a folder for Scrivenings view
        </p>
      </div>
    );
  }

  // Folder selected → Scrivenings view
  if (viewMode === "scrivenings") {
    return (
      <ScriveningsView
        key={selectedNodeId}
        folderId={selectedNodeId}
        projectId={project.id}
      />
    );
  }

  // Document selected → single editor
  const node = findNode(project.binder, selectedNodeId);
  if (!node || node.type !== "document") return null;

  const handleWordCount = (wc: number) => {
    updateMetadata(node.id, {
      customFields: {
        ...(project.metadata[node.id]?.customFields ?? {}),
        _wordCount: wc,
      },
    });
    // word count is saved piggyback on the next content auto-save (1.5s debounce in TipTapEditor)
  };

  if (!node.driveId) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: "var(--bg)" }}
      >
        <p className="text-sm" style={{ color: "var(--text-faint)" }}>
          This document has no Drive file yet.
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <TipTapEditor
        key={node.id}
        docId={node.driveId}
        projectId={project.id}
        title={node.title}
        onWordCountChange={handleWordCount}
      />
    </div>
  );
}
