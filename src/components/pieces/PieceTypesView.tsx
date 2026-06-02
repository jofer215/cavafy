"use client";

import { useState } from "react";
import { useProjectStore } from "@/store/project";
import { getPieceTypes, PieceType } from "@/lib/project/schema";
import { generateId } from "@/lib/utils";
import { getPieceIcon, PIECE_ICON_OPTIONS } from "./pieceIcons";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";

export function PieceTypesView() {
  const { project, addPieceType, updatePieceType, deletePieceType, save } = useProjectStore();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ label: "", icon: "Circle" });

  if (!project) return null;

  const [builtIn, custom] = getPieceTypes(project).reduce<[PieceType[], PieceType[]]>(
    ([b, c], t) => t.builtIn ? [[...b, t], c] : [b, [...c, t]],
    [[], []]
  );

  const handleAdd = async () => {
    if (!draft.label.trim()) return;
    addPieceType({
      id: generateId(),
      label: draft.label.trim(),
      icon: draft.icon,
      builtIn: false,
    });
    await save();
    setAdding(false);
    setDraft({ label: "", icon: "Circle" });
  };

  const handleUpdate = async (type: PieceType) => {
    updatePieceType(type.id, { label: draft.label.trim() || type.label, icon: draft.icon });
    await save();
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    deletePieceType(id);
    await save();
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
      {/* Built-in types */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-faint)" }}>
          Built-in Types
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {builtIn.map((t) => {
            const Icon = getPieceIcon(t.icon);
            return (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3 rounded-lg"
                style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                <Icon size={18} style={{ color: "var(--accent)" }} />
                <span className="text-sm" style={{ color: "var(--text)" }}>{t.label}</span>
                <span className="ml-auto text-xs" style={{ color: "var(--text-faint)" }}>Built-in</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Custom types */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
            Custom Types
          </h3>
          <button
            onClick={() => { setAdding(true); setDraft({ label: "", icon: "Circle" }); }}
            className="flex items-center gap-1 text-xs hover:text-[var(--accent)] transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <Plus size={12} /> Add
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {adding && (
            <TypeEditRow
              draft={draft}
              setDraft={setDraft}
              onSave={handleAdd}
              onCancel={() => setAdding(false)}
            />
          )}

          {custom.map((t) => {
            const Icon = getPieceIcon(t.icon);
            return editingId === t.id ? (
              <TypeEditRow
                key={t.id}
                draft={draft}
                setDraft={setDraft}
                onSave={() => handleUpdate(t)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div key={t.id} className="group flex items-center gap-3 px-4 py-3 rounded-lg"
                style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                <Icon size={18} style={{ color: "var(--accent)" }} />
                <span className="flex-1 text-sm" style={{ color: "var(--text)" }}>{t.label}</span>
                <button
                  onClick={() => { setEditingId(t.id); setDraft({ label: t.label, icon: t.icon }); }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity"
                  style={{ color: "var(--text-faint)" }}>
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity"
                  style={{ color: "var(--text-faint)" }}>
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}

          {custom.length === 0 && !adding && (
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>
              No custom types yet. Add one above.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function TypeEditRow({
  draft,
  setDraft,
  onSave,
  onCancel,
}: {
  draft: { label: string; icon: string };
  setDraft: (d: { label: string; icon: string }) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const CurrentIcon = getPieceIcon(draft.icon);
  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg"
      style={{ backgroundColor: "var(--bg-panel)", border: "1px solid var(--accent)" }}>
      <input
        autoFocus
        value={draft.label}
        onChange={(e) => setDraft({ ...draft, label: e.target.value })}
        onKeyDown={(e) => { if (e.key === "Enter") onSave(); if (e.key === "Escape") onCancel(); }}
        placeholder="Type name…"
        className="bg-transparent text-sm outline-none border-b pb-1"
        style={{ borderColor: "var(--border)", color: "var(--text)" }}
      />
      <div className="flex flex-wrap gap-1.5">
        {PIECE_ICON_OPTIONS.map(({ name, icon: Icon }) => (
          <button
            key={name}
            onClick={() => setDraft({ ...draft, icon: name })}
            className="p-1.5 rounded transition-colors"
            style={{
              backgroundColor: draft.icon === name ? "var(--accent)" : "var(--bg-elevated)",
              color: draft.icon === name ? "var(--accent-fg)" : "var(--text-muted)",
            }}
          >
            <Icon size={14} />
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 justify-end">
        <button onClick={onCancel} className="p-1 rounded" style={{ color: "var(--text-faint)" }}><X size={14} /></button>
        <button onClick={onSave} className="flex items-center gap-1 px-2 py-1 rounded text-xs"
          style={{ backgroundColor: "var(--accent)", color: "var(--accent-fg)" }}>
          <Check size={12} /> Save
        </button>
      </div>
    </div>
  );
}
