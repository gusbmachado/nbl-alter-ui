import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
export default defineConfig({ output: 'static', integrations: [react()], trailingSlash: 'ignore', vite: { optimizeDeps: { include: ['react-markdown', 'page-flip'] } } });
