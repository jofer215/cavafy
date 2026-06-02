"use client";

import { useState, useEffect } from "react";
import { useProjectStore } from "@/store/project";
import { Piece, PieceNote, getPieceTypes, findNode } from "@/lib/project/schema";
import { getPieceIcon } from "@/components/pieces/pieceIcons";
import { cn } from "@/lib/utils";
import { Pencil, Plus, MoreHorizontal, Trash2, X, Link2 } from "lucide-react";
import { generateId } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

type TopTab = "details" | "appears";
type DetailsTab = "notes" | "relations" | "altnames";

interface PieceInspectorProps {
  piece: Piece;
}

export function PieceInspector({ piece }: PieceInspectorProps) {
  const { project, updatePiece, addPieceNote, updatePieceNote, deletePieceNote,
    addPieceRelation, removePieceRelation, setSelectedNode, save } = useProjectStore();

  const [topTab, setTopTab] = useState<TopTab>("details");
  const [detailsTab, setDetailsTab] = useState<DetailsTab>("notes");
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(piece.name);
  const [editingType, setEditingType] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [showRelationPicker, setShowRelationPicker] = useState(false);
  const [relationSearch, setRelationSearch] = useState("");

  const pieceTypes = getPieceTypes(project!);
  const type = pieceTypes.find((t) => t.id === piece.pieceType);
  const Icon = getPieceIcon(type?.icon ?? "Circle");

  const commitName = async () => {
    setEditingName(false);
    if (nameDraft.trim() && nameDraft !== piece.name) {
      updatePiece(piece.id, { name: nameDraft.trim() });
      await save();
    }
  };

  const handleTagAdd = async (e: React.KeyboardEvent) => {
    if (e.key !== "Enter" || !tagInput.trim()) return;
    const tag = tagInput.trim();
    if (!piece.tags.includes(tag)) {
      updatePiece(piece.id, { tags: [...piece.tags, tag] });
      await save();
    }
    setTagInput("");
  };

  const handleTagRemove = async (tag: string) => {
    updatePiece(piece.id, { tags: piece.tags.filter((t) => t !== tag) });
    await save();
  };

  return (
    <aside className="flex flex-col h-full border-l shrink-0"
      style={{ width: 248, backgroundColor: "var(--bg-sidebar)", borderColor: "var(--border)" }}>
      {/* Header */}
      <div className="px-4 py-3 border-b shrink-0 flex flex-col gap-2"
        style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <Icon size={18} style={{ color: "var(--accent)" }} strokeWidth={1.5} />
          {editingName ? (
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => { if (e.key === "Enter") commitName(); if (e.key === "Escape") { setEditingName(false); setNameDraft(piece.name); } }}
              className="flex-1 bg-transparent text-sm font-semibold outline-none border-b"
              style={{ borderColor: "var(--accent)", color: "var(--text)" }}
            />
          ) : (
            <span className="flex-1 text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
              {piece.name}
            </span>
          )}
          <button onClick={() => { setEditingName(true); setNameDraft(piece.name); }}
            className="p-1 rounded hover:bg-[var(--bg-panel)]" style={{ color: "var(--text-faint)" }}>
            <Pencil size={11} />
          </button>
        </div>

        {/* Type selector */}
        {editingType ? (
          <select
            autoFocus
            value={piece.pieceType}
            onChange={async (e) => { updatePiece(piece.id, { pieceType: e.target.value }); await save(); setEditingType(false); }}
            onBlur={() => setEditingType(false)}
            className="text-xs bg-transparent outline-none border rounded px-2 py-1 w-full"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            {pieceTypes.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        ) : (
          <button onClick={() => setEditingType(true)}
            className="flex items-center gap-1 self-start text-xs hover:opacity-80 transition-opacity"
            style={{ color: "var(--accent)" }}>
            {type?.label ?? piece.pieceType}
            <Pencil size={9} />
          </button>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {piece.tags.map((tag) => (
            <span key={tag} className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded group"
              style={{ backgroundColor: "var(--bg-panel)", color: "var(--text-muted)" }}>
              {tag}
              <button onClick={() => handleTagRemove(tag)} className="opacity-0 group-hover:opacity-100 ml-0.5">
                <X size={8} />
              </button>
            </span>
          ))}
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagAdd}
            placeholder={piece.tags.length === 0 ? "+ tag" : "+"}
            className="text-xs bg-transparent outline-none min-w-0"
            style={{ width: tagInput ? "auto" : 40, color: "var(--text-faint)" }}
          />
        </div>
      </div>

      {/* Top tabs */}
      <div className="flex border-b shrink-0" style={{ borderColor: "var(--border)" }}>
        {(["details", "appears"] as TopTab[]).map((t) => (
          <button key={t} onClick={() => setTopTab(t)}
            className={cn("flex-1 py-2 text-xs font-medium transition-colors",
              topTab === t ? "border-b-2 border-[var(--accent)]" : "text-[var(--text-muted)] hover:text-[var(--text)]")}
            style={{ color: topTab === t ? "var(--accent)" : undefined }}>
            {t === "details" ? "Details" : "Appears In"}
          </button>
        ))}
      </div>

      {topTab === "details" && (
        <>
          {/* Details sub-tabs */}
          <div className="flex border-b shrink-0 overflow-x-auto" style={{ borderColor: "var(--border)" }}>
            {([["notes", "Piece Notes"], ["relations", "Relations"], ["altnames", "Alt Names"]] as [DetailsTab, string][]).map(([id, label]) => (
              <button key={id} onClick={() => setDetailsTab(id)}
                className={cn("shrink-0 px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                  detailsTab === id ? "border-b-2 border-[var(--accent)]" : "text-[var(--text-muted)] hover:text-[var(--text)]")}
                style={{ color: detailsTab === id ? "var(--accent)" : undefined }}>
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {detailsTab === "notes" && <PieceNotesTab piece={piece} />}
            {detailsTab === "relations" && (
              <RelationsTab
                piece={piece}
                showPicker={showRelationPicker}
                setShowPicker={setShowRelationPicker}
                search={relationSearch}
                setSearch={setRelationSearch}
              />
            )}
            {detailsTab === "altnames" && <AltNamesTab piece={piece} />}
          </div>
        </>
      )}

      {topTab === "appears" && <AppearsInTab piece={piece} onDocClick={(id) => setSelectedNode(id)} />}
    </aside>
  );
}

// ── Piece Notes ──────────────────────────────────────────────────────────────

function PieceNotesTab({ piece }: { piece: Piece }) {
  const { addPieceNote, updatePieceNote, deletePieceNote, save } = useProjectStore();

  const handleAddNote = async () => {
    addPieceNote(piece.id, { id: generateId(), title: "New Note", body: "" });
    await save();
  };

  return (
    <div className="flex flex-col gap-3">
      {piece.pieceNotes.map((note, idx) => (
        <NoteCard
          key={note.id}
          note={note}
          isDescription={idx === 0}
          onChange={async (updates) => { updatePieceNote(piece.id, note.id, updates); await save(); }}
          onDelete={async () => { deletePieceNote(piece.id, note.id); await save(); }}
        />
      ))}
      <button
        onClick={handleAddNote}
        className="flex items-center gap-1.5 text-xs self-start mt-1 hover:text-[var(--accent)] transition-colors"
        style={{ color: "var(--text-faint)" }}
      >
        <Plus size={12} /> Add Note
      </button>
    </div>
  );
}

function NoteCard({
  note, isDescription, onChange, onDelete,
}: {
  note: PieceNote;
  isDescription: boolean;
  onChange: (u: Partial<PieceNote>) => void;
  onDelete: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [renamingTitle, setRenamingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const debouncedBody = useDebounce(body, 600);

  useEffect(() => {
    if (debouncedBody !== note.body) onChange({ body: debouncedBody });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedBody]);

  const commitTitle = () => {
    setRenamingTitle(false);
    if (titleDraft.trim() && titleDraft !== note.title) onChange({ title: titleDraft.trim() });
  };

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-elevated)" }}>
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: "var(--border)" }}>
        {renamingTitle ? (
          <input autoFocus value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle} onKeyDown={(e) => { if (e.key === "Enter") commitTitle(); if (e.key === "Escape") setRenamingTitle(false); }}
            className="flex-1 bg-transparent text-xs font-medium outline-none" style={{ color: "var(--text)" }} />
        ) : (
          <span className="flex-1 text-xs font-medium" style={{ color: "var(--text)" }}>{note.title}</span>
        )}
        {!isDescription && (
          <div className="relative">
            <button onClick={() => setShowMenu((v) => !v)} className="p-0.5 rounded hover:bg-[var(--bg-panel)]" style={{ color: "var(--text-faint)" }}>
              <MoreHorizontal size={12} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 rounded-lg py-1 z-20 w-32"
                style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
                <button onClick={() => { setRenamingTitle(true); setShowMenu(false); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-[var(--bg-panel)]" style={{ color: "var(--text)" }}>
                  <Pencil size={10} /> Rename
                </button>
                <button onClick={() => { onDelete(); setShowMenu(false); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-[var(--bg-panel)]" style={{ color: "var(--text)" }}>
                  <Trash2 size={10} /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={isDescription ? "Describe this piece…" : "Write a note…"}
        className="w-full resize-none bg-transparent text-xs outline-none p-3"
        style={{ color: "var(--text)", minHeight: 72 }}
        rows={3}
      />
    </div>
  );
}

// ── Relations ────────────────────────────────────────────────────────────────

function RelationsTab({ piece, showPicker, setShowPicker, search, setSearch }: {
  piece: Piece;
  showPicker: boolean;
  setShowPicker: (v: boolean) => void;
  search: string;
  setSearch: (v: string) => void;
}) {
  const { project, addPieceRelation, removePieceRelation, save } = useProjectStore();
  const pieces = project?.pieces ?? [];
  const typeMap = new Map(getPieceTypes(project!).map((t) => [t.id, t]));
  const pieceMap = new Map(pieces.map((p) => [p.id, p]));
  const relationSet = new Set(piece.relations);
  const related = piece.relations.map((id) => pieceMap.get(id)).filter(Boolean) as typeof pieces;
  const candidates = pieces.filter((p) => p.id !== piece.id && !relationSet.has(p.id) &&
    p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col gap-2">
      {related.map((rel) => {
        const t = typeMap.get(rel.pieceType);
        const Icon = getPieceIcon(t?.icon ?? "Circle");
        return (
          <div key={rel.id} className="flex items-center gap-2 group">
            <Icon size={14} style={{ color: "var(--accent)" }} />
            <span className="flex-1 text-xs truncate" style={{ color: "var(--text)" }}>{rel.name}</span>
            <button onClick={async () => { removePieceRelation(piece.id, rel.id); await save(); }}
              className="opacity-0 group-hover:opacity-100 p-0.5" style={{ color: "var(--text-faint)" }}>
              <X size={11} />
            </button>
          </div>
        );
      })}

      {showPicker ? (
        <div className="flex flex-col gap-1 mt-1 rounded-lg p-2"
          style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
          <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pieces…" className="text-xs bg-transparent outline-none border-b pb-1 mb-1"
            style={{ borderColor: "var(--border)", color: "var(--text)" }} />
          {candidates.slice(0, 8).map((c) => {
            const t = typeMap.get(c.pieceType);
            const Icon = getPieceIcon(t?.icon ?? "Circle");
            return (
              <button key={c.id} onClick={async () => { addPieceRelation(piece.id, c.id); await save(); setShowPicker(false); setSearch(""); }}
                className="flex items-center gap-2 text-xs px-2 py-1 rounded hover:bg-[var(--bg-panel)] text-left" style={{ color: "var(--text)" }}>
                <Icon size={12} style={{ color: "var(--accent)" }} />
                {c.name}
              </button>
            );
          })}
          {candidates.length === 0 && <p className="text-xs px-2" style={{ color: "var(--text-faint)" }}>No matches.</p>}
          <button onClick={() => { setShowPicker(false); setSearch(""); }}
            className="self-end text-xs mt-1" style={{ color: "var(--text-faint)" }}>Cancel</button>
        </div>
      ) : (
        <button onClick={() => setShowPicker(true)}
          className="flex items-center gap-1.5 text-xs self-start mt-1 hover:text-[var(--accent)] transition-colors"
          style={{ color: "var(--text-faint)" }}>
          <Link2 size={12} /> Add relation
        </button>
      )}
    </div>
  );
}

// ── Alt Names ────────────────────────────────────────────────────────────────

function AltNamesTab({ piece }: { piece: Piece }) {
  const { updatePiece, save } = useProjectStore();
  const [input, setInput] = useState("");

  const handleAdd = async () => {
    if (!input.trim() || piece.alternativeNames.includes(input.trim())) return;
    updatePiece(piece.id, { alternativeNames: [...piece.alternativeNames, input.trim()] });
    await save();
    setInput("");
  };

  const handleRemove = async (name: string) => {
    updatePiece(piece.id, { alternativeNames: piece.alternativeNames.filter((n) => n !== name) });
    await save();
  };

  return (
    <div className="flex flex-col gap-2">
      {piece.alternativeNames.map((name) => (
        <div key={name} className="flex items-center gap-2 group">
          <span className="flex-1 text-xs" style={{ color: "var(--text)" }}>{name}</span>
          <button onClick={() => handleRemove(name)}
            className="opacity-0 group-hover:opacity-100 p-0.5" style={{ color: "var(--text-faint)" }}>
            <X size={11} />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2 mt-1">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          placeholder="Also known as…"
          className="flex-1 text-xs bg-transparent outline-none border-b pb-1"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
        />
        <button onClick={handleAdd} style={{ color: "var(--accent)" }}>
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}

// ── Appears In ───────────────────────────────────────────────────────────────

function AppearsInTab({ piece, onDocClick }: { piece: Piece; onDocClick: (id: string) => void }) {
  const { project } = useProjectStore();
  if (!project) return null;

  const TAG_CATEGORY: Record<string, string> = { character: "char", place: "location", object: "object" };
  const category = TAG_CATEGORY[piece.pieceType];
  const allNamesSet = new Set([piece.name, ...piece.alternativeNames].map((n) => n.toLowerCase()));

  const matchingNodes = Object.entries(project.metadata).flatMap(([id, meta]) => {
    const tagMatch = category && meta.tags &&
      ((meta.tags as Record<string, string[]>)[category] ?? []).some((v) => allNamesSet.has(v.toLowerCase()));
    const synopsisMatch = meta.synopsis &&
      [...allNamesSet].some((n) => meta.synopsis!.toLowerCase().includes(n));
    if (!tagMatch && !synopsisMatch) return [];
    const node = findNode(project.binder, id);
    return node ? [node] : [];
  });

  return (
    <div className="flex-1 overflow-y-auto p-3">
      {matchingNodes.length === 0 ? (
        <p className="text-xs" style={{ color: "var(--text-faint)" }}>
          No scenes found. Tag scenes with @{category ?? "char"}: {piece.name} in the Tags panel to see them here.
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          <p className="text-xs mb-2" style={{ color: "var(--text-faint)" }}>
            {matchingNodes.length} {matchingNodes.length === 1 ? "scene" : "scenes"}
          </p>
          {matchingNodes.map((node) => (
            <button
              key={node!.id}
              onClick={() => onDocClick(node!.id)}
              className="flex items-center gap-2 text-xs px-2 py-1.5 rounded text-left hover:bg-[var(--bg-panel)] transition-colors w-full"
              style={{ color: "var(--text)" }}
            >
              <span className="truncate">{node!.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
