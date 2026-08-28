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

    }
  }],
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: 'index.html',
        demo: 'demo/index.html',
        privacy: 'privacy/index.html',
        terms: 'terms/index.html'
      }
    }
  }
});
