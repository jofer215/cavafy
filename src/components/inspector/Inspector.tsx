"use client";

import { useProjectStore } from "@/store/project";
import { cn } from "@/lib/utils";
import { DocumentMetadata } from "@/lib/project/schema";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";

function findNodeTitle(
  nodes: import("@/lib/project/schema").BinderNode[],
  id: string
): string | null {
  for (const n of nodes) {
    if (n.id === id) return n.title;
    if (n.children) {
      const t = findNodeTitle(n.children, id);
      if (t) return t;
    }
  }
  return null;
}

const TABS = [
  { id: "meta",      label: "Meta"     },
  { id: "synopsis",  label: "Synopsis" },
  { id: "notes",     label: "Notes"    },
] as const;

type Tab = (typeof TABS)[number]["id"];

export function Inspector() {
  const { project, selectedNodeId, inspectorTab, setInspectorTab, updateMetadata, save } =
    useProjectStore();

  const [tab, setTab] = useState<Tab>(inspectorTab as Tab ?? "meta");
  const [synopsis, setSynopsis] = useState("");
  const [notes, setNotes] = useState("");
  const debouncedSynopsis = useDebounce(synopsis, 800);
  const debouncedNotes = useDebounce(notes, 800);

  const meta = selectedNodeId ? (project?.metadata[selectedNodeId] ?? {}) : null;

  // Sync text areas when node changes
  useEffect(() => {
    setSynopsis(meta?.synopsis ?? "");
    setNotes(meta?.notes ?? "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNodeId]);

  // Debounced save for synopsis
  useEffect(() => {
    if (!selectedNodeId || debouncedSynopsis === (meta?.synopsis ?? "")) return;
    updateMetadata(selectedNodeId, { synopsis: debouncedSynopsis });
    save();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSynopsis]);

  // Debounced save for notes
  useEffect(() => {
    if (!selectedNodeId || debouncedNotes === (meta?.notes ?? "")) return;
    updateMetadata(selectedNodeId, { notes: debouncedNotes });
    save();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedNotes]);

  if (!project) return null;

  const nodeTitle = selectedNodeId ? findNodeTitle(project.binder, selectedNodeId) : null;

  return (
    <aside
      className="flex flex-col h-full border-l"
      style={{
        width: 240,
        backgroundColor: "var(--bg-sidebar)",
        borderColor: "var(--border)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 border-b shrink-0"
        style={{ borderColor: "var(--border)" }}
      >
        <p className="text-xs font-semibold truncate" style={{ color: "var(--text-faint)" }}>
          {nodeTitle ?? "No selection"}
        </p>
      </div>

      {/* Tabs */}
      <div
        className="flex border-b shrink-0"
        style={{ borderColor: "var(--border)" }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setInspectorTab(t.id); }}
            className={cn(
              "flex-1 py-2 text-xs font-medium transition-colors",
              tab === t.id
                ? "border-b-2 border-[var(--accent)]"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            )}
            style={{ color: tab === t.id ? "var(--accent)" : undefined }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {tab === "meta" && selectedNodeId && meta !== null && (
          <MetaTab nodeId={selectedNodeId} meta={meta} />
        )}
        {tab === "synopsis" && (
          <textarea
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            placeholder="Write a brief synopsis…"
            className="w-full h-full resize-none bg-transparent text-sm outline-none"
            style={{ color: "var(--text)", minHeight: 200 }}
            disabled={!selectedNodeId}
          />
        )}
        {tab === "notes" && (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Private notes, reminders, research links…"
            className="w-full h-full resize-none bg-transparent text-sm outline-none"
            style={{ color: "var(--text)", minHeight: 200 }}
            disabled={!selectedNodeId}
          />
        )}
      </div>
    </aside>
  );
}

function MetaTab({ nodeId, meta }: { nodeId: string; meta: DocumentMetadata }) {
  const { project, updateMetadata, save } = useProjectStore();
  if (!project) return null;

  const setStatus = (id: string) => {
    updateMetadata(nodeId, { status: id });
    save();
  };
  const setLabel = (id: string) => {
    updateMetadata(nodeId, { label: id });
    save();
  };

  const wc = (meta.customFields?._wordCount as number) ?? 0;

  return (
    <div className="flex flex-col gap-5">
      {wc > 0 && (
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-faint)" }}>
            Words
          </label>
          <p className="text-sm" style={{ color: "var(--text)" }}>
            {wc.toLocaleString()}
          </p>
        </div>
      )}

      <div>
        <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-faint)" }}>
          Status
        </label>
        <div className="flex flex-wrap gap-1.5">
          {project.statuses.map((s) => (
            <button
              key={s.id}
              onClick={() => setStatus(s.id)}
              className={cn(
                "px-2 py-1 rounded text-xs transition-all",
                meta.status === s.id ? "ring-2 ring-offset-1" : "opacity-60 hover:opacity-100"
              )}
              style={{
                backgroundColor: s.color + "22",
                color: s.color,
                outline: meta.status === s.id ? `2px solid ${s.color}` : "none",
              }}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-faint)" }}>
          Label
        </label>
        <div className="flex flex-wrap gap-1.5">
          {project.labels.map((l) => (
            <button
              key={l.id}
              onClick={() => setLabel(l.id)}
              className={cn(
                "px-2 py-1 rounded text-xs transition-all",
                meta.label === l.id ? "ring-2 ring-offset-1" : "opacity-60 hover:opacity-100"
              )}
              style={{
                backgroundColor: l.color + "22",
                color: l.color,
              }}
            >
              {l.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
