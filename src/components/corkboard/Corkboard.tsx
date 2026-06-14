// Cavafy — free novel writing software
// Copyright (C) 2024  Joshua Ferris
// SPDX-License-Identifier: GPL-3.0-or-later
"use client";

import { useState } from "react";
import { LayoutGrid, Folder, FileText, Home, ChevronRight } from "lucide-react";
import { useProjectStore } from "@/store/project";
import { BinderNode, findNode } from "@/lib/project/schema";
import { cn } from "@/lib/utils";

function findPath(nodes: BinderNode[], targetId: string, path: BinderNode[] = []): BinderNode[] | null {
  for (const n of nodes) {
    const next = [...path, n];
    if (n.id === targetId) return next;
    if (n.children) {
      const found = findPath(n.children, targetId, next);
      if (found) return found;
    }
  }
  return null;
}

function IndexCard({
  node,
  index,
  isDragging,
  isDropTarget,
  onSelect,
  onDrillDown,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  node: BinderNode;
  index: number;
  isDragging: boolean;
  isDropTarget: boolean;
  onSelect: (id: string) => void;
  onDrillDown: (id: string) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (toIndex: number) => void;
}) {
  const { project } = useProjectStore();
  const isFolder = node.type === "folder";
  const isInactive = node.isActive === false;

  const meta = project?.metadata[node.id];
  const label = meta?.label ? project?.labels.find((l) => l.id === meta.label) : undefined;
  const status = meta?.status ? project?.statuses.find((s) => s.id === meta.status) : undefined;
  const synopsis = meta?.synopsis ?? "";
  const wordCount = (meta?.customFields?._wordCount as number) ?? 0;
  const childCount = node.children?.length ?? 0;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(e, index); }}
      onDrop={(e) => { e.preventDefault(); onDrop(index); }}
      onClick={() => isFolder ? onDrillDown(node.id) : onSelect(node.id)}
      className={cn(
        "flex flex-col rounded-lg border cursor-pointer select-none transition-all duration-150",
        "hover:shadow-lg hover:-translate-y-0.5",
        isInactive && "opacity-40",
        isDragging && "opacity-30 scale-95 shadow-none",
        isDropTarget && "ring-2 ring-[var(--accent)] ring-offset-2",
      )}
      style={{
        backgroundColor: "var(--bg-panel)",
        borderColor: "var(--border)",
        borderTopColor: label?.color ?? "var(--border)",
        borderTopWidth: label ? 3 : 1,
        width: 180,
        minHeight: 200,
      }}
    >
      {/* Icon + title */}
      <div className="flex items-start gap-1.5 px-3 pt-3 pb-2">
        {isFolder
          ? <Folder size={12} className="shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
          : <FileText size={12} className="shrink-0 mt-0.5" style={{ color: "var(--text-muted)" }} />
        }
        <span className="text-xs font-semibold leading-tight" style={{ color: "var(--text)" }}>
          {node.title}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 px-3 pb-2">
        {isFolder ? (
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>
            {childCount} {childCount === 1 ? "item" : "items"}
          </p>
        ) : synopsis ? (
          <p
            className="text-xs leading-relaxed"
            style={{
              color: "var(--text-muted)",
              display: "-webkit-box",
              WebkitLineClamp: 6,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {synopsis}
          </p>
        ) : (
          <p className="text-xs italic" style={{ color: "var(--text-faint)" }}>No synopsis</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 pb-3 mt-auto">
        {status ? (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium leading-none"
            style={{ backgroundColor: status.color + "22", color: status.color }}
          >
            {status.name}
          </span>
        ) : <span />}
        {!isFolder && wordCount > 0 && (
          <span className="text-[10px] tabular-nums" style={{ color: "var(--text-faint)" }}>
            {wordCount.toLocaleString()}w
          </span>
        )}
      </div>
    </div>
  );
}

export function CorkboardView() {
  const { project, selectedNodeId, setSelectedNode, reorderChildren, save } = useProjectStore();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  if (!project) return null;

  const currentNode = selectedNodeId ? findNode(project.binder, selectedNodeId) : null;
  const viewingFolder = currentNode?.type === "folder" ? currentNode : null;
  const items: BinderNode[] = viewingFolder ? (viewingFolder.children ?? []) : project.binder;
  const parentId = viewingFolder?.id ?? null;

  const breadcrumb = selectedNodeId && viewingFolder
    ? (findPath(project.binder, selectedNodeId) ?? [])
    : [];

  const handleDrop = async (toIndex: number) => {
    if (dragIndex === null || dragIndex === toIndex) {
      setDragIndex(null);
      setDropIndex(null);
      return;
    }
    reorderChildren(parentId, dragIndex, toIndex);
    setDragIndex(null);
    setDropIndex(null);
    await save();
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
      {/* Header with breadcrumb */}
      <div
        className="shrink-0 flex items-center gap-2 px-8 py-2 border-b"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-sidebar)" }}
      >
        <LayoutGrid size={14} style={{ color: "var(--accent)" }} />

        <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
          <button
            onClick={() => setSelectedNode(null)}
            className="flex items-center gap-1 hover:text-[var(--accent)] transition-colors"
          >
            <Home size={11} />
            <span>{project.name}</span>
          </button>
          {breadcrumb.map((n) => (
            <span key={n.id} className="flex items-center gap-1">
              <ChevronRight size={10} style={{ color: "var(--text-faint)" }} />
              <button
                onClick={() => setSelectedNode(n.id)}
                className="hover:text-[var(--accent)] transition-colors"
                style={{ color: n.id === selectedNodeId ? "var(--text)" : undefined }}
              >
                {n.title}
              </button>
            </span>
          ))}
        </div>

        <span className="ml-auto text-xs tabular-nums" style={{ color: "var(--text-faint)" }}>
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </div>

      {/* Cards */}
      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <LayoutGrid size={36} strokeWidth={1} style={{ color: "var(--text-faint)" }} />
          <p className="text-sm" style={{ color: "var(--text-faint)" }}>
            {viewingFolder ? `No items in "${viewingFolder.title}"` : "No items in project"}
          </p>
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>
            Add documents in the binder.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div
            className="flex flex-wrap gap-5 p-8"
            onDragEnd={() => { setDragIndex(null); setDropIndex(null); }}
          >
            {items.map((node, i) => (
              <IndexCard
                key={node.id}
                node={node}
                index={i}
                isDragging={dragIndex === i}
                isDropTarget={dropIndex === i && dragIndex !== i}
                onSelect={setSelectedNode}
                onDrillDown={setSelectedNode}
                onDragStart={setDragIndex}
                onDragOver={(e, idx) => setDropIndex(idx)}
                onDrop={handleDrop}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
