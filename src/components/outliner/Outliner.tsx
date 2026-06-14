"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronRight, FileText, Folder, FolderArchive, FolderOpen, Table2 } from "lucide-react";
import { useProjectStore } from "@/store/project";
import { BinderNode } from "@/lib/project/schema";
import { cn } from "@/lib/utils";

// ── Flatten binder tree into ordered rows ─────────────────────────────────

interface FlatRow {
  node: BinderNode;
  depth: number;
}

function flattenBinder(nodes: BinderNode[], depth = 0): FlatRow[] {
  const rows: FlatRow[] = [];
  for (const n of nodes) {
    if (n.type === "separator") continue;
    rows.push({ node: n, depth });
    if (n.type === "folder" && n.isExpanded && n.children) {
      rows.push(...flattenBinder(n.children, depth + 1));
    }
  }
  return rows;
}

// ── Option picker popover ──────────────────────────────────────────────────

function Picker({
  items,
  currentId,
  onPick,
  onClose,
}: {
  items: { id: string; name: string; color: string }[];
  currentId?: string;
  onPick: (id: string | null) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 z-40 rounded-lg py-1 min-w-[160px]"
      style={{
        backgroundColor: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <button
        onClick={() => { onPick(null); onClose(); }}
        className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--bg-panel)] transition-colors"
        style={{ color: "var(--text-faint)" }}
      >
        — None
      </button>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => { onPick(item.id); onClose(); }}
          className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-[var(--bg-panel)] transition-colors"
          style={{ color: "var(--text)" }}
        >
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
          <span className="flex-1 text-left">{item.name}</span>
          {item.id === currentId && (
            <span style={{ color: "var(--accent)" }}>✓</span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Table row ──────────────────────────────────────────────────────────────

type EditTarget = { nodeId: string; col: "status" | "label" | "synopsis" };

function OutlinerRow({
  row,
  editTarget,
  onSetEdit,
  onCommit,
}: {
  row: FlatRow;
  editTarget: EditTarget | null;
  onSetEdit: (t: EditTarget | null) => void;
  onCommit: (nodeId: string, col: "status" | "label" | "synopsis", value: string | null) => Promise<void>;
}) {
  const { project, setSelectedNode, selectedNodeId, toggleExpanded } = useProjectStore();
  const { node, depth } = row;
  const isFolder = node.type === "folder";
  const isArchive = node.role === "archive";
  const isInactive = node.isActive === false;
  const isSelected = selectedNodeId === node.id;

  const meta = project?.metadata[node.id];
  const status = meta?.status ? project?.statuses.find((s) => s.id === meta.status) : undefined;
  const label = meta?.label ? project?.labels.find((l) => l.id === meta.label) : undefined;
  const synopsis = meta?.synopsis ?? "";
  const wordCount = (meta?.customFields?._wordCount as number) ?? 0;
  const tags = meta?.tags ?? {};

  const editingStatus = editTarget?.nodeId === node.id && editTarget.col === "status";
  const editingLabel = editTarget?.nodeId === node.id && editTarget.col === "label";
  const editingSynopsis = editTarget?.nodeId === node.id && editTarget.col === "synopsis";

  const [synopsisDraft, setSynopsisDraft] = useState(synopsis);
  useEffect(() => {
    if (!editingSynopsis) setSynopsisDraft(synopsis);
  }, [synopsis, editingSynopsis]);

  const FolderIcon = isArchive ? FolderArchive : node.isExpanded ? FolderOpen : Folder;

  const cell = "px-3 py-2 text-xs border-b";
  const borderColor = "var(--border-soft)";

  return (
    <tr
      className={cn(isInactive && "opacity-40")}
      style={{
        backgroundColor: isSelected
          ? "color-mix(in srgb, var(--accent) 8%, transparent)"
          : undefined,
      }}
    >
      {/* Title */}
      <td
        className={cn(cell, "cursor-pointer hover:bg-[var(--bg-panel)] transition-colors")}
        style={{ borderColor, paddingLeft: `${8 + depth * 16}px`, color: "var(--text)" }}
        onClick={() => setSelectedNode(node.id)}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {isFolder ? (
            <button
              onClick={(e) => { e.stopPropagation(); toggleExpanded(node.id); }}
              className="shrink-0 p-0.5 rounded hover:bg-black/10 transition-colors"
            >
              <ChevronRight
                size={11}
                className="transition-transform"
                style={{
                  transform: node.isExpanded ? "rotate(90deg)" : undefined,
                  color: "var(--text-faint)",
                }}
              />
            </button>
          ) : (
            <span className="w-[19px] shrink-0" />
          )}
          {isFolder ? (
            <FolderIcon
              size={13}
              className="shrink-0"
              style={{ color: isArchive ? "var(--text-faint)" : "var(--accent)" }}
            />
          ) : (
            <FileText size={13} className="shrink-0" style={{ color: "var(--text-muted)" }} />
          )}
          <span className="truncate">{node.title}</span>
        </div>
      </td>

      {/* Status */}
      <td
        className={cn(cell, !isFolder && "cursor-pointer hover:bg-[var(--bg-panel)] transition-colors")}
        style={{ borderColor }}
        onClick={() => !isFolder && onSetEdit({ nodeId: node.id, col: "status" })}
      >
        <div className="relative">
          {status ? (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium leading-none whitespace-nowrap"
              style={{ backgroundColor: status.color + "22", color: status.color }}
            >
              {status.name}
            </span>
          ) : (
            !isFolder && <span style={{ color: "var(--text-faint)" }}>—</span>
          )}
          {editingStatus && project && (
            <Picker
              items={project.statuses}
              currentId={meta?.status}
              onPick={(id) => onCommit(node.id, "status", id)}
              onClose={() => onSetEdit(null)}
            />
          )}
        </div>
      </td>

      {/* Label */}
      <td
        className={cn(cell, !isFolder && "cursor-pointer hover:bg-[var(--bg-panel)] transition-colors")}
        style={{ borderColor }}
        onClick={() => !isFolder && onSetEdit({ nodeId: node.id, col: "label" })}
      >
        <div className="relative">
          {label ? (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
              <span className="truncate" style={{ color: "var(--text-muted)" }}>{label.name}</span>
            </span>
          ) : (
            !isFolder && <span style={{ color: "var(--text-faint)" }}>—</span>
          )}
          {editingLabel && project && (
            <Picker
              items={project.labels}
              currentId={meta?.label}
              onPick={(id) => onCommit(node.id, "label", id)}
              onClose={() => onSetEdit(null)}
            />
          )}
        </div>
      </td>

      {/* Word count */}
      <td
        className={cell}
        style={{
          borderColor,
          textAlign: "right",
          color: "var(--text-muted)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {!isFolder && wordCount > 0 ? wordCount.toLocaleString() : ""}
      </td>

      {/* Synopsis */}
      <td
        className={cn(cell, !isFolder && !editingSynopsis && "cursor-pointer hover:bg-[var(--bg-panel)] transition-colors")}
        style={{ borderColor }}
        onClick={() => !isFolder && !editingSynopsis && onSetEdit({ nodeId: node.id, col: "synopsis" })}
      >
        {editingSynopsis ? (
          <textarea
            autoFocus
            value={synopsisDraft}
            onChange={(e) => setSynopsisDraft(e.target.value)}
            onBlur={() => { onCommit(node.id, "synopsis", synopsisDraft); onSetEdit(null); }}
            onKeyDown={(e) => {
              if (e.key === "Escape") { setSynopsisDraft(synopsis); onSetEdit(null); }
            }}
            rows={2}
            className="w-full bg-transparent resize-none outline-none text-xs leading-relaxed"
            style={{ color: "var(--text)" }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="block truncate"
            style={{ color: synopsis ? "var(--text-muted)" : "var(--text-faint)" }}
          >
            {synopsis || (!isFolder ? "Click to add synopsis…" : "")}
          </span>
        )}
      </td>

      {/* POV */}
      <td className={cell} style={{ borderColor, color: "var(--text-muted)" }}>
        <span className="block truncate">{(tags.pov ?? []).join(", ")}</span>
      </td>

      {/* Characters */}
      <td className={cell} style={{ borderColor, color: "var(--text-muted)" }}>
        <span className="block truncate">{(tags.char ?? []).join(", ")}</span>
      </td>

      {/* Location */}
      <td className={cell} style={{ borderColor, color: "var(--text-muted)" }}>
        <span className="block truncate">{(tags.location ?? []).join(", ")}</span>
      </td>
    </tr>
  );
}

// ── Main view ──────────────────────────────────────────────────────────────

export function OutlinerView() {
  const { project, updateMetadata, save } = useProjectStore();
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  const handleCommit = useCallback(
    async (nodeId: string, col: "status" | "label" | "synopsis", value: string | null) => {
      if (!project) return;
      if (col === "synopsis") {
        updateMetadata(nodeId, { synopsis: value ?? "" });
      } else if (col === "status") {
        updateMetadata(nodeId, { status: value ?? undefined });
      } else if (col === "label") {
        updateMetadata(nodeId, { label: value ?? undefined });
      }
      await save();
    },
    [project, updateMetadata, save]
  );

  if (!project) return null;

  const rows = flattenBinder(project.binder);
  const docCount = rows.filter((r) => r.node.type === "document").length;

  const th: React.CSSProperties = {
    textAlign: "left",
    padding: "6px 12px",
    fontSize: 10,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "var(--text-faint)",
    borderBottom: "1px solid var(--border)",
    backgroundColor: "var(--bg-sidebar)",
    position: "sticky",
    top: 0,
    zIndex: 10,
    whiteSpace: "nowrap",
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
      {/* Header */}
      <div
        className="shrink-0 flex items-center gap-2 px-6 py-2 border-b"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-sidebar)" }}
      >
        <Table2 size={14} style={{ color: "var(--accent)" }} />
        <span className="text-sm font-medium" style={{ color: "var(--text)" }}>Outliner</span>
        <span className="text-xs" style={{ color: "var(--text-faint)" }}>
          — {docCount} {docCount === 1 ? "document" : "documents"}
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ minWidth: 220 }} />
            <col style={{ width: 132 }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 68 }} />
            <col />
            <col style={{ width: 108 }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 108 }} />
          </colgroup>
          <thead>
            <tr>
              <th style={th}>Title</th>
              <th style={th}>Status</th>
              <th style={th}>Type</th>
              <th style={{ ...th, textAlign: "right" }}>Words</th>
              <th style={th}>Synopsis</th>
              <th style={th}>POV</th>
              <th style={th}>Characters</th>
              <th style={th}>Location</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <OutlinerRow
                key={row.node.id}
                row={row}
                editTarget={editTarget}
                onSetEdit={setEditTarget}
                onCommit={handleCommit}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
