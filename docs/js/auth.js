/* FinControl — autenticação e gate de acesso. */
import { auth, setToken, getToken } from './api.js';

const APP_SHELL = 'app-shell';

/** Inicializa o gate: mostra app ou redireciona para login. */
export async function initAuth() {
  const token = getToken();

  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const user = await auth.me();
    showApp(user);
  } catch {
    setToken(null);
    window.location.href = 'login.html';
  }
}

/** Mostra a app shell e inicializa. */
function showApp(user) {
  document.getElementById(APP_SHELL).classList.remove('hidden');
  document.dispatchEvent(new CustomEvent('app:ready', { detail: user }));
}

/** Faz logout. */
export function logout() {
  setToken(null);
  window.location.href = 'login.html';
}
