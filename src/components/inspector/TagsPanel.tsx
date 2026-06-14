"use client";

import { useProjectStore } from "@/store/project";
import { DocumentTags, TagCategory, TAG_DEFINITIONS } from "@/lib/project/schema";
import { X, Plus } from "lucide-react";
import { useState, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

function TagChip({ value, color, onRemove }: { value: string; color: string; onRemove: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: color + "22", color }}
    >
      {value}
      <button onClick={onRemove} className="hover:opacity-70 transition-opacity leading-none">
        <X size={10} />
      </button>
    </span>
  );
}

function TagRow({
  nodeId,
  cat,
  label,
  color,
  placeholder,
  values,
}: {
  nodeId: string;
  cat: TagCategory;
  label: string;
  color: string;
  placeholder: string;
  values: string[];
}) {
  const { project, updateMetadata, save } = useProjectStore();
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);

  const mergeTags = (next: string[]): DocumentTags => ({
    ...(project?.metadata[nodeId]?.tags ?? {}),
    [cat]: next,
  });

  const commit = async (raw: string) => {
    const val = raw.trim();
    if (!val || values.map((v) => v.toLowerCase()).includes(val.toLowerCase())) return;
    updateMetadata(nodeId, { tags: mergeTags([...values, val]) });
    await save();
  };

  const remove = async (val: string) => {
    updateMetadata(nodeId, { tags: mergeTags(values.filter((v) => v !== val)) });
    await save();
  };

  const handleKey = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      await commit(input);
      setInput("");
    }
    if (e.key === "Escape") { setInput(""); setAdding(false); }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>
          {label}
        </span>
        <button
          onClick={() => setAdding((v) => !v)}
          className="p-0.5 rounded hover:bg-[var(--bg-panel)] transition-colors"
          style={{ color: "var(--text-faint)" }}
        >
          <Plus size={11} />
        </button>
      </div>
      <div className="flex flex-wrap gap-1">
        {values.map((v) => (
          <TagChip key={v} value={v} color={color} onRemove={() => remove(v)} />
        ))}
        {adding && (
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            onBlur={async () => {
              await commit(input);
              setInput("");
              setAdding(false);
            }}
            placeholder={placeholder}
            className="text-xs bg-transparent outline-none border-b w-24"
            style={{ borderColor: color, color: "var(--text)" }}
          />
        )}
        {!adding && values.length === 0 && (
          <button
            onClick={() => setAdding(true)}
            className="text-xs"
            style={{ color: "var(--text-faint)" }}
          >
            + add
          </button>
        )}
      </div>
    </div>
  );
}

interface TagsPanelProps {
  nodeId: string;
}

export function TagsPanel({ nodeId }: TagsPanelProps) {
  const project = useProjectStore((s) => s.project);
  if (!project) return null;

  const tags = project.metadata[nodeId]?.tags ?? {};

  return (
    <div className="flex flex-col gap-4">
      {TAG_DEFINITIONS.map((def) => (
        <TagRow
          key={def.cat}
          nodeId={nodeId}
          cat={def.cat}
          label={def.label}
          color={def.color}
          placeholder={def.placeholder}
          values={tags[def.cat] ?? []}
        />
      ))}
    </div>
  );
}
