import { defineConfig } from 'vite';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [{
    name: 'sentinel-precache-manifest',
    writeBundle(_options, bundle) {
      const files = Object.values(bundle)
        .map(output => `/${output.fileName}`)
        .filter(file => /^\/assets\/main-.*\.(js|css)$/.test(file));
      const workerPath = resolve(process.cwd(), 'dist/sw.js');
      const worker = readFileSync(workerPath, 'utf8').replace('/*__PRECACHE__*/[]', JSON.stringify(files));
      writeFileSync(workerPath, worker);

      // Keep the complete interactive shell in the cached document. Some
      // browsers suspend a service worker between navigation and its module
      // requests while fully offline; inlining avoids that fragile hand-off.
      const scriptPath = files.find(file => file.endsWith('.js'))!;
      const stylePath = files.find(file => file.endsWith('.css'))!;
      const indexPath = resolve(process.cwd(), 'dist/index.html');
      const script = readFileSync(resolve(process.cwd(), `dist${scriptPath}`), 'utf8');
      const style = readFileSync(resolve(process.cwd(), `dist${stylePath}`), 'utf8');
      const index = readFileSync(indexPath, 'utf8')
        .replace(`<script type="module" crossorigin src="${scriptPath}"></script>`, `<script type="module">${script}</script>`)
        .replace(`<link rel="stylesheet" crossorigin href="${stylePath}">`, `<style>${style}</style>`);
      writeFileSync(indexPath, index);
    }
  }],
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: 'index.html',
        privacy: 'privacy/index.html',
        terms: 'terms/index.html'
      }
    }
  }
});
