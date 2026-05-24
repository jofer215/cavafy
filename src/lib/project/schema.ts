export type NodeType = "folder" | "document" | "separator";

export interface BinderNode {
  id: string;
  title: string;
  type: NodeType;
  driveId?: string;       // Google Drive file or folder ID
  children?: BinderNode[];
  isExpanded?: boolean;
}

export interface StatusOption {
  id: string;
  name: string;
  color: string; // hex or tailwind color name
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
  options?: string[]; // dropdown choices
}

export interface DocumentMetadata {
  status?: string;        // StatusOption.id
  label?: string;         // LabelOption.id
  synopsis?: string;
  notes?: string;
  wordCountGoal?: number;
  customFields?: Record<string, string | boolean | number>;
}

export interface ProjectSettings {
  defaultStatus?: string;
  defaultLabel?: string;
  targetWordCount?: number;
  authorName?: string;
}

export interface ProjectData {
  id: string;
  name: string;
  created: string;    // ISO
  modified: string;   // ISO
  driveRootId: string;
  binder: BinderNode[];
  statuses: StatusOption[];
  labels: LabelOption[];
  customMetadataSchema: CustomMetadataField[];
  metadata: Record<string, DocumentMetadata>;
  settings: ProjectSettings;
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

export function createDefaultProject(id: string, name: string, driveRootId: string): ProjectData {
  const now = new Date().toISOString();
  const manuscriptId = crypto.randomUUID();
  const charactersId = crypto.randomUUID();
  const placesId = crypto.randomUUID();
  const researchId = crypto.randomUUID();
  const notesId = crypto.randomUUID();

  return {
    id,
    name,
    created: now,
    modified: now,
    driveRootId,
    binder: [
      {
        id: manuscriptId,
        title: "Manuscript",
        type: "folder",
        isExpanded: true,
        children: [
          { id: crypto.randomUUID(), title: "Chapter 1", type: "folder", isExpanded: true, children: [
            { id: crypto.randomUUID(), title: "Scene 1", type: "document" },
          ]},
        ],
      },
      { id: charactersId,  title: "Characters", type: "folder", children: [] },
      { id: placesId,      title: "Places",     type: "folder", children: [] },
      { id: researchId,    title: "Research",   type: "folder", children: [] },
      { id: notesId,       title: "Notes",      type: "folder", children: [] },
    ],
    statuses: DEFAULT_STATUSES,
    labels: DEFAULT_LABELS,
    customMetadataSchema: [],
    metadata: {},
    settings: {},
  };
}
