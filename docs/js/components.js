/* FinControl — componentes de UI reutilizáveis. */
import { formatCurrency, formatDate, escapeHtml } from './utils.js';
import { ICONS } from './icons.js';

export function statCard({ icon, label, value, sub, color = 'blue' }) {
  var subHtml = sub ? '<div class="stat-card-trend ' + (sub.startsWith('+') ? 'up' : 'down') + '">' + escapeHtml(sub) + '</div>' : '';
  return '<div class="stat-card">' +
    '<div class="stat-card-header">' +
      '<div class="stat-card-icon ' + color + '">' + icon + '</div>' +
      subHtml +
    '</div>' +
    '<div class="stat-card-label">' + escapeHtml(label) + '</div>' +
    '<div class="stat-card-value">' + value + '</div>' +
  '</div>';
}

export function card({ title, subtitle, actions, body, classes = '' }) {
  var titleHtml = title ? '<h3 class="card-title">' + escapeHtml(title) + '</h3>' : '';
  var subtitleHtml = subtitle ? '<p class="card-subtitle">' + escapeHtml(subtitle) + '</p>' : '';
  var actionsHtml = actions ? '<div class="card-actions">' + actions + '</div>' : '';
  return '<div class="card ' + classes + '">' +
    '<div class="card-header"><div>' + titleHtml + subtitleHtml + '</div>' + actionsHtml + '</div>' +
    '<div class="card-body">' + body + '</div></div>';
}

export function table({ headers, rows, emptyMsg = 'Nenhum dado encontrado.' }) {
  var rowsArr = Array.isArray(rows) ? rows : (rows ? [rows] : []);
  if (rowsArr.length === 0) {
    return '<div class="empty-state"><p>' + emptyMsg + '</p></div>';
  }
  var headerHtml = headers.map(function(h) { return '<th>' + escapeHtml(h) + '</th>'; }).join('');
  return '<div class="table-wrapper"><table class="data-table">' +
    '<thead><tr>' + headerHtml + '</tr></thead>' +
    '<tbody>' + rowsArr.join('') + '</tbody></table></div>';
}

export function row(cells, actions) {
  var cellsHtml = cells.map(function(c) { return '<td>' + c + '</td>'; }).join('');
  var actionsHtml = actions ? '<td class="cell-actions">' + actions + '</td>' : '';
  return '<tr>' + cellsHtml + actionsHtml + '</tr>';
}

export function actionButton(label, onClick, icon) {
  icon = icon || '';
  return '<button class="btn btn-ghost btn-sm" onclick="' + onClick + '">' + icon + ' ' + escapeHtml(label) + '</button>';
}

export function modal({ id, title, content, footer }) {
  var footerHtml = footer ? '<div class="modal-footer">' + footer + '</div>' : '';
  return '<div class="modal-overlay" id="' + id + '"><div class="modal">' +
    '<div class="modal-header"><h3>' + escapeHtml(title) + '</h3>' +
    '<button class="modal-close" data-close="' + id + '">&times;</button></div>' +
    '<div class="modal-body">' + content + '</div>' + footerHtml +
    '</div></div>';
}


export function openModal(id) {
  var el = document.getElementById(id);
  if (el) { el.classList.add('show'); document.body.style.overflow = 'hidden'; }
}

export function closeModal(id) {
  var el = document.getElementById(id);
  if (el) { el.classList.remove('show'); document.body.style.overflow = ''; el.remove(); }
}

export function closeAllModals() {
  document.querySelectorAll('.modal-overlay.show').forEach(function(m) { m.classList.remove('show'); });
  document.body.style.overflow = '';
}

/* ==================== GRÁFICOS ==================== */

// Paleta da identidade (usa --primary, nunca --accent que não existe).
var CHART_COLORS = ['var(--primary)', 'var(--success)', 'var(--warning)', 'var(--danger)', '#8b5cf6', '#06b6d4', '#ec4899', '#f59e0b'];
function fmt(n) { return formatCurrency(n); }
function shortNumber(n) {
  var a = Math.abs(n);
  if (a >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (a >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (a >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  return String(Math.round(n));
}

export function barChart(data, opts) {
  opts = opts || {};
  var height = opts.height || 200;
  var color = opts.color || 'var(--primary)';
  var format = opts.format || fmt;
  var negative = opts.negative || false;
  if (!data || data.length === 0) return '<div class="empty-state"><p>Sem dados para exibir.</p></div>';

  var values = data.map(function(d) { return Number(d.value) || 0; });
  var max = Math.max.apply(null, values.map(Math.abs));
  if (max === 0) return '<div class="empty-state"><p>Sem dados para exibir.</p></div>';

  var grid = '';
  for (var g = 0; g <= 4; g++) {
    grid += '<div class="bar-grid-line" style="bottom:' + (g * 25) + '%"></div>';
  }

  var bars = data.map(function(d) {
    var v = Number(d.value) || 0;
    var h = (Math.abs(v) / max) * 100;
    var barColor = negative ? (v >= 0 ? 'var(--success)' : 'var(--danger)') : color;
    return '<div class="bar-item" style="width:' + (100 / data.length).toFixed(2) + '%" title="' + escapeHtml(d.label) + ': ' + format(v) + '">' +
      '<div class="bar" style="height:' + h + '%;background:' + barColor + '">' +
        '<span class="bar-value">' + format(v) + '</span>' +
      '</div>' +
      '<span class="bar-label">' + escapeHtml(d.label) + '</span>' +
    '</div>';
  }).join('');

  return '<div class="bar-chart" style="min-height:' + height + 'px">' + grid + bars + '</div>';
}


export function lineChart(data, opts) {
  opts = opts || {};
  var height = opts.height || 220;
  var color = opts.color || 'var(--primary)';
  var format = opts.format || fmt;
  var fill = opts.fill !== false;
  if (!data || data.length < 2) return '<div class="empty-state"><p>Sem dados suficientes.</p></div>';

  var values = data.map(function(d) { return Number(d.value) || 0; });
  var max = Math.max.apply(null, values);
  var min = Math.min.apply(null, values);
  var range = (max - min) || Math.max(1, Math.abs(max) * 0.1);

  var W = 800, H = 200; // viewBox 800x200 (razao 4:1, preenche sem deformar)
  var padL = 38, padR = 12, padT = 8, padB = 18;
  var chartW = W - padL - padR;
  var chartH = H - padT - padB;

  function x(i) { return padL + (i / (values.length - 1)) * chartW; }
  function y(v) { return padT + chartH - ((v - min) / range) * chartH; }

  var pts = values.map(function(v, i) { return x(i) + ',' + y(v).toFixed(2); }).join(' ');
  var areaPts = padL + ',' + (padT + chartH) + ' ' + pts + ' ' + (padL + chartW) + ',' + (padT + chartH);

  var grid = '';
  for (var g = 0; g <= 4; g++) {
    var gy = padT + chartH - (g / 4) * chartH;
    var gv = min + (range * (g / 4));
    grid += '<line class="chart-grid-h" x1="' + padL + '" y1="' + gy + '" x2="' + (padL + chartW) + '" y2="' + gy + '"/>' +
      '<text class="chart-axis-y" x="0" y="' + (gy + 4) + '">' + shortNumber(gv) + '</text>';
  }

  var circles = data.map(function(d, i) {
    return '<g class="chart-dot">' +
      '<circle cx="' + x(i) + '" cy="' + y(values[i]).toFixed(2) + '" r="3.2"/>' +
      '<title>' + escapeHtml(d.label) + ': ' + format(values[i]) + '</title>' +
    '</g>';
  }).join('');

  var labels = data.map(function(d, i) {
    var step = Math.ceil(data.length / 8);
    var skip = data.length > 8 && i % step !== 0 && i !== data.length - 1;
    if (skip) return '<span style="visibility:hidden">' + escapeHtml(d.label) + '</span>';
    return '<span>' + escapeHtml(d.label) + '</span>';
  }).join('');

  return '<div class="line-chart">' +
    '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">' +
      (fill ? '<polygon class="chart-area" points="' + areaPts + '"/>' : '') +
      grid +
      '<polyline class="chart-line" points="' + pts + '" stroke="' + color + '"/>' +
      circles +
    '</svg>' +
    '<div class="line-labels">' + labels + '</div>' +
  '</div>';
}

export function badge(text, type) {
  type = type || 'default';
  return '<span class="badge badge-' + type + '">' + escapeHtml(text) + '</span>';
}

export function selectEnum(name, enumObj, selected, includeEmpty) {
  selected = selected || '';
  includeEmpty = includeEmpty !== false;
  var options = Object.keys(enumObj).map(function(k) {
    var sel = k === selected ? ' selected' : '';
    return '<option value="' + k + '"' + sel + '>' + enumObj[k] + '</option>';
  }).join('');
  var empty = includeEmpty ? '<option value="">Todos</option>' : '';
  return '<select name="' + name + '" id="' + name + '" class="form-select">' + empty + options + '</select>';
}

export function spinner(text) {
  text = text || 'A carregar...';
  return '<div class="spinner-container"><div class="spinner"></div><span>' + escapeHtml(text) + '</span></div>';
}

export function emptyState(message, icon) {
  message = message || 'Nenhum dado encontrado.';
  icon = icon || ICONS.inbox;
  return '<div class="empty-state"><span class="empty-icon">' + icon + '</span><p>' + escapeHtml(message) + '</p></div>';
}

export function progressBar(current, max, color) {
  color = color || 'var(--primary)';
  var pct = max > 0 ? Math.min(100, (Number(current) / Number(max)) * 100) : 0;
  return '<div class="progress-bar">' +
    '<div class="progress-fill" style="width:' + pct + '%;background:' + color + '"></div>' +
    '<span class="progress-text">' + pct.toFixed(0) + '%</span></div>';
}

export function donutChart(data, opts) {
  opts = opts || {};
  var height = opts.height || 200;
  var size = opts.size || 160;
  var format = opts.format || fmt;
  if (!data || data.length === 0) return '<div class="empty-state"><p>Sem dados para exibir.</p></div>';

  var total = data.reduce(function(s, d) { return s + (Number(d.value) || 0); }, 0);
  if (total === 0) return '<div class="empty-state"><p>Sem dados para exibir.</p></div>';

  var radius = size / 2, thickness = 18, c = 2 * Math.PI * radius;
  var offset = 0;

  var segments = data.map(function(d, i) {
    var v = Number(d.value) || 0;
    var frac = v / total;
    var dash = frac * c;
    var color = d.color || CHART_COLORS[i % CHART_COLORS.length];
    var seg = '<circle class="donut-seg" cx="' + radius + '" cy="' + radius + '" r="' + radius + '" ' +
      'fill="none" stroke="' + color + '" stroke-width="' + thickness + '" ' +
      'stroke-dasharray="' + dash.toFixed(1) + ' ' + (c - dash).toFixed(1) + '" ' +
      'stroke-dashoffset="' + (-offset).toFixed(1) + '" ' +
      'transform="rotate(-90 ' + radius + ' ' + radius + ')">' +
      '<title>' + escapeHtml(d.label) + ': ' + format(v) + ' (' + (frac * 100).toFixed(1) + '%)</title></circle>';
    offset += dash;
    return seg;
  }).join('');

  var legend = data.map(function(d, i) {
    var v = Number(d.value) || 0;
    var frac = total > 0 ? (v / total) * 100 : 0;
    var color = d.color || CHART_COLORS[i % CHART_COLORS.length];
    return '<div class="donut-legend-item">' +
      '<span class="donut-legend-dot" style="background:' + color + '"></span>' +
      '<span class="donut-legend-label">' + escapeHtml(d.label) + '</span>' +
      '<span class="donut-legend-value">' + format(v) + ' (' + frac.toFixed(1) + '%)</span>' +
    '</div>';
  }).join('');

  return '<div class="donut-chart" style="min-height:' + height + 'px">' +
    '<div class="donut"><svg viewBox="0 0 ' + size + ' ' + size + '" class="donut-svg">' +
      '<circle class="donut-bg" cx="' + radius + '" cy="' + radius + '" r="' + radius + '" fill="none" stroke-width="' + thickness + '"/>' +
      segments +
      '<text class="donut-center" x="' + radius + '" y="' + (radius - 2) + '" text-anchor="middle">' + shortNumber(total) + '</text>' +
      '<text class="donut-center-sub" x="' + radius + '" y="' + (radius + 12) + '" text-anchor="middle">Total</text>' +
    '</svg></div>' +
    '<div class="donut-legend">' + legend + '</div>' +
  '</div>';
}
