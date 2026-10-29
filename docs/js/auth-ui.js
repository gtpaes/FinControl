import { auth, setToken, getToken } from './api.js';
import { showToast } from './utils.js';

if (getToken()) {
  window.location.href = 'index.html';
}

const formLogin = document.getElementById('form-login');
const formRegister = document.getElementById('form-register');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.querySelector('.auth-form-header p');
const authFooterText = document.getElementById('auth-footer-text');
const authToggle = document.getElementById('auth-toggle');
const btnLogin = document.getElementById('btn-login');
const btnRegister = document.getElementById('btn-register');

let isLoginMode = true;

authToggle.addEventListener('click', (e) => {
  e.preventDefault();
  isLoginMode = !isLoginMode;
  
  if (isLoginMode) {
    formLogin.classList.remove('hidden');
    formRegister.classList.add('hidden');
    authTitle.textContent = 'Bem-vindo de volta';
    authSubtitle.textContent = 'Entre na sua conta para continuar';
    authFooterText.textContent = 'Ainda não possui uma conta?';
    authToggle.textContent = 'Criar conta';
  } else {
    formLogin.classList.add('hidden');
    formRegister.classList.remove('hidden');
    authTitle.textContent = 'Crie sua conta';
    authSubtitle.textContent = 'Comece a organizar sua vida financeira';
    authFooterText.textContent = 'Já possui uma conta?';
    authToggle.textContent = 'Entrar';
  }
});

formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  btnLogin.classList.add('btn-loading');
  btnLogin.disabled = true;
  
  try {
    const res = await auth.login(email, password);
    setToken(res.token);
    window.location.href = 'index.html';
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btnLogin.classList.remove('btn-loading');
    btnLogin.disabled = false;
  }
});

formRegister.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  
  btnRegister.classList.add('btn-loading');
  btnRegister.disabled = true;
  
  try {
    await auth.register(name, email, password);
    showToast('Conta criada! Faça login.', 'success');
    authToggle.click();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btnRegister.classList.remove('btn-loading');
    btnRegister.disabled = false;
  }
});
