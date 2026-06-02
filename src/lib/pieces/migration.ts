import { ProjectData, BinderNode, Piece, PieceNote } from "@/lib/project/schema";

const MIGRATE_FOLDERS: Record<string, string> = {
  Characters: "character",
  Places: "place",
};

function makeDescriptionNote(): PieceNote {
  return { id: crypto.randomUUID(), title: "Description", body: "" };
}

function removeDocumentChildren(
  nodes: BinderNode[],
  idsToRemove: Set<string>
): BinderNode[] {
  return nodes
    .filter((n) => !idsToRemove.has(n.id))
    .map((n) =>
      n.children
        ? { ...n, children: removeDocumentChildren(n.children, idsToRemove) }
        : n
    );
}

export function migrateBinderFoldersToPieces(project: ProjectData): ProjectData | null {
  if (project.settings.placesImported) return null;

  const newPieces: Piece[] = [];
  const migratedNodeIds = new Set<string>();
  const emptyFolderIds = new Set<string>();

  function scanNode(node: BinderNode) {
    if (node.type !== "folder" || !node.children) return;
    const pieceType = MIGRATE_FOLDERS[node.title];
    if (pieceType) {
      const docChildren = node.children.filter((c) => c.type === "document");
      docChildren.forEach((doc) => {
        newPieces.push({
          id: crypto.randomUUID(),
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
      // If all children are being migrated, mark folder for removal too
      const remaining = node.children.filter((c) => !migratedNodeIds.has(c.id));
      if (remaining.length === 0) emptyFolderIds.add(node.id);
    }
    node.children.forEach(scanNode);
  }

  project.binder.forEach(scanNode);

  if (newPieces.length === 0) {
    // Nothing to migrate — just mark as done so we don't re-check every load
    return {
      ...project,
      settings: { ...project.settings, placesImported: true },
    };
  }

  const allRemove = new Set([...migratedNodeIds, ...emptyFolderIds]);
  const updatedBinder = removeDocumentChildren(project.binder, allRemove);

  return {
    ...project,
    binder: updatedBinder,
    pieces: [...(project.pieces ?? []), ...newPieces],
    settings: { ...project.settings, placesImported: true },
  };
}
