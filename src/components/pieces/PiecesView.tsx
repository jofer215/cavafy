"use client";

import { useEffect, useState } from "react";
import { useProjectStore } from "@/store/project";
import { DEFAULT_PIECE_TYPES, Piece } from "@/lib/project/schema";
import { PieceBoardView } from "./PieceBoardView";
import { PieceDetailedView } from "./PieceDetailedView";
import { PieceSimpleView } from "./PieceSimpleView";
import { PieceTypesView } from "./PieceTypesView";
import { cn } from "@/lib/utils";
import { BookMarked, Plus, X } from "lucide-react";

type SubView = "board" | "detailed" | "simple" | "types";

const SUB_VIEWS: { id: SubView; label: string }[] = [
  { id: "board",    label: "Piece Board"  },
  { id: "detailed", label: "Detailed"     },
  { id: "simple",   label: "Simple"       },
  { id: "types",    label: "Piece Types"  },
];

interface PiecesViewProps {
  projectId: string;
}

export function PiecesView({ projectId: _projectId }: PiecesViewProps) {
  const { project, addPiece, save } = useProjectStore();
  const [subView, setSubView] = useState<SubView>("board");
  const [showNewPiece, setShowNewPiece] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("character");

  // Listen for sub-view switches dispatched from Binder
  useEffect(() => {
    const handler = (e: Event) => {
      const sv = (e as CustomEvent<SubView>).detail;
      setSubView(sv);
    };
    window.addEventListener("cavafy:pieces-subview", handler);
    return () => window.removeEventListener("cavafy:pieces-subview", handler);
  }, []);

  // Listen for new-piece trigger dispatched from Binder's + button
  useEffect(() => {
    const handler = () => setShowNewPiece(true);
    window.addEventListener("cavafy:new-piece", handler);
    return () => window.removeEventListener("cavafy:new-piece", handler);
  }, []);

  if (!project) return null;

  const pieceTypes = project.pieceTypes ?? DEFAULT_PIECE_TYPES;

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const piece: Piece = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      alternativeNames: [],
      pieceType: newType,
      pieceNotes: [{ id: crypto.randomUUID(), title: "Description", body: "" }],
      tags: [],
      relations: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addPiece(piece);
    await save();
    setShowNewPiece(false);
    setNewName("");
    setNewType("character");
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
      {/* Sub-header */}
      <div className="shrink-0 flex items-center justify-between px-4 border-b"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-sidebar)" }}>
        <div className="flex items-center">
          {SUB_VIEWS.map((sv) => (
            <button
              key={sv.id}
              onClick={() => setSubView(sv.id)}
              className={cn(
                "px-3 py-2.5 text-xs font-medium transition-colors whitespace-nowrap",
                subView === sv.id
                  ? "border-b-2 border-[var(--accent)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              )}
              style={{ color: subView === sv.id ? "var(--accent)" : undefined }}
            >
              {sv.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 py-1.5">
          <button
            onClick={() => setShowNewPiece(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ backgroundColor: "var(--accent)", color: "var(--accent-fg)" }}
          >
            <Plus size={12} /> Add New
          </button>
        </div>
      </div>

      {/* New Piece dialog */}
      {showNewPiece && (
        <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-elevated)" }}>
          <BookMarked size={14} style={{ color: "var(--accent)" }} />
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setShowNewPiece(false); }}
            placeholder="Piece name…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text)" }}
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            className="text-xs bg-transparent outline-none border rounded px-2 py-1"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            {pieceTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
          <button
            onClick={handleCreate}
            className="px-3 py-1 rounded text-xs font-medium"
            style={{ backgroundColor: "var(--accent)", color: "var(--accent-fg)" }}
          >
            Create
          </button>
          <button onClick={() => setShowNewPiece(false)} style={{ color: "var(--text-faint)" }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Empty state */}
      {(project.pieces ?? []).length === 0 && subView !== "types" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <BookMarked size={40} strokeWidth={1} style={{ color: "var(--text-faint)" }} />
          <p className="text-sm" style={{ color: "var(--text-faint)" }}>No pieces yet.</p>
          <p className="text-xs text-center max-w-xs" style={{ color: "var(--text-faint)" }}>
            Add characters, places, objects — any world-building element your story needs.
          </p>
          <button
            onClick={() => setShowNewPiece(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium mt-2"
            style={{ backgroundColor: "var(--accent)", color: "var(--accent-fg)" }}
          >
            <Plus size={12} /> Add your first piece
          </button>
        </div>
      )}

      {/* Sub-views */}
      {(project.pieces ?? []).length > 0 || subView === "types" ? (
        <>
          {subView === "board"    && <PieceBoardView onNewPiece={() => setShowNewPiece(true)} />}
          {subView === "detailed" && <PieceDetailedView />}
          {subView === "simple"   && <PieceSimpleView />}
          {subView === "types"    && <PieceTypesView />}
        </>
      ) : null}
    </div>
  );
}
