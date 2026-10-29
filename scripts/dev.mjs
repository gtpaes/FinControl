/**
 * FinControl — `npm run dev`
 *
 * Arranca em paralelo:
 *   1. Backend  (Spring Boot, porta 8080)  — via backend/start-dev.bat (mvnw)
 *   2. Frontend (estático, porta 5500)     — via scripts/dev-server.mjs
 *
 * Uso: npm run dev -- [PORTA_FRONTEND]
 * Exemplo com outra aplicação na porta 5500: npm run dev -- 5501
 * Encerra ambos com Ctrl+C.
 */
import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const FRONT_PORT = process.argv[2] || '5500';

const children = [];

function run(name, commandLine, opts = {}) {
  const child = spawn(commandLine, {
    shell: true,
    windowsHide: true,
    ...opts,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const tag = `[${name}]`;
  child.stdout.on('data', (d) => process.stdout.write(d.toString().split('\n').filter(Boolean).map((l) => `${tag} ${l}`).join('\n') + '\n'));
  child.stderr.on('data', (d) => process.stderr.write(d.toString().split('\n').filter(Boolean).map((l) => `${tag} ${l}`).join('\n') + '\n'));
  child.on('exit', (code) => {
    if (shuttingDown) return;
    console.log(`${tag} terminou com código ${code}`);
    if (code !== 0) shutdown(code ?? 1);
  });
  children.push(child);
  return child;
}

let shuttingDown = false;
function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('\nA encerrar processos...');
  for (const c of children) {
    try { c.kill(); } catch { /* ignora */ }
  }
  process.exit(code);
}
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

console.log('=== FinControl — modo desenvolvimento ===\n');

// 1. Backend (Spring Boot na porta 8080)
run('backend', 'cmd /c start-dev.bat', {
  cwd: resolve(ROOT, 'backend'),
  env: {
    ...process.env,
    FINCONTROL_DEV_FRONTEND_ORIGIN: `http://localhost:${FRONT_PORT}`,
  },
});

// 2. Frontend (servidor estático na porta 5500)
run('frontend', `node "${resolve(__dirname, 'dev-server.mjs')}" ${FRONT_PORT}`, { cwd: ROOT });

console.log('\n→ Frontend: http://localhost:' + FRONT_PORT);
console.log('→ Backend:  http://localhost:8080  (pode demorar a arrancar na 1ª execução)');
console.log('→ Ctrl+C para parar ambos.\n');
