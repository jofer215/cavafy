import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { loadProject } from "@/lib/google/drive";
import { findNode, collectDocuments, TagCategory, TAG_CATEGORIES } from "@/lib/project/schema";

// Returns a map: tagValue → [{ nodeId, nodeTitle, category }]
export type ReferenceEntry = { nodeId: string; nodeTitle: string };
export type ReferenceIndex = Record<string, ReferenceEntry[]>;

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const project = await loadProject(session.accessToken, projectId);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Build an index: tagValue → list of documents that reference it, by category
  const index = Object.fromEntries(TAG_CATEGORIES.map((c) => [c, {}])) as Record<TagCategory, ReferenceIndex>;

  const allDocs = collectDocuments(project.binder);
  for (const doc of allDocs) {
    const meta = project.metadata[doc.id];
    if (!meta?.tags) continue;
    const node = findNode(project.binder, doc.id);
    if (!node) continue;
    const entry: ReferenceEntry = { nodeId: doc.id, nodeTitle: node.title };
    for (const cat of TAG_CATEGORIES) {
      const values: string[] = meta.tags[cat] ?? [];
      for (const val of values) {
        const key = val.toLowerCase().trim();
        if (!key) continue;
        if (!index[cat][key]) index[cat][key] = [];
        index[cat][key].push(entry);
      }
    }
  }

  return NextResponse.json(index);
}
