import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/** Recursively list files in a folder as POSIX paths relative to it. */
function listFiles(dir: string, root = dir): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full, root) : [relative(root, full).split(sep).join('/')];
  });
}

/**
 * Builds `sw.js` from `pwa/sw.js`, injecting the list of every emitted file so the
 * whole app shell is precached. A fresh version string per build busts old caches.
 * YouTube is never cached (see pwa/sw.js).
 */
function serviceWorkerPlugin(): Plugin {
  return {
    name: 'moru-service-worker',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const emitted = Object.keys(bundle).filter((f) => !f.endsWith('.map'));
      const fromPublic = listFiles('public').filter((f) => f !== '.nojekyll');
      const precache = ['./', ...new Set([...emitted, ...fromPublic])];
      const version = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
      const source = readFileSync('pwa/sw.js', 'utf8')
        .replace('__BUILD_VERSION__', version)
        .replace('self.__PRECACHE_MANIFEST__', JSON.stringify(precache));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  // Relative base → works at https://<user>.github.io/<repo>/ and any other sub-path.
  base: './',
  plugins: [react(), serviceWorkerPlugin()],
  server: { host: true },
  preview: { host: true },
});
