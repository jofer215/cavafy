// Cavafy — free novel writing software
// Copyright (C) 2024  Joshua Ferris
// SPDX-License-Identifier: GPL-3.0-or-later
"use client";

import { useProjectStore } from "@/store/project";
import { collectDocuments } from "@/lib/project/schema";
import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateId } from "@/lib/utils";

const PLOT_COLORS = [
  "#6366f1", "#ec4899", "#0ea5e9", "#f59e0b",
  "#22c55e", "#f97316", "#8b5cf6", "#ef4444",
];

function CellButton({
  note,
  color,
  onClick,
}: {
  note: string;
  color: string;
  onClick: () => void;
}) {
  const filled = note.trim().length > 0;
  return (
    <button
      onClick={onClick}
      className="w-full h-full min-h-[44px] rounded transition-all text-xs px-1 py-1 leading-tight"
      style={{
        backgroundColor: filled ? color + "30" : "transparent",
        border: `1.5px solid ${filled ? color : "var(--border)"}`,
        color: filled ? color : "var(--text-faint)",
      }}
      title={note || "Click to add note"}
    >
      {filled ? (
        <span className="line-clamp-2">{note}</span>
      ) : (
        <span className="opacity-0 group-hover:opacity-100">+</span>
      )}
    </button>
  );
}

function CellEditor({
  value,
  onSave,
  onClose,
  color,
}: {
  value: string;
  onSave: (v: string) => void;
  onClose: () => void;
  color: string;
}) {
  const [draft, setDraft] = useState(value);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="rounded-xl p-4 w-72 flex flex-col gap-3"
        style={{
          backgroundColor: "var(--bg-elevated)",
          border: `2px solid ${color}`,
          boxShadow: "var(--shadow-md)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a note for this scene (optional)…"
          className="resize-none text-sm bg-transparent outline-none"
          style={{ color: "var(--text)", minHeight: 80 }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.metaKey) { onSave(draft); onClose(); }
            if (e.key === "Escape") onClose();
          }}
        />
        <div className="flex gap-2 justify-end">
          {value && (
            <button
              onClick={() => { onSave(""); onClose(); }}
              className="text-xs px-3 py-1.5 rounded-lg hover:bg-[var(--bg-panel)] transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              Clear
            </button>
          )}
          <button
            onClick={() => { onSave(draft); onClose(); }}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
            style={{ backgroundColor: color, color: "#fff" }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export function PlotGridView() {
  const { project, addPlotLine, removePlotLine, setPlotCell, save } = useProjectStore();
  const [newLineName, setNewLineName] = useState("");
  const [colorIdx, setColorIdx] = useState(0);
  const [editing, setEditing] = useState<{ plotLineId: string; nodeId: string } | null>(null);

  if (!project) return null;

  const docs = collectDocuments(project.binder);
  const plotLines = project.plotGrid?.plotLines ?? [];
  const cells = project.plotGrid?.cells ?? {};

  const handleAddLine = async () => {
    if (!newLineName.trim()) return;
    addPlotLine(newLineName.trim(), PLOT_COLORS[colorIdx % PLOT_COLORS.length]);
    setNewLineName("");
    setColorIdx((i) => i + 1);
    await save();
  };

  const handleRemoveLine = async (id: string) => {
    removePlotLine(id);
    await save();
  };

  const handleCellSave = async (plotLineId: string, nodeId: string, note: string) => {
    setPlotCell(plotLineId, nodeId, note);
    await save();
  };

  const editingCell = editing
    ? { note: cells[editing.plotLineId]?.[editing.nodeId]?.note ?? "" }
    : null;

  if (docs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
        <p className="text-sm" style={{ color: "var(--text-faint)" }}>
          Add documents to the Manuscript to use the Plot Grid.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
      {/* Header */}
      <div
        className="shrink-0 flex items-center gap-4 px-6 py-3 border-b"
        style={{ backgroundColor: "var(--bg-sidebar)", borderColor: "var(--border)" }}
      >
        <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Plot Grid</span>
        <div className="flex items-center gap-2 ml-auto">
          <input
            value={newLineName}
            onChange={(e) => setNewLineName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddLine()}
            placeholder="New plot line…"
            className="text-sm px-3 py-1.5 rounded-lg bg-transparent border outline-none focus:border-[var(--accent)]"
            style={{ borderColor: "var(--border)", color: "var(--text)", width: 180 }}
          />
          <div className="flex gap-1">
            {PLOT_COLORS.map((c, i) => (
              <button
                key={c}
                onClick={() => setColorIdx(i)}
                className="w-4 h-4 rounded-full transition-transform"
                style={{
                  backgroundColor: c,
                  transform: colorIdx % PLOT_COLORS.length === i ? "scale(1.3)" : undefined,
                  outline: colorIdx % PLOT_COLORS.length === i ? `2px solid ${c}` : "none",
                  outlineOffset: 1,
                }}
              />
            ))}
          </div>
          <button
            onClick={handleAddLine}
            disabled={!newLineName.trim()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40 transition-colors"
            style={{ backgroundColor: "var(--accent)", color: "var(--accent-fg)" }}
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {plotLines.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm" style={{ color: "var(--text-faint)" }}>
            Add a plot line above to get started.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="border-collapse" style={{ minWidth: "100%" }}>
            <thead>
              <tr>
                {/* Plot line label column */}
                <th
                  className="sticky left-0 z-10 text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b border-r"
                  style={{
                    backgroundColor: "var(--bg-sidebar)",
                    borderColor: "var(--border)",
                    color: "var(--text-faint)",
                    minWidth: 140,
                  }}
                >
                  Plot Line
                </th>
                {docs.map((doc) => (
                  <th
                    key={doc.id}
                    className="px-2 py-2 text-xs border-b border-r"
                    style={{
                      backgroundColor: "var(--bg-sidebar)",
                      borderColor: "var(--border)",
                      color: "var(--text-muted)",
                      minWidth: 100,
                      maxWidth: 130,
                    }}
                  >
                    <span className="block truncate" title={doc.title}>
                      {doc.title}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plotLines.map((line) => (
                <tr key={line.id} className="group/row">
                  {/* Row label */}
                  <td
                    className="sticky left-0 z-10 px-3 py-2 border-b border-r"
                    style={{
                      backgroundColor: "var(--bg-sidebar)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: line.color }}
                      />
                      <span className="text-sm truncate flex-1" style={{ color: "var(--text)" }}>
                        {line.name}
                      </span>
                      <button
                        onClick={() => handleRemoveLine(line.id)}
                        className="opacity-0 group-hover/row:opacity-100 p-0.5 rounded hover:bg-[var(--bg-panel)] transition-opacity shrink-0"
                        style={{ color: "var(--text-faint)" }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </td>
                  {/* Cells */}
                  {docs.map((doc) => (
                    <td
                      key={doc.id}
                      className="px-1.5 py-1.5 border-b border-r group"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <CellButton
                        note={cells[line.id]?.[doc.id]?.note ?? ""}
                        color={line.color}
                        onClick={() => setEditing({ plotLineId: line.id, nodeId: doc.id })}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cell edit modal */}
      {editing && editingCell && (
        <CellEditor
          value={editingCell.note}
          color={plotLines.find((l) => l.id === editing.plotLineId)?.color ?? "var(--accent)"}
          onSave={(note) => handleCellSave(editing.plotLineId, editing.nodeId, note)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
