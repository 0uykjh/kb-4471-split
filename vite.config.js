import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import path from 'node:path';

const root = path.resolve('.');
export default defineConfig({
  resolve: { alias: { '#lib': path.resolve(root, 'src/lib') } },
  plugins: [
    svelte({
      extensions: ['.svelte', '.svx'],
      preprocess: [mdsvex({
        extensions: ['.svx'],
        layout: { runbook: path.resolve(root, 'src/lib/layouts/runbook.svelte') },
      })],
      compilerOptions: { css: 'injected' },
    }),
  ],
  build: { ssr: true, minify: false, rollupOptions: { output: { format: 'esm' } } },
});
