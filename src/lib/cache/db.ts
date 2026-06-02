// IndexedDB cache for offline support.
// Stores:
//   documents  — driveId → { driveId, projectId, content, savedAt }
//   projects   — projectId → { projectId, data (ProjectData JSON), savedAt }
//   pending    — auto-id → { url, method, body, createdAt }
//   elements   — pieceId → { pieceId, projectId, savedAt } (v2)

const DB_NAME = "cavafy";
const DB_VERSION = 2;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("documents")) {
        db.createObjectStore("documents", { keyPath: "driveId" });
      }
      if (!db.objectStoreNames.contains("projects")) {
        db.createObjectStore("projects", { keyPath: "projectId" });
      }
      if (!db.objectStoreNames.contains("pending")) {
        db.createObjectStore("pending", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("elements")) {
        db.createObjectStore("elements", { keyPath: "pieceId" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return open().then(
    (db) =>
      new Promise((resolve, reject) => {
        const store = db.transaction(storeName, mode).objectStore(storeName);
        const req = fn(store);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

// ── Documents ──────────────────────────────────────────────────────────────

export interface CachedDocument {
  driveId: string;
  projectId: string;
  content: string;
  savedAt: string;
}

export const docCache = {
  get: (driveId: string): Promise<CachedDocument | undefined> =>
    tx("documents", "readonly", (s) => s.get(driveId)),

  set: (doc: CachedDocument): Promise<IDBValidKey> =>
    tx("documents", "readwrite", (s) => s.put(doc)),
};

// ── Projects ───────────────────────────────────────────────────────────────

export interface CachedProject {
  projectId: string;
  data: string;   // JSON.stringify(ProjectData)
  savedAt: string;
}

export const projectCache = {
  get: (projectId: string): Promise<CachedProject | undefined> =>
    tx("projects", "readonly", (s) => s.get(projectId)),

  set: (entry: CachedProject): Promise<IDBValidKey> =>
    tx("projects", "readwrite", (s) => s.put(entry)),
};

// ── Pending writes ─────────────────────────────────────────────────────────

export interface PendingWrite {
  id?: number;
  url: string;
  method: string;
  body: string;
  createdAt: string;
}

export const pendingQueue = {
  push: (write: Omit<PendingWrite, "id">): Promise<IDBValidKey> =>
    tx("pending", "readwrite", (s) => s.add(write)),

  getAll: (): Promise<PendingWrite[]> =>
    open().then(
      (db) =>
        new Promise((resolve, reject) => {
          const req = db.transaction("pending", "readonly").objectStore("pending").getAll();
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        })
    ),

  delete: (id: number): Promise<undefined> =>
    tx("pending", "readwrite", (s) => s.delete(id)),

  clear: (): Promise<undefined> =>
    tx("pending", "readwrite", (s) => s.clear()),
};

// ── Elements (Pieces cache) ────────────────────────────────────────────────

export interface CachedElement {
  pieceId: string;
  projectId: string;
  savedAt: string;
}

export const elementCache = {
  get: (pieceId: string): Promise<CachedElement | undefined> =>
    tx("elements", "readonly", (s) => s.get(pieceId)),

  set: (entry: CachedElement): Promise<IDBValidKey> =>
    tx("elements", "readwrite", (s) => s.put(entry)),

  delete: (pieceId: string): Promise<undefined> =>
    tx("elements", "readwrite", (s) => s.delete(pieceId)),
};
