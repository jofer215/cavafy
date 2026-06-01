"use client";

import { useState } from "react";
import { useProjectStore } from "@/store/project";
import { findNode } from "@/lib/project/schema";
import { Camera, RotateCcw, Trash2 } from "lucide-react";

interface SnapshotsPanelProps {
  nodeId: string;
}

export function SnapshotsPanel({ nodeId }: SnapshotsPanelProps) {
  const { project, addSnapshot, deleteSnapshot, save } = useProjectStore();
  const [nameInput, setNameInput] = useState("");
  const [taking, setTaking] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  if (!project) return null;

  const node = findNode(project.binder, nodeId);
  const snapshots = project.snapshots?.[nodeId] ?? [];

  const handleTake = async () => {
    const name = nameInput.trim() || new Date().toLocaleString();
    setTaking(true);
    try {
      // Ask the editor panel to give us current content via a custom event
      const html = await getCurrentEditorHTML();
      const res = await fetch(`/api/projects/${project.id}/documents/${node?.driveId}/snapshots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, content: html, nodeId }),
      });
      if (!res.ok) throw new Error("Snapshot failed");
      const { snapshot } = await res.json();
      addSnapshot(nodeId, snapshot);
      setNameInput("");
    } catch (e) {
      console.error("Failed to take snapshot:", e);
    } finally {
      setTaking(false);
    }
  };

  const handleRestore = async (snapshotDriveId: string) => {
    setRestoring(snapshotDriveId);
    try {
      const res = await fetch(
        `/api/projects/${project.id}/documents/${node?.driveId}/snapshots/${snapshotDriveId}`
      );
      const { content } = await res.json();
      window.dispatchEvent(new CustomEvent("cavafy:restore-content", { detail: content }));
    } catch (e) {
      console.error("Failed to restore snapshot:", e);
    } finally {
      setRestoring(null);
    }
  };

  const handleDelete = async (snapshotId: string) => {
    deleteSnapshot(nodeId, snapshotId);
    await save();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Take snapshot */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium" style={{ color: "var(--text-faint)" }}>
          New Snapshot
        </label>
        <input
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleTake()}
          placeholder="Name (optional)"
          className="w-full px-2 py-1.5 rounded text-xs bg-transparent border outline-none"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
        />
        <button
          onClick={handleTake}
          disabled={taking || !node?.driveId}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50"
          style={{ backgroundColor: "var(--accent)", color: "var(--accent-fg)" }}
        >
          <Camera size={12} />
          {taking ? "Saving…" : "Take Snapshot"}
        </button>
      </div>

      {/* Snapshot list */}
      {snapshots.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: "var(--text-faint)" }}>
            Saved Snapshots
          </label>
          {[...snapshots].reverse().map((sn) => (
            <div
              key={sn.id}
              className="flex items-center gap-2 rounded px-2 py-2 group"
              style={{ backgroundColor: "var(--bg-panel)" }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: "var(--text)" }}>
                  {sn.name}
                </p>
                <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                  {new Date(sn.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => handleRestore(sn.driveId)}
                disabled={restoring === sn.driveId}
                className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--bg-elevated)]"
                style={{ color: "var(--accent)" }}
                title="Restore"
              >
                <RotateCcw size={12} />
              </button>
              <button
                onClick={() => handleDelete(sn.id)}
                className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--bg-elevated)]"
                style={{ color: "var(--text-faint)" }}
                title="Delete snapshot"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {snapshots.length === 0 && (
        <p className="text-xs" style={{ color: "var(--text-faint)" }}>
          No snapshots yet. Take one before a big edit.
        </p>
      )}
    </div>
  );
}

// Reads current HTML from the active TipTap editor via a custom DOM event
function getCurrentEditorHTML(): Promise<string> {
  return new Promise((resolve) => {
    const handler = (e: Event) => {
      resolve((e as CustomEvent<string>).detail);
      window.removeEventListener("cavafy:editor-html-response", handler);
    };
    window.addEventListener("cavafy:editor-html-response", handler);
    window.dispatchEvent(new CustomEvent("cavafy:editor-html-request"));
    // Fallback if editor doesn't respond
    setTimeout(() => {
      window.removeEventListener("cavafy:editor-html-response", handler);
      resolve("");
    }, 2000);
  });
}
