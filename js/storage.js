// ============================================================
// js/storage.js — 数据持久化
// 依赖：js/utils.js（formatNow）
// ============================================================

const STORAGE_KEY = 'my_todo_list_v2_1';
const SUMMARY_CHAR_THRESHOLD = 120;  // 备注超过 120 字符触发 AI 总结
let todos = [];
let todoMap = new Map();

// ---- localStorage 读写 ----
function syncTodoMap() {
  todoMap = new Map(todos.map(t => [t.id, t]));
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  syncTodoMap();
}

function loadTodos() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) { todos = []; syncTodoMap(); return; }
  try {
    todos = JSON.parse(raw).map(migrateTodo);
  } catch (e) {
    todos = [];
  }
  syncTodoMap();
}

// ---- 数据迁移：兼容旧版字段 ----
function migrateTodo(t) {
  let ddlType     = t.ddlType ?? 'long-term';
  let ddlDatetime = t.ddlDatetime ?? null;

  // 旧版 "weekly" 格式 → 转为下一个匹配的日期时间
  if (ddlType === 'weekly' && !ddlDatetime) {
    const day  = t.ddlDay ?? 1;
    const hour = t.ddlHour ?? 9;
    const min  = t.ddlMinute ?? 0;
    const now  = new Date();
    const jsDay = day === 7 ? 0 : day;  // 1(周一)~7(周日) → 0(周日)~6(周六)
    const target = new Date(now);
    target.setHours(hour, min, 0, 0);
    let daysUntil = jsDay - now.getDay();
    if (daysUntil < 0 || (daysUntil === 0 && now >= target)) daysUntil += 7;
    target.setDate(target.getDate() + daysUntil);
    ddlType     = 'datetime';
    ddlDatetime = target.toISOString().slice(0, 16);  // "2026-05-25T14:30"
  }

  return {
    id:          t.id          ?? Date.now(),
    text:        t.text        ?? '',
    completed:   t.completed   ?? false,
    completedAt: t.completedAt ?? null,
    createdAt:   t.createdAt   ?? formatNow(),
    ddlType:     ddlType,
    ddlDatetime: ddlDatetime,
    notes:       t.notes       ?? '',
    notesSummary: t.notesSummary ?? '',
    assignee:    t.assignee    ?? '',
    department:  t.department  ?? '',
    responsible: t.responsible ?? ''
  };
}
