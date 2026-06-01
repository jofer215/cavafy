"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Typography from "@tiptap/extension-typography";
import Highlight from "@tiptap/extension-highlight";
import { useEffect, useCallback, useRef, useMemo } from "react";

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
      try {
        await fetch(`/api/projects/${projectId}/documents/${docId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: html }),
        });
      } catch (e) {
        console.error("Auto-save failed:", e);
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

  // Load content when docId changes
  useEffect(() => {
    if (!editor || !docId) return;
    let cancelled = false;
    fetch(`/api/projects/${projectId}/documents/${docId}`)
      .then((r) => r.json())
      .then(({ content }) => {
        if (!cancelled && content) {
          editor.commands.setContent(content);
          lastSavedContent.current = content;
          const wc = editor.storage.characterCount.words();
          onWordCountChange?.(wc);
        }
      })
      .catch((e) => console.error("Failed to load document:", e));
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
