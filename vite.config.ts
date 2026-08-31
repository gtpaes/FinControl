import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // O frontend vive em /docs (padrão GitHub Pages): index.html + src/ estão lá.
  root: 'docs',
  base: './', // caminhos relativos — funciona em subpasta (ex.: usuario.github.io/fincontrol/)
  plugins: [react(), tailwindcss()],
  build: {
    // Saída do build continua na raiz do projeto, fora de docs/ (que contém o código-fonte)
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 5500,
    open: true, // abre o navegador automaticamente
    watch: {
      // O projeto contém um backend Java/Spring Boot em /backend,
      // que não deve ser monitorado pelo Vite (evita crash do watcher).
      ignored: ['**/backend/**', '**/node_modules/**', '**/dist/**'],
    },
  },
})
