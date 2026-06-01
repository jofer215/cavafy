"use client";

import { useState } from "react";
import { useProjectStore } from "@/store/project";
import { findNode } from "@/lib/project/schema";
import { UnionView } from "@/components/editor/UnionView";
import { Plus, Layers, Trash2, ChevronLeft, Pencil, X } from "lucide-react";

interface CollectionsViewProps {
  projectId: string;
}

export function CollectionsView({ projectId }: CollectionsViewProps) {
  const { project, addCollection, deleteCollection, renameCollection, save } = useProjectStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [creatingNew, setCreatingNew] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  if (!project) return null;

  const collections = project.collections ?? [];
  const openCollection = openId ? collections.find((c) => c.id === openId) : null;

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    addCollection(name);
    await save();
    setNewName("");
    setCreatingNew(false);
  };

  const handleDelete = async (id: string) => {
    if (openId === id) setOpenId(null);
    deleteCollection(id);
    await save();
  };

  const handleRename = async (id: string) => {
    if (renameDraft.trim()) {
      renameCollection(id, renameDraft);
      await save();
    }
    setRenamingId(null);
  };

  // Open collection → Union view
  if (openCollection) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
        <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-sidebar)" }}>
          <button
            onClick={() => setOpenId(null)}
            className="flex items-center gap-1 text-xs hover:text-[var(--accent)] transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <ChevronLeft size={14} /> Collections
          </button>
        </div>
        <UnionView
          projectId={projectId}
          nodeIds={openCollection.nodeIds}
          title={openCollection.name}
        />
      </div>
    );
  }

  // Collections list
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-sidebar)" }}>
        <div className="flex items-center gap-2">
          <Layers size={14} style={{ color: "var(--accent)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--text)" }}>Collections</span>
        </div>
        <button
          onClick={() => setCreatingNew(true)}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-[var(--bg-panel)] transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <Plus size={12} /> New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {/* New collection input */}
        {creatingNew && (
          <div className="flex items-center gap-2 p-3 rounded-lg"
            style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--accent)" }}>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") { setCreatingNew(false); setNewName(""); }
              }}
              placeholder="Collection name…"
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "var(--text)" }}
            />
            <button onClick={handleCreate}
              className="px-2 py-1 rounded text-xs font-medium"
              style={{ backgroundColor: "var(--accent)", color: "var(--accent-fg)" }}>
              Create
            </button>
            <button onClick={() => { setCreatingNew(false); setNewName(""); }}>
              <X size={14} style={{ color: "var(--text-faint)" }} />
            </button>
          </div>
        )}

        {/* Collection cards */}
        {collections.map((c) => {
          const docs = c.nodeIds
            .map((id) => findNode(project.binder, id))
            .filter((n) => n !== null);

          return (
            <div key={c.id} className="group flex flex-col gap-2 p-4 rounded-xl"
              style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
              {/* Title row */}
              <div className="flex items-center gap-2">
                {renamingId === c.id ? (
                  <input
                    autoFocus
                    value={renameDraft}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    onBlur={() => handleRename(c.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(c.id);
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    className="flex-1 bg-transparent text-sm font-medium outline-none border-b"
                    style={{ borderColor: "var(--accent)", color: "var(--text)" }}
                  />
                ) : (
                  <span className="flex-1 text-sm font-medium" style={{ color: "var(--text)" }}>
                    {c.name}
                  </span>
                )}
                <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                  {docs.length} {docs.length === 1 ? "doc" : "docs"}
                </span>
                <button
                  onClick={() => { setRenamingId(c.id); setRenameDraft(c.name); }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity hover:bg-[var(--bg-panel)]"
                  style={{ color: "var(--text-faint)" }} title="Rename">
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity hover:bg-[var(--bg-panel)]"
                  style={{ color: "var(--text-faint)" }} title="Delete">
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Doc list preview */}
              {docs.length > 0 && (
                <ul className="flex flex-col gap-0.5">
                  {docs.slice(0, 5).map((doc) => (
                    <li key={doc!.id} className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                      · {doc!.title}
                    </li>
                  ))}
                  {docs.length > 5 && (
                    <li className="text-xs" style={{ color: "var(--text-faint)" }}>
                      + {docs.length - 5} more
                    </li>
                  )}
                </ul>
              )}
              {docs.length === 0 && (
                <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                  No documents yet — right-click a document in the binder to add it.
                </p>
              )}

              {/* Open button */}
              <button
                onClick={() => setOpenId(c.id)}
                disabled={docs.length === 0}
                className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
                style={{ backgroundColor: "var(--bg-panel)", color: "var(--accent)", border: "1px solid var(--border)" }}
              >
                <Layers size={11} /> Open in Union
              </button>
            </div>
          );
        })}

        {collections.length === 0 && !creatingNew && (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 py-16">
            <Layers size={36} strokeWidth={1} style={{ color: "var(--text-faint)" }} />
            <p className="text-sm" style={{ color: "var(--text-faint)" }}>No collections yet.</p>
            <p className="text-xs text-center max-w-xs" style={{ color: "var(--text-faint)" }}>
              Create a collection to save a named group of scenes — "All John POV scenes", "Act 2 only" — and open them together as one continuous read.
            </p>
            <button
              onClick={() => setCreatingNew(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium mt-2"
              style={{ backgroundColor: "var(--accent)", color: "var(--accent-fg)" }}
            >
              <Plus size={12} /> Create first collection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
