/* FinControl — configuração da API.
 * Gerado por build.mjs — não editar manualmente.
 * Em desenvolvimento (localhost) aponta para localhost:8080.
 * Em produção usa a mesma origin (proxy reverso / mesmo host). */
(function () {
  const host = location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  window.API_BASE = isLocal ? 'http://localhost:8080' : '';
})();
