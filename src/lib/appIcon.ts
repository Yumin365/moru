/**
 * Custom home-screen icon. The default icons are static files; a custom one is a
 * picture from IndexedDB, swapped in at runtime: favicon, apple-touch-icon and a
 * generated manifest (blob URL) whose icons are data URLs.
 *
 * The browser reads these when the app is added to the home screen, so an icon
 * that is already on the home screen only changes after removing and re-adding it.
 */
import { getImage } from './media';

export const DEFAULT_ICON = './icons/icon-192.png';

const original = new Map<Element, string>();
let manifestUrl: string | null = null;

function remember(el: Element | null, attr = 'href') {
  if (el && !original.has(el)) original.set(el, el.getAttribute(attr) ?? '');
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

async function customManifest(href: string, icon: string, type: string): Promise<string> {
  const base = new URL(href, document.baseURI);
  const json = (await (await fetch(base)).json()) as Record<string, unknown>;
  // a blob: manifest has no base URL of its own, so every path must be absolute
  const abs = (p: unknown) => new URL(String(p ?? './'), base).href;
  const manifest = {
    ...json,
    id: abs(json.id),
    start_url: abs(json.start_url),
    scope: abs(json.scope),
    icons: [
      { src: icon, sizes: '512x512', type, purpose: 'any' },
      { src: icon, sizes: '512x512', type, purpose: 'maskable' },
    ],
  };
  return URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' }));
}

export async function applyAppIcon(imageId: string | undefined): Promise<void> {
  const manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  const iconLinks = [...document.querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="apple-touch-icon"]')];
  [manifestLink, ...iconLinks].forEach((el) => remember(el));

  if (manifestUrl) {
    URL.revokeObjectURL(manifestUrl);
    manifestUrl = null;
  }

  const stored = imageId ? await getImage(imageId).catch(() => undefined) : undefined;
  if (!stored) {
    original.forEach((href, el) => el.setAttribute('href', href));
    return;
  }

  const dataUrl = await blobToDataUrl(stored.blob);
  iconLinks.forEach((el) => {
    el.setAttribute('href', dataUrl);
    el.removeAttribute('sizes');
    if (el.rel === 'icon') el.type = stored.blob.type;
  });
  if (manifestLink) {
    try {
      manifestUrl = await customManifest(original.get(manifestLink) || './manifest.webmanifest', dataUrl, stored.blob.type);
      manifestLink.href = manifestUrl;
    } catch {
      /* offline before the manifest was ever cached: keep the default one */
    }
  }
}
