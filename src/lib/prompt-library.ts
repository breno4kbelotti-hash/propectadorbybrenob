// Biblioteca de prompts com mídia (foto ou vídeo até 500MB) salva no IndexedDB.
export type PromptMedia = {
  kind: "image" | "video";
  mime: string;
  name: string;
  size: number;
};

export type PromptItem = {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  media?: PromptMedia;
};

export const MAX_MEDIA_BYTES = 500 * 1024 * 1024; // 500 MB

const DB_NAME = "prospectador-prompts";
const STORE = "prompts";
const BLOBS = "blobs";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
      if (!db.objectStoreNames.contains(BLOBS)) db.createObjectStore(BLOBS);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(store: string, mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = run(t.objectStore(store));
        req.onsuccess = () => resolve(req.result as T);
        req.onerror = () => reject(req.error);
      }),
  );
}

export async function listPrompts(): Promise<PromptItem[]> {
  const all = await tx<PromptItem[]>(STORE, "readonly", (s) => s.getAll());
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function savePrompt(item: PromptItem, blob?: Blob | null): Promise<void> {
  await tx(STORE, "readwrite", (s) => s.put(item));
  if (blob) await tx(BLOBS, "readwrite", (s) => s.put(blob, item.id));
}

export async function deletePrompt(id: string): Promise<void> {
  await tx(STORE, "readwrite", (s) => s.delete(id));
  await tx(BLOBS, "readwrite", (s) => s.delete(id));
}

export async function getPromptMediaUrl(id: string): Promise<string | null> {
  const blob = await tx<Blob | undefined>(BLOBS, "readonly", (s) => s.get(id));
  return blob ? URL.createObjectURL(blob) : null;
}
