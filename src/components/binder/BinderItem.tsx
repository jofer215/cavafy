// Cavafy — free novel writing software
// Copyright (C) 2024  Joshua Ferris
// SPDX-License-Identifier: GPL-3.0-or-later
"use client";

import {
  ChevronRight, FileText, Folder, FolderOpen, FolderArchive,
  MoreHorizontal, EyeOff, Eye, Trash2,
} from "lucide-react";
import { BinderNode } from "@/lib/project/schema";
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/store/project";
import { useState, useRef, useEffect } from "react";

interface BinderItemProps {
  node: BinderNode;
  depth?: number;
}

export function BinderItem({ node, depth = 0 }: BinderItemProps) {
  const { selectedNodeId, setSelectedNode, toggleExpanded, toggleActive, updateBinder, deleteNode, project, save, addToCollection, removeFromCollection } =
    useProjectStore();
  const [renaming, setRenaming] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [draft, setDraft] = useState(node.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isSelected = selectedNodeId === node.id;
  const isFolder = node.type === "folder";
  const isInactive = node.isActive === false;
  const isArchive = node.role === "archive";

  useEffect(() => {
    if (renaming) inputRef.current?.select();
  }, [renaming]);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleExpanded(node.id);
  };

  const handleRowClick = () => {
    if (renaming) return;
    setSelectedNode(node.id);
    // Also expand folder on click
    if (isFolder && !node.isExpanded) toggleExpanded(node.id);
  };

  const commitRename = async () => {
    setRenaming(false);
    if (draft.trim() && draft !== node.title && project) {
      const renameNode = (nodes: BinderNode[]): BinderNode[] =>
        nodes.map((n) => {
          if (n.id === node.id) return { ...n, title: draft.trim() };
          if (n.children) return { ...n, children: renameNode(n.children) };
          return n;
        });
      updateBinder(renameNode(project.binder));
      await save();
    }
  };

  const handleToggleActive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    toggleActive(node.id);
    await save();
  };

  const nodeMeta = project?.metadata[node.id];
  const label = nodeMeta?.label
    ? project?.labels.find((l) => l.id === nodeMeta.label)
    : undefined;
  const status = nodeMeta?.status
    ? project?.statuses.find((s) => s.id === nodeMeta.status)
    : undefined;

  const FolderIcon = isArchive ? FolderArchive : node.isExpanded ? FolderOpen : Folder;

  return (
    <li>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md cursor-pointer text-sm select-none relative",
          isSelected
            ? isFolder
              ? "bg-[var(--bg-panel)]"
              : "bg-[var(--accent)] text-[var(--accent-fg)]"
            : "hover:bg-[var(--bg-panel)]",
          isInactive && "opacity-40"
        )}
        style={{
          paddingLeft: `${6 + depth * 16}px`,
          paddingRight: 6,
          paddingTop: 4,
          paddingBottom: 4,
          borderLeft: isSelected && isFolder
            ? "2px solid var(--accent)"
            : !isSelected && label
              ? `2px solid ${label.color}`
              : "2px solid transparent",
          color: isSelected && !isFolder ? "var(--accent-fg)" : "var(--text)",
        }}
        onClick={handleRowClick}
        onDoubleClick={() => setRenaming(true)}
      >
        {/* Chevron (folders only) */}
        {isFolder ? (
          <button
            onClick={handleChevronClick}
            className="shrink-0 p-0.5 rounded hover:bg-black/10 transition-colors"
            style={{ color: "inherit" }}
          >
            <ChevronRight
              size={12}
              className="transition-transform"
              style={{ transform: node.isExpanded ? "rotate(90deg)" : undefined }}
            />
          </button>
        ) : (
          <span className="shrink-0 w-5" />
        )}

        {/* Icon */}
        {isFolder ? (
          <FolderIcon
            size={14}
            className="shrink-0"
            style={{ color: isArchive ? "var(--text-faint)" : isSelected ? undefined : "var(--accent)" }}
          />
        ) : (
          <FileText size={14} className="shrink-0" style={{ color: isSelected ? undefined : "var(--text-muted)" }} />
        )}

        {/* Title / rename input */}
        {renaming ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") { setRenaming(false); setDraft(node.title); }
            }}
            className="flex-1 bg-transparent outline-none border-b text-sm min-w-0"
            style={{ borderColor: "var(--accent)", color: "var(--text)" }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 truncate text-sm">{node.title}</span>
        )}

        {/* Label dot */}
        {label && (
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
        )}
        {/* Status dot */}
        {status && (
          <span className="w-1.5 h-1.5 rounded-full shrink-0 opacity-60" style={{ backgroundColor: status.color }} />
        )}

        {/* Context menu trigger */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            className={cn(
              "opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity",
              isSelected && !isFolder ? "hover:bg-white/20" : "hover:bg-black/10",
              showMenu && "opacity-100"
            )}
            onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); }}
          >
            <MoreHorizontal size={12} />
          </button>

          {showMenu && (
            <div
              className="absolute right-0 top-full mt-1 rounded-lg py-1 w-44 z-30"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-md)",
              }}
            >
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-[var(--bg-panel)] transition-colors"
                style={{ color: "var(--text)" }}
                onClick={(e) => { e.stopPropagation(); setShowMenu(false); setRenaming(true); }}
              >
                Rename
              </button>
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-[var(--bg-panel)] transition-colors"
                style={{ color: "var(--text)" }}
                onClick={handleToggleActive}
              >
                {isInactive ? <Eye size={12} /> : <EyeOff size={12} />}
                {isInactive ? "Mark active" : "Mark inactive"}
              </button>

              <div className="mx-3 my-1 border-t" style={{ borderColor: "var(--border)" }} />
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-[var(--bg-panel)] transition-colors"
                style={{ color: "#ef4444" }}
                onClick={async (e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  const label = isFolder ? "folder and all its contents" : "document";
                  if (!confirm(`Delete "${node.title}"? This will remove the ${label} from the binder. The file will remain in Google Drive.`)) return;
                  deleteNode(node.id);
                  await save();
                }}
              >
                <Trash2 size={12} />
                Delete
              </button>

              {/* Add to / remove from collections — documents only */}
              {!isFolder && (project?.collections ?? []).length > 0 && (
                <>
                  <div className="mx-3 my-1 border-t" style={{ borderColor: "var(--border)" }} />
                  {(project?.collections ?? []).map((c) => {
                    const inCollection = c.nodeIds.includes(node.id);
                    return (
                      <button
                        key={c.id}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-[var(--bg-panel)] transition-colors"
                        style={{ color: "var(--text)" }}
                        onClick={async (e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          if (inCollection) {
                            removeFromCollection(c.id, node.id);
                          } else {
                            addToCollection(c.id, node.id);
                          }
                          await save();
                        }}
                      >
                        <span className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: inCollection ? "var(--accent)" : "var(--border)" }} />
                        {inCollection ? `Remove from "${c.name}"` : `Add to "${c.name}"`}
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Children */}
      {isFolder && node.isExpanded && node.children && node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <BinderItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}
