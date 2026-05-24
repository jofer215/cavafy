"use client";

import { useProjectStore } from "@/store/project";
import { useReferenceIndex } from "@/hooks/useReferenceIndex";
import { TagCategory } from "@/lib/project/schema";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ChevronRight } from "lucide-react";

const CAT_META: Record<TagCategory, { label: string; color: string }> = {
  pov:      { label: "POV",      color: "#6366f1" },
  char:     { label: "Chars",    color: "#ec4899" },
  location: { label: "Location", color: "#0ea5e9" },
  plot:     { label: "Plot",     color: "#f59e0b" },
  time:     { label: "Time",     color: "#22c55e" },
  object:   { label: "Objects",  color: "#f97316" },
  entity:   { label: "Entities", color: "#8b5cf6" },
  custom:   { label: "Custom",   color: "#94a3b8" },
};

function TagSection({
  cat,
  entries,
  onSelect,
}: {
  cat: TagCategory;
  entries: Record<string, import("@/hooks/useReferenceIndex").ReferenceEntry[]>;
  onSelect: (nodeId: string) => void;
}) {
  const { label, color } = CAT_META[cat];
  const [expanded, setExpanded] = useState(true);
  const keys = Object.keys(entries);
  if (keys.length === 0) return null;

  return (
    <div>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 w-full mb-2"
      >
        <ChevronRight
          size={11}
          style={{ transform: expanded ? "rotate(90deg)" : undefined, color }}
          className="transition-transform shrink-0"
        />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>
          {label}
        </span>
      </button>

      {expanded && (
        <div className="flex flex-col gap-3 pl-3 mb-3">
          {keys.sort().map((key) => (
            <div key={key}>
              <p className="text-xs font-medium capitalize mb-1" style={{ color: "var(--text)" }}>
                {key}
              </p>
              <div className="flex flex-col gap-0.5 pl-2">
                {entries[key].map((e) => (
                  <button
                    key={e.nodeId}
                    onClick={() => onSelect(e.nodeId)}
                    className="text-left text-xs px-2 py-0.5 rounded hover:bg-[var(--bg-panel)] transition-colors truncate"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {e.nodeTitle}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ReferencesPanel() {
  const { setSelectedNode } = useProjectStore();
  const index = useReferenceIndex();

  const categories = Object.keys(index) as TagCategory[];
  const hasAny = categories.some((c) => Object.keys(index[c]).length > 0);

  if (!hasAny) {
    return (
      <p className="text-xs text-center pt-4" style={{ color: "var(--text-faint)" }}>
        No tags yet. Add @pov, @char, @location tags in the Tags tab to see references here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {categories.map((cat) => (
        <TagSection
          key={cat}
          cat={cat}
          entries={index[cat]}
          onSelect={setSelectedNode}
        />
      ))}
    </div>
  );
}
