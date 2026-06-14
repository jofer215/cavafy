// Cavafy — free novel writing software
// Copyright (C) 2024  Joshua Ferris
// SPDX-License-Identifier: GPL-3.0-or-later
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Typography from "@tiptap/extension-typography";
import Highlight from "@tiptap/extension-highlight";
import { BinderNode, collectDocuments, findNode } from "@/lib/project/schema";
import { useProjectStore } from "@/store/project";
import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { Layers } from "lucide-react";
import { docCache, pendingQueue } from "@/lib/cache/db";

// One TipTap segment for a single document inside Union view
function DocumentSegment({
  node,
  projectId,
  isLast,
  onWordCount,
}: {
  node: BinderNode;
  projectId: string;
  isLast: boolean;
  onWordCount: (id: string, wc: number) => void;
}) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef("");

  const save = useCallback(
    async (html: string) => {
      if (!node.driveId || html === lastSaved.current) return;
      lastSaved.current = html;
      docCache.set({ driveId: node.driveId, projectId, content: html, savedAt: new Date().toISOString() });
      const url = `/api/projects/${projectId}/documents/${node.driveId}`;
      try {
        await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: html }) });
      } catch {
        pendingQueue.push({ url, method: "PUT", body: JSON.stringify({ content: html }), createdAt: new Date().toISOString() });
        window.dispatchEvent(new CustomEvent("cavafy:pending-writes-changed"));
      }
    },
    [node.driveId, projectId]
  );
  const saveRef = useRef(save);
  useMemo(() => { saveRef.current = save; }, [save]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Begin writing…" }),
      CharacterCount,
      Typography,
      Highlight.configure({ multicolor: false }),
    ],
    editorProps: { attributes: { class: "focus:outline-none" } },
    onUpdate({ editor }) {
      onWordCount(node.id, editor.storage.characterCount.words());
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => save(editor.getHTML()), 1500);
    },
  });

  useEffect(() => {
    if (!editor || !node.driveId) return;
    let cancelled = false;

    const applyContent = (content: string) => {
      if (cancelled || !content) return;
      editor.commands.setContent(content);
      lastSaved.current = content;
      onWordCount(node.id, editor.storage.characterCount.words());
    };

    fetch(`/api/projects/${projectId}/documents/${node.driveId}`)
      .then((r) => r.json())
      .then(({ content }) => {
        applyContent(content);
        if (content) docCache.set({ driveId: node.driveId!, projectId, content, savedAt: new Date().toISOString() });
      })
      .catch(async () => {
        const cached = await docCache.get(node.driveId!);
        if (cached) applyContent(cached.content);
      });

    return () => { cancelled = true; };
  }, [node.driveId, projectId, editor]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (editor) saveRef.current(editor.getHTML());
    };
  }, [editor]);

  return (
    <div className="union-segment">
      {/* Scene title divider */}
      <div
        className="flex items-center gap-3 px-16 py-4 select-none"
        style={{ maxWidth: 720, margin: "0 auto" }}
      >
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-faint)" }}
        >
          {node.title}
        </span>
        <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-soft)" }} />
      </div>

      {/* Editor */}
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <EditorContent editor={editor} />
      </div>

      {/* Inter-segment gap (not after last) */}
      {!isLast && (
        <div
          className="mx-auto my-6"
          style={{
            maxWidth: 720,
            height: 1,
            backgroundColor: "var(--border-soft)",
          }}
        />
      )}
    </div>
  );
}

// ── Main Union view ────────────────────────────────────────────────────────
interface UnionViewProps {
  projectId: string;
  folderId?: string;    // collect all active docs from this folder
  nodeIds?: string[];   // or use an explicit list of doc node IDs
  title?: string;       // header label when using nodeIds
}

export function UnionView({ folderId, nodeIds, title, projectId }: UnionViewProps) {
  const { project } = useProjectStore();
  const [wordCounts, setWordCounts] = useState<Record<string, number>>({});

  if (!project) return null;

  const folder = folderId ? findNode(project.binder, folderId) : null;
  const docs = nodeIds
    ? nodeIds.map((id) => findNode(project.binder, id)).filter((n): n is BinderNode => n !== null && n.type === "document")
    : folder ? collectDocuments(folder.children ?? []) : [];

  const handleWordCount = (id: string, wc: number) =>
    setWordCounts((prev) => ({ ...prev, [id]: wc }));

  const totalWords = Object.values(wordCounts).reduce((a, b) => a + b, 0);

  if (docs.length === 0) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center gap-2"
        style={{ backgroundColor: "var(--bg)" }}
      >
        <Layers size={36} strokeWidth={1} style={{ color: "var(--text-faint)" }} />
        <p className="text-sm" style={{ color: "var(--text-faint)" }}>
          No documents in <strong>{title ?? folder?.title}</strong> yet.
        </p>
        <p className="text-xs" style={{ color: "var(--text-faint)" }}>
          Add documents to this folder in the binder.
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: "var(--bg)" }}
    >
      {/* Union header */}
      <div
        className="shrink-0 flex items-center justify-between px-8 py-2 border-b"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-sidebar)" }}
      >
        <div className="flex items-center gap-2">
          <Layers size={14} style={{ color: "var(--accent)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
            {title ?? folder?.title}
          </span>
          <span className="text-xs" style={{ color: "var(--text-faint)" }}>
            — {docs.length} {docs.length === 1 ? "scene" : "scenes"}
          </span>
        </div>
        {totalWords > 0 && (
          <span className="text-xs tabular-nums" style={{ color: "var(--text-faint)" }}>
            {totalWords.toLocaleString()} words
          </span>
        )}
      </div>

      {/* Scrolling content */}
      <div className="flex-1 overflow-y-auto py-6">
        {docs.map((doc, i) => (
          <DocumentSegment
            key={doc.id}
            node={doc}
            projectId={projectId}
            isLast={i === docs.length - 1}
            onWordCount={handleWordCount}
          />
        ))}
        <div className="h-24" />
      </div>
    </div>
  );
}
