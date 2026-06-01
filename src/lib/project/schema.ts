export type NodeType = "folder" | "document" | "separator";
export type NodeRole = "archive";

export interface BinderNode {
  id: string;
  title: string;
  type: NodeType;
  driveId?: string;       // Google Drive file or folder ID
  children?: BinderNode[];
  isExpanded?: boolean;
  isActive?: boolean;     // false = excluded from manuscript builds (default true)
  role?: NodeRole;        // "archive" marks the special Archive root folder
}

export interface StatusOption {
  id: string;
  name: string;
  color: string;
}

export interface LabelOption {
  id: string;
  name: string;
  color: string;
}

export type CustomFieldType = "text" | "checkbox" | "date" | "dropdown";

export interface CustomMetadataField {
  id: string;
  name: string;
  type: CustomFieldType;
  options?: string[];
}

export type TagCategory = "pov" | "char" | "location" | "plot" | "time" | "object" | "entity" | "custom";

export interface DocumentTags {
  pov?: string[];
  char?: string[];
  location?: string[];
  plot?: string[];
  time?: string[];
  object?: string[];
  entity?: string[];
  custom?: string[];
}

export interface DocumentMetadata {
  status?: string;
  label?: string;
  synopsis?: string;
  notes?: string;
  wordCountGoal?: number;
  tags?: DocumentTags;
  customFields?: Record<string, string | boolean | number>;
}

export interface ProjectSettings {
  defaultStatus?: string;
  defaultLabel?: string;
  targetWordCount?: number;
  authorName?: string;
  dailyWordCountGoal?: number;
}

// ── Plot Grid ──────────────────────────────────────────────────────────────

export interface PlotLine {
  id: string;
  name: string;
  color: string;
}

export interface PlotCell {
  // empty string = no connection; any text = note shown in cell
  note: string;
}

export interface PlotGrid {
  plotLines: PlotLine[];
  // cells[plotLineId][nodeId] = PlotCell
  cells: Record<string, Record<string, PlotCell>>;
}

export interface Collection {
  id: string;
  name: string;
  nodeIds: string[];   // document binder node IDs (not Drive IDs)
  createdAt: string;
}

export interface Snapshot {
  id: string;
  name: string;
  createdAt: string;
  driveId: string;  // plain HTML file in Drive (not a Google Doc)
}

export interface ProjectData {
  id: string;
  name: string;
  created: string;
  modified: string;
  driveRootId: string;
  binder: BinderNode[];
  statuses: StatusOption[];
  labels: LabelOption[];
  customMetadataSchema: CustomMetadataField[];
  metadata: Record<string, DocumentMetadata>;
  settings: ProjectSettings;
  plotGrid?: PlotGrid;
  collections?: Collection[];
  snapshots?: Record<string, Snapshot[]>;       // nodeId -> snapshots
  wordCountHistory?: Record<string, number>;    // YYYY-MM-DD -> total project word count
}

export function getTotalWordCount(project: ProjectData): number {
  return Object.values(project.metadata).reduce((sum, m) => {
    return sum + ((m.customFields?._wordCount as number) ?? 0);
  }, 0);
}

export const DEFAULT_STATUSES: StatusOption[] = [
  { id: "todo",         name: "To Do",        color: "#94a3b8" },
  { id: "in-progress",  name: "In Progress",  color: "#f59e0b" },
  { id: "first-draft",  name: "First Draft",  color: "#3b82f6" },
  { id: "revised",      name: "Revised",      color: "#8b5cf6" },
  { id: "final",        name: "Final",        color: "#22c55e" },
];

export const DEFAULT_LABELS: LabelOption[] = [
  { id: "scene",        name: "Scene",        color: "#6366f1" },
  { id: "chapter",      name: "Chapter",      color: "#0ea5e9" },
  { id: "character",    name: "Character",    color: "#ec4899" },
  { id: "research",     name: "Research",     color: "#f97316" },
];

// Collect all active document nodes under a folder, depth-first order
export function collectDocuments(nodes: BinderNode[]): BinderNode[] {
  const result: BinderNode[] = [];
  for (const n of nodes) {
    if (n.isActive === false) continue;
    if (n.type === "document") {
      result.push(n);
    } else if (n.type === "folder" && n.children) {
      result.push(...collectDocuments(n.children));
    }
  }
  return result;
}

export function findNode(nodes: BinderNode[], id: string): BinderNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const found = findNode(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function createDefaultProject(id: string, name: string, driveRootId: string): ProjectData {
  const now = new Date().toISOString();

  return {
    id,
    name,
    created: now,
    modified: now,
    driveRootId,
    binder: [
      {
        id: crypto.randomUUID(),
        title: "Manuscript",
        type: "folder",
        isExpanded: true,
        children: [
          {
            id: crypto.randomUUID(),
            title: "Chapter 1",
            type: "folder",
            isExpanded: true,
            children: [
              { id: crypto.randomUUID(), title: "Scene 1", type: "document" },
            ],
          },
        ],
      },
      { id: crypto.randomUUID(), title: "Characters", type: "folder", children: [] },
      { id: crypto.randomUUID(), title: "Places",     type: "folder", children: [] },
      { id: crypto.randomUUID(), title: "Research",   type: "folder", children: [] },
      { id: crypto.randomUUID(), title: "Notes",      type: "folder", children: [] },
      {
        id: crypto.randomUUID(),
        title: "Archive",
        type: "folder",
        role: "archive",
        isExpanded: false,
        children: [],
      },
    ],
    statuses: DEFAULT_STATUSES,
    labels: DEFAULT_LABELS,
    customMetadataSchema: [],
    metadata: {},
    settings: {},
  };
}
