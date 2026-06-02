import { ProjectData, BinderNode, Piece, PieceNote } from "@/lib/project/schema";
import { generateId } from "@/lib/utils";

const MIGRATE_FOLDERS: Record<string, string> = {
  Characters: "character",
  Places: "place",
};

function makeDescriptionNote(): PieceNote {
  return { id: generateId(), title: "Description", body: "" };
}

function removeNodes(nodes: BinderNode[], idsToRemove: Set<string>): BinderNode[] {
  return nodes
    .filter((n) => !idsToRemove.has(n.id))
    .map((n) => n.children ? { ...n, children: removeNodes(n.children, idsToRemove) } : n);
}

export function migrateBinderFoldersToPieces(project: ProjectData): ProjectData | null {
  if (project.migrations?.placesImported) return null;

  const newPieces: Piece[] = [];
  const migratedNodeIds = new Set<string>();
  const emptyFolderIds = new Set<string>();

  function scanNode(node: BinderNode) {
    if (node.type !== "folder" || !node.children) return;
    const pieceType = MIGRATE_FOLDERS[node.title];
    if (pieceType) {
      node.children.filter((c) => c.type === "document").forEach((doc) => {
        newPieces.push({
          id: generateId(),
          name: doc.title,
          alternativeNames: [],
          pieceType,
          pieceNotes: [makeDescriptionNote()],
          tags: [],
          relations: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        migratedNodeIds.add(doc.id);
      });
      const remaining = node.children.filter((c) => !migratedNodeIds.has(c.id));
      if (remaining.length === 0) emptyFolderIds.add(node.id);
    }
    node.children.forEach(scanNode);
  }

  project.binder.forEach(scanNode);

  const migrations = { ...project.migrations, placesImported: true };

  if (newPieces.length === 0) {
    return { ...project, migrations };
  }

  const allRemove = new Set([...migratedNodeIds, ...emptyFolderIds]);
  return {
    ...project,
    binder: removeNodes(project.binder, allRemove),
    pieces: [...(project.pieces ?? []), ...newPieces],
    migrations,
  };
}
