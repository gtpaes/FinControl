/**
 * FinControl — servidor estático de desenvolvimento (sem dependências).
 *
 * Serve os arquivos prontos de `docs/` em http://localhost:PORT
 * (padrão 5500). Use junto com o backend local (http://localhost:8080);
 * o api.js já aponta para localhost:8080 quando o host é localhost.
 *
 * Uso:
 *   node scripts/dev-server.mjs [PORTA]
 *
 * Opcional: gere o env-api.js primeiro se for usar outra URL de API.
 *   node build.mjs
 */
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, resolve, sep, normalize } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Raiz do PROJETO (para suportar /docs/...). O app vive em /docs/.
const ROOT = resolve(__dirname, '..');
const APP_ROOT = resolve(ROOT, 'docs');
const PORT = Number(process.argv[2]) || 5500;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
};

// Nunca deixa o browser guardar HTML no lugar de um asset (evita "Unexpected token '<'").
function headers(extra = {}) {
  return { 'Cache-Control': 'no-cache', ...extra };
}

createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);

    // Raiz do site -> /docs/ (o app vive lá)
    if (urlPath === '/' || urlPath === '/index.html') {
      res.writeHead(302, headers({ Location: '/docs/' }));
      res.end();
      return;
    }
    // Sempre sob /docs/
    if (!urlPath.startsWith('/docs')) {
      res.writeHead(302, headers({ Location: '/docs' + (urlPath === '/' ? '/' : urlPath) }));
      res.end();
      return;
    }

    // evita path traversal e resolve dentro de APP_ROOT/docs
    const rel = urlPath.slice('/docs'.length) || '/';
    let p = rel.endsWith('/') ? rel + 'index.html' : rel;
    let filePath = normalize(resolve(APP_ROOT, '.' + sep + p));
    if (!filePath.startsWith(APP_ROOT)) { res.writeHead(403, headers()).end('Forbidden'); return; }

    const ext = extname(filePath).toLowerCase();
    let data = await readFile(filePath);
    res.writeHead(200, headers({ 'Content-Type': MIME[ext] || 'application/octet-stream' }));
    res.end(data);
  } catch (err) {
    const ext = extname(urlPathSafe(req.url)).toLowerCase();
    // Fallback SPA apenas para páginas HTML; assets recebem 404 real
    if (ext && ext !== '.html' && MIME[ext]) {
      res.writeHead(404, headers({ 'Content-Type': 'text/plain; charset=utf-8' }));
      res.end('404 - ' + req.url + ' não encontrado');
      return;
    }
    try {
      const data = await readFile(resolve(APP_ROOT, 'index.html'));
      res.writeHead(200, headers({ 'Content-Type': 'text/html; charset=utf-8' }));
      res.end(data);
    } catch {
      res.writeHead(404, headers({ 'Content-Type': 'text/plain; charset=utf-8' }));
      res.end('404 - não encontrado');
    }
  }
}).listen(PORT, () => {
  console.log(`🌐 Frontend FinControl em http://localhost:${PORT}  (app em /docs/)`);
  console.log(`   Abra http://localhost:${PORT}/  (redireciona para /docs/)`);
  console.log(`   Pressione Ctrl+C para parar.`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ A porta ${PORT} já está em uso (Live Server do VS Code usa 5500!).`);
    console.error(`   Feche o outro servidor ou rode: node scripts/dev-server.mjs 5501`);
    console.error(`   Depois abra http://localhost:5501`);
  } else {
    console.error('Erro no servidor:', err.message);
  }
  process.exit(1);
});

function urlPathSafe(url) {
  try { return decodeURIComponent((url || '/').split('?')[0]); } catch { return '/'; }
}