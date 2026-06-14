"use client";

import { useMemo } from "react";
import { useProjectStore } from "@/store/project";
import { collectDocuments, TagCategory, TAG_CATEGORIES } from "@/lib/project/schema";

export interface ReferenceEntry {
  nodeId: string;
  nodeTitle: string;
}

export type ReferenceIndex = Record<TagCategory, Record<string, ReferenceEntry[]>>;

export function useReferenceIndex(): ReferenceIndex {
  const project = useProjectStore((s) => s.project);

  return useMemo(() => {
    const index = Object.fromEntries(TAG_CATEGORIES.map((c) => [c, {}])) as ReferenceIndex;
    if (!project) return index;

    const docs = collectDocuments(project.binder);
    for (const doc of docs) {
      const meta = project.metadata[doc.id];
      if (!meta?.tags) continue;
      const entry: ReferenceEntry = { nodeId: doc.id, nodeTitle: doc.title };
      for (const cat of TAG_CATEGORIES) {
        for (const val of meta.tags[cat] ?? []) {
          const key = val.toLowerCase().trim();
          if (!key) continue;
          if (!index[cat][key]) index[cat][key] = [];
          index[cat][key].push(entry);
        }
      }
    }
    return index;
  }, [project]);
}
