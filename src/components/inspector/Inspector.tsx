// Cavafy — free novel writing software
// Copyright (C) 2024  Joshua Ferris
// SPDX-License-Identifier: GPL-3.0-or-later
"use client";

import { useProjectStore } from "@/store/project";
import { cn } from "@/lib/utils";
import { DocumentMetadata, findNode } from "@/lib/project/schema";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { TagsPanel } from "./TagsPanel";
import { ReferencesPanel } from "./ReferencesPanel";
import { SnapshotsPanel } from "./SnapshotsPanel";
import { PieceInspector } from "./PieceInspector";

const TABS = [
  { id: "meta",       label: "Info"       },
  { id: "tags",       label: "Tags"       },
  { id: "synopsis",   label: "Synopsis"   },
  { id: "notes",      label: "Notes"      },
  { id: "references", label: "References" },
  { id: "snapshots",  label: "Snapshots"  },
] as const;

type Tab = (typeof TABS)[number]["id"];

export function Inspector() {
  const { project, selectedNodeId, selectedPieceId, updateMetadata, save } = useProjectStore();
  const [tab, setTab] = useState<Tab>("meta");
  const [synopsis, setSynopsis] = useState("");
  const [notes, setNotes] = useState("");
  const debouncedSynopsis = useDebounce(synopsis, 800);
  const debouncedNotes = useDebounce(notes, 800);

  const meta = selectedNodeId ? (project?.metadata[selectedNodeId] ?? {}) : null;
  const nodeTitle = selectedNodeId && project
    ? (findNode(project.binder, selectedNodeId)?.title ?? null)
    : null;
  const isDocument = selectedNodeId && project
    ? findNode(project.binder, selectedNodeId)?.type === "document"
    : false;

  useEffect(() => {
    setSynopsis(meta?.synopsis ?? "");
    setNotes(meta?.notes ?? "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNodeId]);

  useEffect(() => {
    if (!selectedNodeId || debouncedSynopsis === (meta?.synopsis ?? "")) return;
    updateMetadata(selectedNodeId, { synopsis: debouncedSynopsis });
    save();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSynopsis]);

  useEffect(() => {
    if (!selectedNodeId || debouncedNotes === (meta?.notes ?? "")) return;
    updateMetadata(selectedNodeId, { notes: debouncedNotes });
    save();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedNotes]);

  if (!project) return null;

  // Piece selected → render piece inspector instead of document inspector
  if (selectedPieceId) {
    const piece = (project.pieces ?? []).find((p) => p.id === selectedPieceId);
    if (piece) return <PieceInspector piece={piece} />;
  }

  return (
    <aside
      className="flex flex-col h-full border-l shrink-0"
      style={{
        width: 248,
        backgroundColor: "var(--bg-sidebar)",
        borderColor: "var(--border)",
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
        <p className="text-xs font-semibold truncate" style={{ color: "var(--text-faint)" }}>
          {nodeTitle ?? "No selection"}
        </p>
      </div>

      {/* Tabs — scrollable row */}
      <div
        className="flex border-b shrink-0 overflow-x-auto"
        style={{ borderColor: "var(--border)" }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap",
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {tab === "meta" && selectedNodeId && meta !== null && (
          <MetaTab nodeId={selectedNodeId} meta={meta} />
        )}

        {tab === "tags" && selectedNodeId && isDocument && (
          <>
            <p className="text-xs mb-4" style={{ color: "var(--text-faint)" }}>
              Tag what&apos;s in this scene — characters, locations, plot threads, and more.
            </p>
            <TagsPanel nodeId={selectedNodeId} />
          </>
        )}
        {tab === "tags" && (!selectedNodeId || !isDocument) && (
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>
            Select a document to add scene tags.
          </p>
        )}

        {tab === "synopsis" && (
          <textarea
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            placeholder="Write a brief synopsis of this scene…"
            className="w-full resize-none bg-transparent text-sm outline-none"
            style={{ color: "var(--text)", minHeight: 200 }}
            disabled={!selectedNodeId}
          />
        )}

        {tab === "notes" && (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Private notes, reminders, research links…"
            className="w-full resize-none bg-transparent text-sm outline-none"
            style={{ color: "var(--text)", minHeight: 200 }}
            disabled={!selectedNodeId}
          />
        )}

        {tab === "references" && <ReferencesPanel />}

        {tab === "snapshots" && selectedNodeId && isDocument && (
          <SnapshotsPanel nodeId={selectedNodeId} />
        )}
        {tab === "snapshots" && (!selectedNodeId || !isDocument) && (
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>
            Select a document to manage snapshots.
          </p>
        )}
      </div>
    </aside>
  );
}

function MetaTab({ nodeId, meta }: { nodeId: string; meta: DocumentMetadata }) {
  const { project, updateMetadata, save } = useProjectStore();
  if (!project) return null;

  const wc = (meta.customFields?._wordCount as number) ?? 0;

  return (
    <div className="flex flex-col gap-5">
      {wc > 0 && (
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-faint)" }}>
            Words
          </label>
          <p className="text-sm tabular-nums" style={{ color: "var(--text)" }}>
            {wc.toLocaleString()}
          </p>
        </div>
      )}

      <div>
        <label className="text-xs font-medium mb-0.5 block" style={{ color: "var(--text-faint)" }}>
          Status
        </label>
        <p className="text-xs mb-2" style={{ color: "var(--text-faint)", opacity: 0.6 }}>
          Your workflow stage
        </p>
        <div className="flex flex-wrap gap-1.5">
          {project.statuses.map((s) => (
            <button
              key={s.id}
              onClick={() => { updateMetadata(nodeId, { status: s.id }); save(); }}
              className="px-2 py-1 rounded text-xs transition-all"
              style={{
                backgroundColor: s.color + "22",
                color: s.color,
                outline: meta.status === s.id ? `2px solid ${s.color}` : "none",
                outlineOffset: 1,
              }}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium mb-0.5 block" style={{ color: "var(--text-faint)" }}>
          Type
        </label>
        <p className="text-xs mb-2" style={{ color: "var(--text-faint)", opacity: 0.6 }}>
          What kind of document this is
        </p>
        <div className="flex flex-wrap gap-1.5">
          {project.labels.map((l) => (
            <button
              key={l.id}
              onClick={() => { updateMetadata(nodeId, { label: l.id }); save(); }}
              className="px-2 py-1 rounded text-xs transition-all"
              style={{
                backgroundColor: l.color + "22",
                color: l.color,
                outline: meta.label === l.id ? `2px solid ${l.color}` : "none",
                outlineOffset: 1,
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
