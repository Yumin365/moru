// Serves dist/ under /moru/ to mimic GitHub Pages (https://<user>.github.io/<repo>/).
// Usage: npm run build && node scripts/serve-subpath.mjs
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const BASE = '/moru/';
const ROOT = 'dist';
const PORT = 4174;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
};

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (!url.pathname.startsWith(BASE)) {
    res.writeHead(404).end('Not found (app lives under ' + BASE + ')');
    return;
  }
  let path = normalize(decodeURIComponent(url.pathname.slice(BASE.length))).replace(/^(\.\.[/\\])+/, '');
  if (!path || path.endsWith('/') || path === '.') path = join(path, 'index.html');
  const file = join(ROOT, path);
  try {
    if (!(await stat(file)).isFile()) throw new Error();
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end('404');
  }
}).listen(PORT, () => console.log(`http://localhost:${PORT}${BASE}`));
