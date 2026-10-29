/* FinControl — página Configurações. */
import { auth } from '../js/api.js';
import { showToast, escapeHtml } from '../js/utils.js';
import { card, spinner, emptyState } from '../js/components.js';
import { ICONS } from '../js/icons.js';

export async function renderConfiguracoes(container) {
  container.innerHTML = spinner('A carregar configurações...');

  try {
    const user = await auth.me();

    container.innerHTML = `
      <div class="page-configuracoes">
        ${card({
          title: 'Perfil',
          body: `
            <form id="form-profile">
              <div class="form-group">
                <label>Nome</label>
                <input type="text" name="name" class="form-input" value="${escapeHtml(user.name || '')}" required>
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" name="email" class="form-input" value="${escapeHtml(user.email || '')}" required>
              </div>
              <button type="submit" class="btn btn-primary">Guardar alterações</button>
            </form>
          `
        })}
        ${card({
          title: 'Conta',
          body: `
            <div class="config-info">
              <p><strong>Criada em:</strong> ${user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '-'}</p>
              <p><strong>Email:</strong> ${escapeHtml(user.email || '-')}</p>
            </div>
            <hr class="divider">
            <button class="btn btn-danger" id="btn-logout">Terminar sessão</button>
          `
        })}
      </div>
    `;

    document.getElementById('form-profile').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await auth.updateProfile({
          name: fd.get('name'),
          email: fd.get('email')
        });
        showToast('Perfil atualizado!', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    document.getElementById('btn-logout').addEventListener('click', () => {
      localStorage.removeItem('fincontrol_token');
      window.location.reload();
    });

  } catch (err) {
    showToast(err.message, 'error');
    container.innerHTML = emptyState('Erro ao carregar configurações.', ICONS.alert);
  }
}
