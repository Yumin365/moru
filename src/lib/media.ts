/**
 * Image storage for 꾸미기 (backgrounds, stickers, stamps) in IndexedDB — on this
 * device only, works offline. localStorage is too small for pictures.
 */
const DB_NAME = 'dailyfit-media';
const STORE = 'images';

export interface StoredImage {
  id: string;
  blob: Blob;
  width: number;
  height: number;
  createdAt: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function db(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return db().then(
    (d) =>
      new Promise<T>((resolve, reject) => {
        const t = d.transaction(STORE, mode);
        const req = run(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

const urlCache = new Map<string, string>();

export function newMediaId(): string {
  return `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function saveImage(blob: Blob, width: number, height: number): Promise<string> {
  const id = newMediaId();
  await tx('readwrite', (s) => s.put({ id, blob, width, height, createdAt: new Date().toISOString() } satisfies StoredImage));
  return id;
}

export async function getImage(id: string): Promise<StoredImage | undefined> {
  return tx<StoredImage | undefined>('readonly', (s) => s.get(id) as IDBRequest<StoredImage | undefined>);
}

/** Object URL for an image id (cached for the session). */
export async function imageUrl(id: string): Promise<string | null> {
  const hit = urlCache.get(id);
  if (hit) return hit;
  const img = await getImage(id).catch(() => undefined);
  if (!img) return null;
  const url = URL.createObjectURL(img.blob);
  urlCache.set(id, url);
  return url;
}

export async function deleteImage(id: string): Promise<void> {
  const url = urlCache.get(id);
  if (url) URL.revokeObjectURL(url);
  urlCache.delete(id);
  await tx('readwrite', (s) => s.delete(id)).catch(() => {});
}

export async function allImages(): Promise<StoredImage[]> {
  return tx<StoredImage[]>('readonly', (s) => s.getAll() as IDBRequest<StoredImage[]>).catch(() => []);
}

export async function clearImages(): Promise<void> {
  urlCache.forEach((u) => URL.revokeObjectURL(u));
  urlCache.clear();
  await tx('readwrite', (s) => s.clear()).catch(() => {});
}

/** Removes images no setting points to any more. */
export async function pruneImages(keep: Set<string>): Promise<void> {
  const images = await allImages();
  await Promise.all(images.filter((i) => !keep.has(i.id)).map((i) => deleteImage(i.id)));
}

// ── backup helpers ──────────────────────────────────────────
export interface ImageBackup {
  id: string;
  width: number;
  height: number;
  dataUrl: string;
}

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });

export async function exportImages(ids: Set<string>): Promise<ImageBackup[]> {
  const images = (await allImages()).filter((i) => ids.has(i.id));
  return Promise.all(images.map(async (i) => ({ id: i.id, width: i.width, height: i.height, dataUrl: await blobToDataUrl(i.blob) })));
}

export async function importImages(list: ImageBackup[]): Promise<void> {
  for (const item of list) {
    const blob = await (await fetch(item.dataUrl)).blob();
    await tx('readwrite', (s) =>
      s.put({ id: item.id, blob, width: item.width, height: item.height, createdAt: new Date().toISOString() } satisfies StoredImage),
    );
  }
}
