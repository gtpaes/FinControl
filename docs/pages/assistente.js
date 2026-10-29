/* FinControl — página Assistente IA. */
import { insights } from '../js/api.js';
import { showToast, escapeHtml } from '../js/utils.js';
import { card, spinner, emptyState } from '../js/components.js';
import { ICONS } from '../js/icons.js';

const MAX_HISTORY = 10;

/** Texto do assistente → HTML seguro: escapa tudo e só então aplica **negrito** e quebras de linha. */
function formatReply(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

export async function renderAssistente(container) {
  container.innerHTML = spinner('A carregar assistente...');
  const history = []; // { role, content } — enviado ao backend a cada pergunta

  try {
    container.innerHTML = `
      <div class="page-assistente">
        ${card({
          title: 'Assistente Financeiro',
          subtitle: 'Pergunte sobre suas finanças',
          body: `
            <div class="chat-container" id="chat-messages">
              <div class="chat-message bot">
                <div class="chat-avatar">${ICONS.bot}</div>
                <div class="chat-bubble">
                  Olá! Sou o seu assistente financeiro. Conheço as suas receitas, despesas, orçamento, metas e carteira, e também tiro dúvidas sobre dinheiro e investimentos. O que gostaria de saber?
                </div>
              </div>
            </div>
            <form class="chat-input-form" id="chat-form">
              <input type="text" id="chat-input" class="form-input" placeholder="Escreva a sua pergunta..." required>
              <button type="submit" class="btn btn-primary">Enviar</button>
            </form>
          `
        })}
      </div>
    `;

    document.getElementById('chat-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('chat-input');
      const message = input.value.trim();
      if (!message) return;

      const chatContainer = document.getElementById('chat-messages');

      // Mensagem do utilizador
      chatContainer.insertAdjacentHTML('beforeend', `
        <div class="chat-message user">
          <div class="chat-bubble">${escapeHtml(message)}</div>
          <div class="chat-avatar">${ICONS.user}</div>
        </div>
      `);
      input.value = '';
      chatContainer.scrollTop = chatContainer.scrollHeight;

      // Loading
      const loadingId = 'loading-' + Date.now();
      chatContainer.insertAdjacentHTML('beforeend', `
        <div class="chat-message bot" id="${loadingId}">
          <div class="chat-avatar">${ICONS.bot}</div>
          <div class="chat-bubble"><span class="typing">A analisar...</span></div>
        </div>
      `);
      chatContainer.scrollTop = chatContainer.scrollHeight;

      try {
        const res = await insights.analyze(message, history.slice(-MAX_HISTORY));
        const reply = res.reply || 'Recebi a sua pergunta.';
        history.push({ role: 'user', content: message }, { role: 'assistant', content: reply });
        document.getElementById(loadingId).remove();
        chatContainer.insertAdjacentHTML('beforeend', `
          <div class="chat-message bot">
            <div class="chat-avatar">${ICONS.bot}</div>
            <div class="chat-bubble">${formatReply(reply)}</div>
          </div>
        `);
      } catch (err) {
        document.getElementById(loadingId).remove();
        showToast(err.message, 'error');
        chatContainer.insertAdjacentHTML('beforeend', `
          <div class="chat-message bot">
            <div class="chat-avatar">${ICONS.bot}</div>
            <div class="chat-bubble">Desculpe, ocorreu um erro ao processar a sua pergunta.</div>
          </div>
        `);
      }
      chatContainer.scrollTop = chatContainer.scrollHeight;
    });

  } catch (err) {
    showToast(err.message, 'error');
    container.innerHTML = emptyState('Erro ao carregar assistente.', ICONS.alert);
  }
}
