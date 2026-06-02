"use client";

import { useProjectStore } from "@/store/project";
import { DEFAULT_PIECE_TYPES } from "@/lib/project/schema";
import { getPieceIcon } from "./pieceIcons";
import { cn } from "@/lib/utils";

export function PieceSimpleView() {
  const { project, selectedPieceId, setSelectedPiece } = useProjectStore();
  if (!project) return null;

  const pieces = project.pieces ?? [];
  const pieceTypes = project.pieceTypes ?? DEFAULT_PIECE_TYPES;

  if (pieces.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm" style={{ color: "var(--text-faint)" }}>No pieces yet.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {pieces.map((piece) => {
        const type = pieceTypes.find((t) => t.id === piece.pieceType);
        const Icon = getPieceIcon(type?.icon ?? "Circle");
        const selected = selectedPieceId === piece.id;

        return (
          <button
            key={piece.id}
            onClick={() => setSelectedPiece(piece.id)}
            className={cn(
              "flex items-center gap-3 w-full px-6 py-2.5 border-b text-left transition-colors",
              selected ? "bg-[var(--bg-panel)]" : "hover:bg-[var(--bg-panel)]"
            )}
            style={{ borderColor: "var(--border)" }}
          >
            <Icon size={16} style={{ color: "var(--accent)", flexShrink: 0 }} />
            <span className="flex-1 text-sm truncate" style={{ color: "var(--text)" }}>{piece.name}</span>
            <span className="text-xs shrink-0" style={{ color: "var(--text-faint)" }}>
              {type?.label ?? piece.pieceType}
            </span>
          </button>
        );
      })}
    </div>
  );
}
