/**
 * FinControl — build.
 *
 * Gera o `docs/js/env-api.js` com a URL base da API conforme o ambiente:
 *   - local (localhost/127.0.0.1) → http://localhost:8080
 *   - produção (GitHub Pages, etc.) → mesma origin (proxy/mesmo host)
 *
 * Uso: npm run build
 */
import { writeFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TARGET = resolve(__dirname, 'docs', 'js', 'env-api.js');

const CONTENT = `/* FinControl — configuração da API.
 * Gerado por build.mjs — não editar manualmente.
 * Em desenvolvimento (localhost) aponta para localhost:8080.
 * Em produção usa a mesma origin (proxy reverso / mesmo host). */
(function () {
  const host = location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  window.API_BASE = isLocal ? 'http://localhost:8080' : '';
})();
`;

await writeFile(TARGET, CONTENT, 'utf8');
console.log('✔ env-api.js gerado em ' + TARGET);

