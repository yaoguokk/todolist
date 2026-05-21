// ============================================================
// js/utils.js — 工具函数（零依赖）
// ============================================================

// ---- 工具：生成当前时间字符串 ----
function formatNow() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ---- 工具：HTML 转义 ----
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---- Toast 通知系统 ----
function showToast(type, title, message, duration = 4000) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-title">${escapeHTML(title)}</div>
    <div class="toast-message">${escapeHTML(message)}</div>
  `;
  container.appendChild(toast);

  // 自动消失
  setTimeout(() => {
    toast.style.animation = 'toast-out 0.3s ease-out forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ---- 工具：ISO datetime-local 字符串转显示格式 ----
function formatDatetime(isoStr) {
  if (!isoStr) return '';
  // isoStr 格式："2026-05-25T14:30"
  const [date, time] = isoStr.split('T');
  const [, month, day] = date.split('-');
  return `${month}-${day} ${time}`;
}

// ---- DDL 日期计算 ----
function getDeadline(todo) {
  if (todo.ddlType !== 'datetime' || !todo.ddlDatetime) return null;
  // 显式解析本地时间，避免 new Date('YYYY-MM-DDTHH:MM') 在不同浏览器中不一致
  const [datePart, timePart] = todo.ddlDatetime.split('T');
  if (!datePart) return null;
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh = 0, mm = 0] = (timePart || '0:0').split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm);
}

function getCountdownText(todo) {
  const deadline = getDeadline(todo);
  if (!deadline) return '长期';

  const diff = deadline - new Date();
  if (diff <= 0) return '已过期';

  const minutesTotal = Math.floor(diff / 60000);
  const days    = Math.floor(minutesTotal / 1440);
  const hours   = Math.floor((minutesTotal % 1440) / 60);
  const minutes = minutesTotal % 60;

  let text = '';
  if (days > 0)    text += `${days}天`;
  if (hours > 0)   text += `${hours}小时`;
  if (minutes > 0 || text === '') text += `${minutes}分钟`;
  return text;
}

function getUrgencyClass(todo) {
  const deadline = getDeadline(todo);
  if (!deadline) return 'countdown-normal';
  const diff = deadline - new Date();
  if (diff <= 0)                    return 'countdown-expired';
  if (diff < 60 * 60 * 1000)       return 'countdown-urgent';
  if (diff < 24 * 60 * 60 * 1000)  return 'countdown-warning';
  return 'countdown-normal';
}
