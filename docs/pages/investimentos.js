/**
 * FinControl - pagina Investimentos (carteira ao vivo + catalogo + simulador).
 * Dados reais via APIs: brapi (B3), Massive (EUA), BrasilAPI (CDI).
 */
import { investments, market } from '../js/api.js';
import { formatCurrency, showToast, LABELS, escapeHtml, debounce } from '../js/utils.js';
import { card, table, row, spinner, emptyState, modal, openModal, closeModal, selectEnum, lineChart, donutChart } from '../js/components.js';
import { ICONS } from '../js/icons.js';

let liveQuotes = {};
let quoteTime = null;
let allItemsCache = [];
let catalogMarket = 'B3';
let catalogType = 'ALL';
let catalogLastResults = [];

/* Ativos populares por categoria (quando busca esta vazia) */
const POPULAR = {
  B3: ['PETR4','VALE3','ITUB4','BBDC4','ABEV3','WEGE3','RENT3','SUZB3','JBSS3','MGLU3','HGLG11','XPML11','KNRI11','BOVA11','IVVB11','SMAL11','GOLD11','XFIX11'],
  US: ['AAPL','MSFT','GOOGL','AMZN','TSLA','NVDA','META','NFLX','V','JPM','DIS','BA','KO','PG','INTC','AMD','COIN','MSTR']
};

export async function renderInvestimentos(container) {
  container.innerHTML = spinner('A carregar investimentos...');
  try {
    const [items, summary, evolution] = await Promise.all([
      investments.list(), investments.summary(), investments.evolution(12)
    ]);
    try {
      const tickers = items.map(i => i.ticker).filter(Boolean);
      const quotes = tickers.length ? await market.quotes(tickers) : [];
      liveQuotes = {};
      quotes.forEach(q => { liveQuotes[q.ticker] = q; });
      const anyLive = quotes.find(q => q.price != null);
      quoteTime = anyLive ? new Date(anyLive.fetchedAt) : null;
    } catch { liveQuotes = {}; quoteTime = null; }

    allItemsCache = items;
    container.innerHTML = buildPage(summary, items, evolution);
    bindEvents(container);
  } catch (err) {
    container.innerHTML = emptyState('Erro: ' + err.message, ICONS.alert, 'Tentar novamente', () => renderInvestimentos(container));
  }
}



function buildPage(summary, items, evolution) {
  const evoData = evolution.map(e => ({ label: e.label, value: e.value }));
  const allocData = buildAllocData(items);
  const rowsList = items.map(i => buildRow(i));
  return `
    <div class="page-investimentos">
      ${buildSummary(summary, items)}
      <div class="grid-2">
        ${card({ title: 'Evolucao da Carteira', body: lineChart(evoData, { height: 240 }) })}
        ${card({ title: 'Alocacao por Tipo', body: donutChart(allocData, { height: 240 }) })}
      </div>
      ${card({
        title: 'Carteira',
        subtitle: `${items.length} ativos${quoteTime ? ' - cotacoes de ' + quoteTime.toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'}) : ' - usando precos salvos'}`,
        actions: `<button class="btn btn-ghost" id="btn-refresh-quotes">&#x21bb; Atualizar</button>
                  <button class="btn btn-primary" id="btn-new-investimento">+ Novo Investimento</button>`,
        body: table({
          headers: ['Ticker','Tipo','Qtd','Preco Medio','Preco Atual','Valor Mercado','Resultado','Acoes'],
          rows: rowsList,
          emptyMsg: 'Nenhum investimento registrado. Adicione pelo catalogo abaixo.'
        })
      })}
      ${catalogCard()}
      ${buildSimulator(items)}
    </div>
  `;
}

function buildSummary(summary, items) {
  let mv = 0, cost = 0;
  items.forEach(i => { const p = livePrice(i); mv += p * Number(i.quantity); cost += Number(i.avgPrice) * Number(i.quantity); });
  if (!items.length) { mv = Number(summary.patrimonioInvestido||0); cost = Number(summary.custoTotal||0); }
  const result = mv - cost;
  const pct = cost > 0 ? (result/cost)*100 : 0;
  return `<div class="stats-grid">
    ${statCard('Patrimonio Investido', formatCurrency(mv), ICONS.wallet, 'var(--primary)')}
    ${statCard('Custo Total', formatCurrency(cost), ICONS.coins, 'var(--text-muted)')}
    ${statCard('Resultado', formatCurrency(result)+(pct>=0?' (+':' (')+pct.toFixed(2)+'%)', pct>=0?ICONS.trendUp:ICONS.trendDown, pct>=0?'var(--success)':'var(--danger)')}
    ${statCard('Aportes no Mes', formatCurrency(Number(summary.aportesMes||0)), ICONS.plus, 'var(--info)')}
  </div>`;
}

function statCard(title, value, icon, color) {
  return `<div class="stat-card" style="--stat-color:${color}"><div class="stat-icon">${icon}</div><div class="stat-content"><div class="stat-title">${title}</div><div class="stat-value">${value}</div></div></div>`;
}

function buildAllocData(items) {
  if (!items.length) return [];
  let byType = {};
  items.forEach(i => { const t = LABELS.investmentType[i.type]||i.type||'Outros'; byType[t] = (byType[t]||0) + livePrice(i)*Number(i.quantity); });
  return Object.keys(byType).map(k => ({ label: k, value: byType[k] }));
}

function quoteOf(t) { return liveQuotes[t] || null; }
function livePrice(item) { const q = quoteOf(item.ticker); return q && q.price != null ? Number(q.price) : Number(item.currentPrice); }



function buildRow(item) {
  const q = quoteOf(item.ticker);
  const price = livePrice(item);
  const qty = Number(item.quantity);
  const avg = Number(item.avgPrice);
  const mv = price * qty;
  const cost = avg * qty;
  const result = mv - cost;
  const rpct = cost > 0 ? (result/cost)*100 : 0;
  const priceHtml = q && q.price != null
    ? formatCurrency(price) + (q.changePercent != null ? `<span class="quote-change ${q.changePercent>=0?'up':'down'}">${q.changePercent>=0?'&#9650;':'&#9660;'} ${Math.abs(q.changePercent).toFixed(2)}%</span>` : '')
    : formatCurrency(price) + '<span class="quote-change saved">salvo</span>';
  const resultColor = result >= 0 ? 'var(--success)' : 'var(--danger)';
  const resultText = formatCurrency(result) + ' (' + (rpct>=0?'+':'') + rpct.toFixed(2) + '%)';
  return row([
    '<strong>' + escapeHtml(item.ticker) + '</strong>',
    LABELS.investmentType[item.type] || item.type,
    qty.toFixed(4).replace(/0+$/,'').replace(/\.$/,''),
    formatCurrency(avg),
    priceHtml,
    formatCurrency(mv),
    '<span style="color:' + resultColor + '">' + resultText + '</span>'
  ], `
    <button class="btn btn-ghost btn-sm" onclick="window._addAporte('${item.id}')" title="Novo aporte">+</button>
    <button class="btn btn-ghost btn-sm" onclick="window._editInvestimento('${item.id}')" title="Editar">${ICONS.edit}</button>
    <button class="btn btn-ghost btn-sm btn-danger" onclick="window._deleteInvestimento('${item.id}')" title="Excluir">${ICONS.trash}</button>
  `);
}



/* ==================== CATALOGO ==================== */

function catalogCard() {
  return card({
    title: 'Catalogo de Ativos',
    subtitle: 'Acoes, FIIs, ETFs (B3) e acoes dos EUA - adicione direteamente a carteira',
    body: `
      <div class="catalog-controls">
        <div class="catalog-market-tabs">
          <button type="button" class="catalog-tab active" data-market="B3">B3</button>
          <button type="button" class="catalog-tab" data-market="US">EUA</button>
        </div>
        <div class="catalog-type-tabs">
          <button type="button" class="catalog-type active" data-type="ALL">Todos</button>
          <button type="button" class="catalog-type" data-type="ACOES">Acoes</button>
          <button type="button" class="catalog-type" data-type="FIIS">FIIs</button>
          <button type="button" class="catalog-type" data-type="ETFS">ETFs</button>
        </div>
        <div class="catalog-search">
          <input type="text" id="catalog-search-input" class="form-input" placeholder="Digite para buscar (ex: PET, VALE, HGLG...)">
        </div>
      </div>
      <div class="catalog-results" id="catalog-results">
        <div class="empty-state"><p>Digite acima para buscar ou veja os populares abaixo.</p></div>
      </div>
    `
  });
}

function onCatalogSearch() { doCatalogSearch(); }

function doCatalogSearch() {
  const input = document.getElementById('catalog-search-input');
  const q = input ? input.value.trim() : '';
  const results = document.getElementById('catalog-results');
  if (!results) return;

  if (!q) {
    // Mostrar ativos populares
    const popular = POPULAR[catalogMarket] || [];
    if (!popular.length) {
      results.innerHTML = '<div class="empty-state"><p>Nenhum ativo popular disponivel.</p></div>';
      return;
    }
    results.innerHTML = spinner('Carregando populares...');
    market.quotes(popular).then(quotes => {
      const items = popular.map(t => {
        const qq = quotes.find(q => q.ticker === t);
        return { ticker: t, name: t, type: guessType(t), price: qq && qq.price != null ? qq.price : null, changePercent: qq && qq.changePercent != null ? qq.changePercent : null, currency: catalogMarket === 'US' ? 'USD' : 'BRL', source: 'brapi' };
      }).filter(it => catalogType === 'ALL' || it.type === catalogType);
      catalogLastResults = items;
      renderCatalogResults(results, items);
    }).catch(() => {
      results.innerHTML = emptyState('Erro ao carregar ativos populares.', ICONS.alert);
    });
    return;
  }

  results.innerHTML = spinner('Buscando...');
  market.search(q, catalogMarket).then(items => {
    let filtered = items;
    if (catalogType !== 'ALL') filtered = items.filter(it => it.type === catalogType);
    catalogLastResults = filtered;
    renderCatalogResults(results, filtered);
  }).catch(() => {
    results.innerHTML = emptyState('Erro ao buscar ativos.', ICONS.alert);
  });
}

function renderCatalogResults(container, items) {
  if (!items.length) {
    container.innerHTML = '<div class="empty-state"><p>Nenhum ativo encontrado.</p></div>';
    return;
  }
  container.innerHTML = table({
    headers: ['Ticker','Nome','Tipo','Preco','Variacao','Acoes'],
    rows: items.map(it => {
      const priceStr = it.price != null ? (it.currency === 'USD' ? 'US$ ' + formatCurrency(it.price) : formatCurrency(it.price)) : '-';
      const changeStr = it.changePercent != null
        ? '<span class="quote-change ' + (it.changePercent >= 0 ? 'up' : 'down') + '">' + (it.changePercent >= 0 ? '&#9650;' : '&#9660;') + ' ' + Math.abs(it.changePercent).toFixed(2) + '%</span>'
        : '-';
      return row([
        '<strong>' + escapeHtml(it.ticker) + '</strong>',
        escapeHtml(it.name || it.ticker),
        it.type || '-',
        priceStr,
        changeStr
      ], `
        <button class="btn btn-ghost btn-sm" onclick="window._catalogDetail('${escapeHtml(it.ticker)}','${escapeHtml(it.name||it.ticker)}')">Ver</button>
        <button class="btn btn-primary btn-sm" onclick="window._catalogAdd('${escapeHtml(it.ticker)}','${escapeHtml(it.name||it.ticker)}','${it.type||'ACOES'}',${it.price!=null?it.price:'null'},'${it.currency||'BRL'}')">+ Adicionar</button>
      `);
    }),
    emptyMsg: 'Nenhum ativo encontrado.'
  });
}

function guessType(ticker) {
  if (/^[A-Z]{4}11$/.test(ticker)) return 'FIIS';
  if (/^[A-Z]{4}[3-9]$/.test(ticker)) return 'ACOES';
  if (/^[A-Z]{4}[1-2]$/.test(ticker)) return 'ACOES';
  if (/^[A-Z]{4}F$/.test(ticker)) return 'ACOES';
  if (/^(BOVA|SMAL|IVVB|XFIX|GOLD|ECOO|DIVO|ISUS|MATB|PIBB|QRVG|RECD|SLCY|SPXI|URPR|VRTA|WRLD|MSFT|AAPL|GOOGL|AMZN|TSLA|NVDA|META|NFLX|INTC|AMD|COIN|MSTR)/.test(ticker)) return 'ETFS';
  return 'ACOES';
}



async function showCatalogDetail(ticker, name) {
  const qq = (await market.quotes([ticker]))[0];
  const price = qq && qq.price != null ? qq.price : null;
  let hist = { data: [] };
  try { hist = await market.history(ticker, '6mo'); } catch {}
  const chartData = (hist.data || []).map(p => ({ label: formatDate(p.date), value: Number(p.close) }));
  const body = `
    <div class="detail-head">
      <div><h3>${escapeHtml(ticker)}</h3><p class="text-muted">${escapeHtml(name||'')}</p></div>
      <div class="detail-price">${price != null ? formatCurrency(price) : 'sem cotacao'}</div>
    </div>
    <div class="detail-chart">${lineChart(chartData, { height: 180 })}</div>
    <button class="btn btn-primary btn-block" onclick="window._catalogAdd('${escapeHtml(ticker)}','${escapeHtml(name||ticker)}','${guessType(ticker)}',${price!=null?price:'null'},'${qq&&qq.currency?qq.currency:'BRL'}')">+ Adicionar a minha carteira</button>
  `;
  document.getElementById('modal-catalog-detail')?.remove();
  document.body.insertAdjacentHTML('beforeend', modal({ id: 'modal-catalog-detail', title: name||ticker, content: body, footer: '<button class="btn btn-ghost" data-close="modal-catalog-detail">Fechar</button>' }));
  openModal('modal-catalog-detail');
}

function newInvestimentoFromCatalog(ticker, name, type, price, currency) {
  const m = document.getElementById('modal-catalog-detail');
  if (m) { closeModal('modal-catalog-detail'); m.remove(); }
  openInvestimentoModal('Adicionar a carteira - ' + ticker, buildFormInvestimento({ ticker, name, type, price: price||0, currency: currency||'BRL', catalog: true }));
  handleInvestimentoSubmit(null);
  setTimeout(() => {
    const amt = document.querySelector('#form-investimento [name="amount"]');
    const qty = document.querySelector('#form-investimento [name="quantity"]');
    const prc = document.querySelector('#form-investimento [name="currentPrice"]');
    if (amt && qty && prc) amt.addEventListener('input', () => { const a=Number(amt.value)||0, p=Number(prc.value)||0; qty.value = p>0?(a/p).toFixed(4):''; });
  }, 100);
}

function buildFormInvestimento(item = {}) {
  const fromCat = item?.catalog === true;
  const curPrice = item?.price || item?.currentPrice || item?.avgPrice || 0;
  const currency = item?.currency || 'BRL';  const priceLabel = currency === 'USD' ? 'Preco atual (US$)' : 'Preco atual (R$)';
  return `
    <form id="form-investimento">
      <div class="form-group"><label>Ticker</label><input type="text" name="ticker" class="form-input" required value="${escapeHtml(item.ticker||'')}" ${fromCat?'readonly':''}></div>
      <div class="form-group"><label>Nome</label><input type="text" name="name" class="form-input" required value="${escapeHtml(item.name||'')}" ${fromCat?'readonly':''}></div>
      <div class="form-group"><label>Tipo</label>${selectEnum('type', LABELS.investmentType, item.type||'', false)}</div>
      <div class="form-group"><label>${priceLabel}</label><input type="number" name="currentPrice" class="form-input" required min="0.01" step="0.01" value="${curPrice}" ${fromCat?'readonly':''}></div>
      <div class="form-group"><label>Valor investido (R$)</label><input type="number" name="amount" class="form-input" required min="0.01" step="0.01" value="${item.amount||''}"></div>
      <div class="form-group"><label>Quantidade (calculada automaticamente)</label><input type="number" name="quantity" class="form-input" required min="0.0001" step="0.0001" value="${item.quantity||''}" readonly><div class="form-hint">Quantidade = Valor investido / Preco atual</div></div>
      <button type="submit" class="btn btn-primary btn-block">${item.id?'Atualizar':'Guardar'}</button>
    </form>
  `;
}

function openInvestimentoModal(title, formHtml) {
  document.getElementById('modal-investimento')?.remove();
  document.body.insertAdjacentHTML('beforeend', modal({ id: 'modal-investimento', title: title, content: formHtml, footer: '<button class="btn btn-ghost" data-close="modal-investimento">Cancelar</button>' }));
  openModal('modal-investimento');
}

function handleInvestimentoSubmit(id) {
  document.getElementById('form-investimento').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    if (btn && btn.dataset.submitting) return;
    if (btn) { btn.dataset.submitting = '1'; btn.disabled = true; }
    const fd = new FormData(e.target);
    const currentPrice = Number(fd.get('currentPrice'));
    const amount = Number(fd.get('amount'));
    const quantity = currentPrice > 0 ? amount / currentPrice : Number(fd.get('quantity'));
    const data = { ticker: fd.get('ticker'), name: fd.get('name'), type: fd.get('type'), quantity: quantity, avgPrice: currentPrice, currentPrice: currentPrice };
    try {
      if (id) { await investments.update(id, data); showToast('Investimento atualizado!', 'success'); }
      else { await investments.create(data); showToast('Investimento criado!', 'success'); }
      closeModal('modal-investimento');
      document.getElementById('modal-investimento').remove();
      renderInvestimentos(document.getElementById('content'));
    } catch (err) { showToast(err.message, 'error'); } finally { if (btn) { btn.dataset.submitting = ''; btn.disabled = false; } }
  });
}

function newInvestimento() {
  openInvestimentoModal('Novo Investimento', buildFormInvestimento());
  setTimeout(() => {
    const amt = document.querySelector('#form-investimento [name="amount"]');
    const qty = document.querySelector('#form-investimento [name="quantity"]');
    const prc = document.querySelector('#form-investimento [name="currentPrice"]');
    if (amt && qty && prc) {
      const calc = () => { const a=Number(amt.value)||0, p=Number(prc.value)||0; qty.value = p>0?(a/p).toFixed(4):''; };
      amt.addEventListener('input', calc);
      prc.addEventListener('input', calc);
    }
  }, 100);
  handleInvestimentoSubmit(null);
}

async function editInvestimento(id) {
  try { const item = await investments.get(id); openInvestimentoModal('Editar Investimento', buildFormInvestimento(item)); handleInvestimentoSubmit(id); }
  catch (err) { showToast(err.message, 'error'); }
}

async function addAporte(id) {
  const formHtml = '<form id="form-aporte"><div class="form-group"><label>Valor do Aporte</label><input type="number" name="amount" class="form-input" required min="0.01" step="0.01" placeholder="0,00"></div><button type="submit" class="btn btn-primary btn-block">Adicionar</button></form>';
  document.getElementById('modal-aporte')?.remove();
  document.body.insertAdjacentHTML('beforeend', modal({ id: 'modal-aporte', title: 'Novo Aporte', content: formHtml, footer: '<button class="btn btn-ghost" data-close="modal-aporte">Cancelar</button>' }));
  openModal('modal-aporte');
  document.getElementById('form-aporte').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    if (btn && btn.dataset.submitting) return;
    if (btn) { btn.dataset.submitting = '1'; btn.disabled = true; }
    const fd = new FormData(e.target);
    try { await investments.addAporte(id, { amount: Number(fd.get('amount')) }); showToast('Aporte adicionado!', 'success'); closeModal('modal-aporte'); document.getElementById('modal-aporte').remove(); renderInvestimentos(document.getElementById('content')); }
    catch (err) { showToast(err.message, 'error'); } finally { if (btn) { btn.dataset.submitting = ''; btn.disabled = false; } }
  });
}

async function deleteInvestimento(id) {
  if (!confirm('Tem certeza que deseja excluir este investimento?')) return;
  try { await investments.delete(id); showToast('Investimento excluido.', 'success'); renderInvestimentos(document.getElementById('content')); }
  catch (err) { showToast(err.message, 'error'); }
}



/* ==================== SIMULADOR ==================== */

function buildSimulator(items) {
  let opts = '<option value="">? Selecione um ativo da carteira ?</option>';
  (items || []).forEach(i => { opts += '<option value="' + escapeHtml(i.ticker) + '">' + escapeHtml(i.ticker + ' (' + (LABELS.investmentType[i.type]||i.type) + ')') + '</option>'; });
  return card({
    title: 'Simulador de Investimento',
    subtitle: 'Rentabilidade ancorada em dados reais (CDI ou historico do ativo)',
    body: `
      <div class="simulator-grid">
        <div class="form-group"><label>Ativo de referencia</label><select id="sim-ticker" class="form-select">${opts}</select></div>
        <div class="form-group"><label>Aporte inicial (R$)</label><input type="number" id="sim-initial" class="form-input" min="0" step="0.01" value="1000"></div>
        <div class="form-group"><label>Aporte mensal (R$)</label><input type="number" id="sim-monthly" class="form-input" min="0" step="0.01" value="500"></div>
        <div class="form-group"><label>Rentabilidade anual (%)</label><div class="sim-rate-row"><input type="number" id="sim-rate" class="form-input" min="0" max="100" step="0.01" value="13.9"><button type="button" class="btn btn-ghost btn-sm" id="btn-sim-cdi">Usar CDI</button></div></div>
        <div class="form-group"><label>Prazo (anos)</label><input type="number" id="sim-years" class="form-input" min="1" max="50" step="1" value="10"></div>
      </div>
      <div class="sim-hint" id="sim-hint">Dica: escolha um ativo para calcular o retorno real dele nos ultimos 12 meses.</div>
      <div class="simulator-results" id="sim-results"></div>
      <div id="sim-chart"></div>
    `
  });
}

function computeSimulation(initial, monthly, annualRate, years) {
  const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
  const totalMonths = years * 12;
  let accumulated = initial, totalInvested = initial;
  const data = [];
  for (let m = 1; m <= totalMonths; m++) {
    accumulated = accumulated * (1 + monthlyRate) + monthly;
    totalInvested += monthly;
    if (m % 12 === 0 || m === totalMonths) data.push({ label: (m/12) + 'a', invested: totalInvested, accumulated: accumulated });
  }
  return { data, totalInvested, finalValue: accumulated, interest: accumulated - totalInvested };
}

function initSimulator() {
  const simTick = document.getElementById('sim-ticker');
  const simInit = document.getElementById('sim-initial');
  const simMonth = document.getElementById('sim-monthly');
  const simRate = document.getElementById('sim-rate');
  const simYears = document.getElementById('sim-years');
  const simCdi = document.getElementById('btn-sim-cdi');

  function runSim() {
    const initial = Number(simInit.value) || 0;
    const monthly = Number(simMonth.value) || 0;
    const rate = Number(simRate.value) || 0;
    const years = Number(simYears.value) || 1;
    const result = computeSimulation(initial, monthly, rate, years);
    const results = document.getElementById('sim-results');
    const chart = document.getElementById('sim-chart');
    if (!results || !chart) return;
    results.innerHTML = `
      <div class="sim-result-card"><div class="sim-result-label">Total Investido</div><div class="sim-result-value">${formatCurrency(result.totalInvested)}</div></div>
      <div class="sim-result-card"><div class="sim-result-label">Juros Ganhos</div><div class="sim-result-value" style="color:var(--success)">${formatCurrency(result.interest)}</div></div>
      <div class="sim-result-card"><div class="sim-result-label">Valor Final</div><div class="sim-result-value" style="color:var(--primary)">${formatCurrency(result.finalValue)}</div></div>
    `;
    const chartData = result.data.map(d => ({ label: d.label, value: d.accumulated }));
    chart.innerHTML = '<div style="margin-top:16px;margin-bottom:8px;font-size:14px;font-weight:600">Evolucao do Patrimonio</div>' + lineChart(chartData, { height: 200 });
  }

  function loadAssetReturn(ticker) {
    if (!ticker) { runSim(); return; }
    market.history(ticker, '1y').then(hist => {
      const d = hist.data || [];
      if (d.length >= 2) {
        const first = Number(d[0].close);
        const last = Number(d[d.length-1].close);
        if (first > 0) {
          const ret = (Math.pow(last/first, 1) - 1) * 100;
          simRate.value = ret.toFixed(2);
          const hint = document.getElementById('sim-hint');
          if (hint) hint.textContent = 'Retorno anual calculado do historico de ' + d.length + ' dias de ' + ticker + ': ' + (ret>=0?'+':'') + ret.toFixed(2) + '%';
        }
      }
      runSim();
    }).catch(() => runSim());
  }

  if (simTick) simTick.addEventListener('change', () => loadAssetReturn(simTick.value));
  if (simInit) simInit.addEventListener('input', debounce(runSim, 200));
  if (simMonth) simMonth.addEventListener('input', debounce(runSim, 200));
  if (simRate) simRate.addEventListener('input', debounce(runSim, 200));
  if (simYears) simYears.addEventListener('input', debounce(runSim, 200));
  if (simCdi) simCdi.addEventListener('click', async () => {
    try {
      const quotes = await market.quotes(['CDI']);
      const cdi = quotes.find(q => q.ticker === 'CDI');
      if (cdi && cdi.price != null) { simRate.value = Number(cdi.price).toFixed(2); const hint=document.getElementById('sim-hint'); if(hint) hint.textContent='CDI atual: '+Number(cdi.price).toFixed(2)+'% a.a.'; runSim(); }
    } catch {}
  });

  runSim();
}



/* ==================== EVENTOS ==================== */

function bindEvents(container) {
  window._editInvestimento = (id) => editInvestimento(id);
  window._deleteInvestimento = (id) => deleteInvestimento(id);
  window._addAporte = (id) => addAporte(id);
  window._catalogAdd = (ticker, name, type, price, currency) => newInvestimentoFromCatalog(ticker, name, type, price, currency);
  window._catalogDetail = (ticker, name) => showCatalogDetail(ticker, name);

  const btnNew = document.getElementById('btn-new-investimento');
  const btnRefresh = document.getElementById('btn-refresh-quotes');
  const searchInput = document.getElementById('catalog-search-input');
  const typeSelect = document.getElementById('catalog-market');

  if (btnNew) btnNew.addEventListener('click', () => newInvestimento());
  if (btnRefresh) btnRefresh.addEventListener('click', () => renderInvestimentos(container));
  if (searchInput) searchInput.addEventListener('input', debounce(onCatalogSearch, 400));

  // Tabs de mercado
  document.querySelectorAll('.catalog-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.catalog-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      catalogMarket = tab.dataset.market;
      doCatalogSearch();
    });
  });

  // Tabs de tipo
  document.querySelectorAll('.catalog-type').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.catalog-type').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      catalogType = tab.dataset.type;
      doCatalogSearch();
    });
  });

  initSimulator();
}
