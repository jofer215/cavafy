"use client";

import { ChevronRight, FileText, Folder, FolderOpen, MoreHorizontal } from "lucide-react";
import { BinderNode } from "@/lib/project/schema";
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/store/project";
import { useState, useRef, useEffect } from "react";

interface BinderItemProps {
  node: BinderNode;
  depth?: number;
  statusColor?: string;
  labelColor?: string;
}

export function BinderItem({ node, depth = 0, statusColor, labelColor }: BinderItemProps) {
  const { selectedNodeId, setSelectedNode, toggleExpanded, project, save } = useProjectStore();
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(node.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const isSelected = selectedNodeId === node.id;
  const isFolder = node.type === "folder";

  useEffect(() => {
    if (renaming) inputRef.current?.select();
  }, [renaming]);

  const handleClick = () => {
    if (isFolder) {
      toggleExpanded(node.id);
    } else {
      setSelectedNode(node.id);
    }
  };

  const commitRename = async () => {
    if (!project) return;
    setRenaming(false);
    if (draft.trim() && draft !== node.title) {
      // update binder in store
      const updateNode = (nodes: BinderNode[]): BinderNode[] =>
        nodes.map((n) => {
          if (n.id === node.id) return { ...n, title: draft.trim() };
          if (n.children) return { ...n, children: updateNode(n.children) };
          return n;
        });
      useProjectStore.setState((s) =>
        s.project ? { project: { ...s.project, binder: updateNode(s.project.binder) } } : {}
      );
      await save();
    }
  };

  const nodeMeta = project?.metadata[node.id];
  const status = nodeMeta?.status
    ? project?.statuses.find((s) => s.id === nodeMeta.status)
    : undefined;
  const label = nodeMeta?.label
    ? project?.labels.find((l) => l.id === nodeMeta.label)
    : undefined;

  return (
    <li>
      <div
        className={cn(
          "group flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer text-sm select-none",
          isSelected && !isFolder
            ? "bg-[var(--accent)] text-[var(--accent-fg)]"
            : "hover:bg-[var(--bg-panel)] text-[var(--text)]"
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={handleClick}
        onDoubleClick={() => setRenaming(true)}
      >
        {isFolder ? (
          <>
            <ChevronRight
              size={12}
              className="shrink-0 transition-transform"
              style={{ transform: node.isExpanded ? "rotate(90deg)" : undefined }}
            />
            {node.isExpanded ? (
              <FolderOpen size={14} className="shrink-0" />
            ) : (
              <Folder size={14} className="shrink-0" />
            )}
          </>
        ) : (
          <FileText size={14} className="shrink-0 ml-[16px]" />
        )}

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
            className="flex-1 bg-transparent outline-none border-b border-[var(--accent)] text-[var(--text)]"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 truncate">{node.title}</span>
        )}

        {/* Label dot */}
        {label && (
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: label.color }}
          />
        )}

        {/* Status dot */}
        {status && (
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0 opacity-70"
            style={{ backgroundColor: status.color }}
          />
        )}

        <button
          className={cn(
            "opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/10 transition-opacity shrink-0",
            isSelected && !isFolder && "hover:bg-white/20"
          )}
          onClick={(e) => {
            e.stopPropagation();
            setRenaming(true);
          }}
        >
          <MoreHorizontal size={12} />
        </button>
      </div>

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
