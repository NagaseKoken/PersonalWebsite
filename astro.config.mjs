import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// In CI these come from GitHub Pages: on nagasekoken.github.io/PersonalWebsite/ the base is
// "/PersonalWebsite"; once the custom domain is connected it becomes "/" automatically.
const site = process.env.SITE_URL || 'https://mohammedalnaser.dev';
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  site,
  base,
  vite: { plugins: [tailwindcss()] },
});
