import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, sep, extname } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const mount = '/MTG-Pack-Battle/';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === '/' || pathname === mount.slice(0, -1)) { res.writeHead(302, { Location: mount }).end(); return; }
    if (!pathname.startsWith(mount)) { res.writeHead(404).end('Not found'); return; }
    const relative = pathname.slice(mount.length) || 'index.html';
    const path = resolve(root, relative);
    if (!path.startsWith(root + (root.endsWith(sep) ? '' : sep)) || relative.split('/').some(part => part.startsWith('.'))) { res.writeHead(404).end('Not found'); return; }
    const content = await readFile(path);
    res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(content);
  } catch { if (!res.headersSent) res.writeHead(404); res.end('Not found'); }
});
server.listen(4173, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:4173${mount}`));
