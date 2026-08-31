import * as esbuild from 'esbuild';
import { spawnSync } from 'child_process';
import { mkdirSync, copyFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
const isWatch = process.argv.includes('--watch');
const outdir = resolve(__dirname, 'dist');

mkdirSync(outdir, { recursive: true });

// Define import.meta.env for compatibility with existing code
const envDefines = {
  'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || ''),
  'import.meta.env.MODE': JSON.stringify(isProd ? 'production' : 'development'),
  'import.meta.env.PROD': JSON.stringify(isProd),
  'import.meta.env.DEV': JSON.stringify(!isProd),
};

function buildCSS() {
  const args = ['@tailwindcss/cli', '-i', 'docs/src/index.css', '-o', `${outdir}/styles.css`];
  if (isProd) args.push('--minify');
  if (isWatch) args.push('--watch');
  const r = spawnSync('npx', args, { stdio: 'inherit', shell: true });
  if (r.status !== 0) process.exit(r.status || 1);
}

const esbuildOptions = {
  entryPoints: [resolve(__dirname, 'docs/src/main.tsx')],
  bundle: true,
  outfile: `${outdir}/bundle.js`,
  format: 'esm',
  target: 'es2020',
  minify: isProd,
  sourcemap: !isProd,
  jsx: 'automatic',
  loader: {
    '.css': 'empty',
    '.png': 'file',
    '.svg': 'file',
    '.jpg': 'file',
    '.woff2': 'file',
  },
  define: envDefines,
  logLevel: 'info',
  publicPath: '/',
};

async function main() {
  if (isWatch) {
    // CSS watch (blocking spawn with stdio inherit)
    buildCSS();
    // JS watch via esbuild context
    const ctx = await esbuild.context(esbuildOptions);
    await ctx.watch();
    copyFileSync(resolve(__dirname, 'docs/index.html'), `${outdir}/index.html`);
    console.log('👀 Watching for changes...');
  } else {
    buildCSS();
    await esbuild.build(esbuildOptions);
    copyFileSync(resolve(__dirname, 'docs/index.html'), `${outdir}/index.html`);
    console.log('✅ Build complete:', outdir);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});