// Cavafy — free novel writing software
// Copyright (C) 2024  Joshua Ferris
// SPDX-License-Identifier: GPL-3.0-or-later
"use client";

import { useProjectStore } from "@/store/project";
import { Piece, PieceType, getPieceTypes } from "@/lib/project/schema";
import { getPieceIcon } from "./pieceIcons";
import { Plus, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PieceBoardViewProps {
  onNewPiece: () => void;
}

export function PieceBoardView({ onNewPiece }: PieceBoardViewProps) {
  const { project, selectedPieceId, setSelectedPiece } = useProjectStore();
  if (!project) return null;

  const pieces = project.pieces ?? [];
  const typeMap = new Map(getPieceTypes(project).map((t) => [t.id, t]));

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}>
        {pieces.map((piece) => (
          <PieceCard
            key={piece.id}
            piece={piece}
            type={typeMap.get(piece.pieceType)}
            selected={selectedPieceId === piece.id}
            onSelect={() => setSelectedPiece(piece.id)}
          />
        ))}

        {/* New piece card */}
        <button
          onClick={onNewPiece}
          className="flex flex-col items-center justify-center gap-2 rounded-xl p-4 min-h-[120px] transition-colors hover:bg-[var(--bg-panel)]"
          style={{
            border: "2px dashed var(--border)",
            color: "var(--text-faint)",
          }}
        >
          <Plus size={20} />
          <span className="text-xs">New Piece</span>
        </button>
      </div>
    </div>
  );
}

function PieceCard({
  piece, type, selected, onSelect,
}: {
  piece: Piece;
  type: PieceType | undefined;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = getPieceIcon(type?.icon ?? "Circle");
  const relationCount = piece.relations.length;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl p-4 text-left transition-all",
        selected ? "bg-[var(--bg-panel)]" : "bg-[var(--bg-elevated)] hover:bg-[var(--bg-panel)]"
      )}
      style={{
        border: selected ? "2px solid var(--accent)" : "1px solid var(--border)",
        minHeight: 120,
      }}
    >
      {/* Type icon */}
      <Icon size={36} style={{ color: "var(--accent)" }} strokeWidth={1.5} />

      {/* Name */}
      <span
        className="text-xs font-medium text-center leading-tight line-clamp-2 w-full"
        style={{ color: "var(--text)" }}
      >
        {piece.name}
      </span>

      {/* Type label */}
      <span className="text-xs" style={{ color: "var(--accent)" }}>
        {type?.label ?? piece.pieceType}
      </span>

      {/* Relation badge */}
      {relationCount > 0 && (
        <div className="flex items-center gap-1 mt-auto" style={{ color: "var(--text-faint)" }}>
          <Link2 size={10} />
          <span className="text-xs">{relationCount}</span>
        </div>
      )}
    </button>
  );
}
