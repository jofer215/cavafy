"use client";

import { useProjectStore } from "@/store/project";
import { getPieceTypes } from "@/lib/project/schema";
import { getPieceIcon } from "./pieceIcons";
import { Link2, StickyNote, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

export function PieceDetailedView() {
  const { project, selectedPieceId, setSelectedPiece } = useProjectStore();
  if (!project) return null;

  const pieces = project.pieces ?? [];
  const typeMap = new Map(getPieceTypes(project).map((t) => [t.id, t]));

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
        const type = typeMap.get(piece.pieceType);
        const Icon = getPieceIcon(type?.icon ?? "Circle");
        const selected = selectedPieceId === piece.id;

        return (
          <div
            key={piece.id}
            onClick={() => setSelectedPiece(piece.id)}
            className={cn(
              "flex items-start gap-4 px-6 py-4 border-b cursor-pointer transition-colors",
              selected ? "bg-[var(--bg-panel)]" : "hover:bg-[var(--bg-panel)]"
            )}
            style={{ borderColor: "var(--border)" }}
          >
            <Icon size={24} style={{ color: "var(--accent)", flexShrink: 0, marginTop: 2 }} strokeWidth={1.5} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{piece.name}</span>
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--bg-elevated)", color: "var(--accent)", border: "1px solid var(--border)" }}>
                  {type?.label ?? piece.pieceType}
                </span>
              </div>
              {piece.alternativeNames.length > 0 && (
                <p className="text-xs mb-1" style={{ color: "var(--text-faint)" }}>
                  Also: {piece.alternativeNames.join(", ")}
                </p>
              )}
              {piece.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1">
                  {piece.tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: "var(--bg-panel)", color: "var(--text-muted)" }}>
                      <Tag size={8} /> {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3" style={{ color: "var(--text-faint)" }}>
                <span className="flex items-center gap-1 text-xs"><StickyNote size={10} /> {piece.pieceNotes.length} notes</span>
                {piece.relations.length > 0 && (
                  <span className="flex items-center gap-1 text-xs"><Link2 size={10} /> {piece.relations.length} relations</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
