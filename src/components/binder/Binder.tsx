"use client";

import { Plus, FilePlus, FolderPlus } from "lucide-react";
import { useProjectStore } from "@/store/project";
import { BinderItem } from "./BinderItem";
import { BinderNode, findNode } from "@/lib/project/schema";
import { generateId } from "@/lib/utils";
import { useState } from "react";

function appendToNode(
  nodes: BinderNode[],
  parentId: string | null,
  child: BinderNode
): BinderNode[] {
  if (!parentId) return [...nodes, child];
  return nodes.map((n) => {
    if (n.id === parentId) {
      return { ...n, isExpanded: true, children: [...(n.children ?? []), child] };
    }
    if (n.children) return { ...n, children: appendToNode(n.children, parentId, child) };
    return n;
  });
}

export function Binder() {
  const { project, selectedNodeId, updateBinder, save } = useProjectStore();
  const [showAdd, setShowAdd] = useState(false);

  if (!project) return null;

  const addItem = async (type: "document" | "folder") => {
    const title = type === "folder" ? "New Folder" : "Untitled Scene";

    // Try to add inside selected folder, else at top level
    const parentId = (() => {
      if (!selectedNodeId) return null;
      const findFolder = (nodes: BinderNode[]): string | null => {
        for (const n of nodes) {
          if (n.id === selectedNodeId && n.type === "folder") return n.id;
          if (n.children) {
            const found = findFolder(n.children);
            if (found) return found;
          }
        }
        return null;
      };
      return findFolder(project.binder);
    })();

    // Resolve the Drive folder ID for the parent binder folder
    const parentDriveFolderId = parentId
      ? (findNode(project.binder, parentId)?.driveId ?? project.driveRootId)
      : project.driveRootId;

    let driveId: string | undefined;
    if (type === "document") {
      const res = await fetch(`/api/projects/${project.id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, parentFolderId: parentDriveFolderId }),
      });
      const data = await res.json();
      driveId = data.driveId;
    } else {
      const res = await fetch(`/api/projects/${project.id}/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, parentFolderId: parentDriveFolderId }),
      });
      const data = await res.json();
      driveId = data.driveId;
    }

    const newNode: BinderNode = {
      id: generateId(),
      title,
      type,
      driveId,
      children: type === "folder" ? [] : undefined,
    };

    const updated = appendToNode(project.binder, parentId, newNode);
    updateBinder(updated);
    await save();
    setShowAdd(false);
  };

  return (
    <aside
      className="flex flex-col h-full border-r"
      style={{
        width: 220,
        backgroundColor: "var(--bg-sidebar)",
        borderColor: "var(--border)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b shrink-0"
        style={{ borderColor: "var(--border)" }}
      >
        <span
          className="text-xs font-semibold uppercase tracking-wider truncate"
          style={{ color: "var(--text-faint)" }}
        >
          {project.name}
        </span>
        <div className="relative">
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="p-1 rounded hover:bg-[var(--bg-panel)] transition-colors"
            style={{ color: "var(--text-muted)" }}
            title="Add item"
          >
            <Plus size={14} />
          </button>
          {showAdd && (
            <div
              className="absolute right-0 top-full mt-1 rounded-lg shadow-lg z-20 py-1 w-40"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-md)",
              }}
            >
              <button
                onClick={() => addItem("document")}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-[var(--bg-panel)] transition-colors"
                style={{ color: "var(--text)" }}
              >
                <FilePlus size={14} /> New Document
              </button>
              <button
                onClick={() => addItem("folder")}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-[var(--bg-panel)] transition-colors"
                style={{ color: "var(--text)" }}
              >
                <FolderPlus size={14} /> New Folder
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tree */}
      <nav className="flex-1 overflow-y-auto py-2">
        <ul>
          {project.binder.map((node) => (
            <BinderItem key={node.id} node={node} />
          ))}
        </ul>
      </nav>
    </aside>
  );
}
