"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Typography from "@tiptap/extension-typography";
import Highlight from "@tiptap/extension-highlight";
import { useEffect, useCallback, useRef, useMemo } from "react";
import { docCache, pendingQueue } from "@/lib/cache/db";

interface TipTapEditorProps {
  docId: string;
  projectId: string;
  title: string;
  onWordCountChange?: (wc: number) => void;
}

export function TipTapEditor({ docId, projectId, title, onWordCountChange }: TipTapEditorProps) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContent = useRef<string>("");

  const saveContent = useCallback(
    async (html: string) => {
      if (html === lastSavedContent.current) return;
      lastSavedContent.current = html;
      // Always update local cache immediately so offline reads are fresh
      docCache.set({ driveId: docId, projectId, content: html, savedAt: new Date().toISOString() });
      const url = `/api/projects/${projectId}/documents/${docId}`;
      try {
        await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: html }),
        });
      } catch {
        // Offline — queue for sync when back online
        pendingQueue.push({ url, method: "PUT", body: JSON.stringify({ content: html }), createdAt: new Date().toISOString() });
        window.dispatchEvent(new CustomEvent("cavafy:pending-writes-changed"));
      }
    },
    [docId, projectId]
  );
  // Keep a ref so the unmount cleanup always calls the latest version
  const saveContentRef = useRef(saveContent);
  useMemo(() => { saveContentRef.current = saveContent; }, [saveContent]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Begin writing…" }),
      CharacterCount,
      Typography,
      Highlight.configure({ multicolor: false }),
    ],
    editorProps: {
      attributes: { class: "focus:outline-none" },
    },
    onUpdate({ editor }) {
      const wc = editor.storage.characterCount.words();
      onWordCountChange?.(wc);

      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveContent(editor.getHTML());
      }, 1500);
    },
  });

  // Load content — try Drive first, fall back to IndexedDB cache
  useEffect(() => {
    if (!editor || !docId) return;
    let cancelled = false;

    const applyContent = (content: string) => {
      if (cancelled || !content) return;
      editor.commands.setContent(content);
      lastSavedContent.current = content;
      onWordCountChange?.(editor.storage.characterCount.words());
    };

    fetch(`/api/projects/${projectId}/documents/${docId}`)
      .then((r) => r.json())
      .then(({ content }) => {
        applyContent(content);
        // Freshen the cache on every successful load
        if (content) docCache.set({ driveId: docId, projectId, content, savedAt: new Date().toISOString() });
      })
      .catch(async () => {
        const cached = await docCache.get(docId);
        if (cached) applyContent(cached.content);
        else console.warn("Document not in cache and Drive unreachable:", docId);
      });

    return () => { cancelled = true; };
  }, [docId, projectId, editor]);

  // Respond to snapshot HTML requests from SnapshotsPanel
  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      window.dispatchEvent(
        new CustomEvent("cavafy:editor-html-response", { detail: editor.getHTML() })
      );
    };
    window.addEventListener("cavafy:editor-html-request", handler);
    return () => window.removeEventListener("cavafy:editor-html-request", handler);
  }, [editor]);

  // Listen for snapshot restore events dispatched by SnapshotsPanel
  useEffect(() => {
    if (!editor) return;
    const handler = (e: Event) => {
      const html = (e as CustomEvent<string>).detail;
      editor.commands.setContent(html);
      lastSavedContent.current = "";
      saveContentRef.current(html);
    };
    window.addEventListener("cavafy:restore-content", handler);
    return () => window.removeEventListener("cavafy:restore-content", handler);
  }, [editor]);

  // Flush pending save on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        if (editor) saveContentRef.current(editor.getHTML());
      }
    };
  }, [editor]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Title bar */}
      <div
        className="shrink-0 px-8 pt-8 pb-2"
        style={{ maxWidth: 720, margin: "0 auto", width: "100%" }}
      >
        <h1
          className="text-2xl font-semibold"
          style={{ color: "var(--text)", fontFamily: "var(--font-prose)" }}
        >
          {title}
        </h1>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
