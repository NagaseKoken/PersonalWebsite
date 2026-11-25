import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://mohako66.dev',
  vite: { plugins: [tailwindcss()] },
});
