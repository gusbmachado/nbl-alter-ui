// Use Astro's API so agent detection cannot detach the Playwright web server.
import { dev } from 'astro';
const server = await dev({ server: { host: '127.0.0.1', port: 4329 } });
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => { await server.stop(); process.exit(0); });
}
