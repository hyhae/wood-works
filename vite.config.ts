import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit({ adapter: adapter({ fallback: '404.html' }), preprocess: vitePreprocess() })],
  test: { include: ['tests/unit/**/*.test.ts'] }
});
