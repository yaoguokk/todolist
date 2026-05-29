// ============================================================
// js/app.js — 主应用逻辑
// 依赖：js/utils.js, js/storage.js
// ============================================================

// ============================================================
// 一、DOM 元素引用
// ============================================================
const todoInput         = document.getElementById('todoInput');
const notesInput        = document.getElementById('notesInput');
const inputDdlType      = document.getElementById('inputDdlType');
const inputDdlDatetime  = document.getElementById('inputDdlDatetime');
const addBtn            = document.getElementById('addBtn');
const todoListWrapper   = document.getElementById('todoListWrapper');
const incompleteList    = document.getElementById('incompleteList');
const completedList     = document.getElementById('completedList');
const incompleteSection = document.getElementById('incompleteSection');
const completedSection  = document.getElementById('completedSection');
const incompleteCount   = document.getElementById('incompleteCount');
const completedCount    = document.getElementById('completedCount');
const countNumber       = document.getElementById('countNumber');
const inputAssignee      = document.getElementById('inputAssignee');
const inputDepartment    = document.getElementById('inputDepartment');
const inputResponsible   = document.getElementById('inputResponsible');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const emptyHint         = document.getElementById('emptyHint');
const exportBtn         = document.getElementById('exportBtn');
const importBtn         = document.getElementById('importBtn');
const importFileInput   = document.getElementById('importFileInput');
const aiToggle          = document.getElementById('aiToggle');
const aiToggleLabel     = document.getElementById('aiToggleLabel');
const configStatus      = document.getElementById('configStatus');
const configWarn        = document.getElementById('configWarn');
const configFileInput   = document.getElementById('configFileInput');
const todaySummary      = document.getElementById('todaySummary');
const todaySummaryList  = document.getElementById('todaySummaryList');
const todayCount        = document.getElementById('todayCount');
// 截图识别
const imgRecogBtn       = document.getElementById('imgRecogBtn');
const recognizeModal    = document.getElementById('recognizeModal');
const modalClose        = document.getElementById('modalClose');
const modalPasteArea    = document.getElementById('modalPasteArea');
const modalPasteHint    = document.getElementById('modalPasteHint');
const modalImage        = document.getElementById('modalImage');
const modalFields       = document.getElementById('modalFields');
const modalLoading      = document.getElementById('modalLoading');
const modalRecognizeBtn = document.getElementById('modalRecognizeBtn');
const modalFillBtn      = document.getElementById('modalFillBtn');

// ============================================================
// 二、AI 配置 & DeepSeek API
// ============================================================
let aiConfig = { apiKey: null, fileEnabled: true };  // 从 config.json 读取
let imgRecogConfig = { enabled: false, provider: '', apiKey: '' };
let aiToggleEnabled = true;  // 页面开关状态

// ---- 加载 config.json ----
async function loadConfig() {
  aiConfig._fileLoaded = false;
  aiConfig._fileProtocol = (window.location.protocol === 'file:');
  try {
    const resp = await fetch('./config.json');
    if (resp.ok) {
      const cfg = await resp.json();
      aiConfig._fileLoaded = true;
      aiConfig.apiKey      = cfg.deepseekApiKey || null;
      aiConfig.fileEnabled = cfg.enableSummary !== false;
      // 图像识别配置（可选，可整个节点不存在）
      if (cfg.imageRecognition && cfg.imageRecognition.enabled && cfg.imageRecognition.apiKey) {
        imgRecogConfig = {
          enabled: true,
          provider: cfg.imageRecognition.provider || 'zhipu',
          apiKey: cfg.imageRecognition.apiKey
        };
      } else {
        imgRecogConfig = { enabled: false, provider: '', apiKey: '' };
      }
    }
  } catch (e) {
    // fetch 失败（file:// 协议或网络错误）
  }

  // 读取用户开关偏好
  const saved = localStorage.getItem('ai_toggle_enabled');
  if (saved !== null) aiToggleEnabled = (saved === 'true');

  updateConfigUI();
}

function isSummaryAvailable() {
  return aiConfig.apiKey && aiConfig.fileEnabled && aiToggleEnabled;
}

// ---- 更新配置相关 UI ----
function updateConfigUI() {
  const hasKey = !!aiConfig.apiKey;
  let statusText, statusClass, warnTip = '';

  if (hasKey && aiConfig.fileEnabled && aiToggleEnabled) {
    statusText  = 'AI 已配置';
    statusClass = 'config-status ok';
  } else if (!aiConfig._fileLoaded && aiConfig._fileProtocol) {
    statusText  = 'AI 未配置';
    statusClass = 'config-status off';
    warnTip     = '当前为 file:// 协议无法自动读取 config.json，请点击此处手动加载';
  } else if (!aiConfig._fileLoaded) {
    statusText  = 'AI 未配置';
    statusClass = 'config-status off';
    warnTip     = '未找到 config.json 文件，请创建配置文件';
  } else if (!hasKey) {
    statusText  = 'AI 未配置';
    statusClass = 'config-status off';
    warnTip     = 'config.json 中未找到 deepseekApiKey';
  } else if (!aiConfig.fileEnabled) {
    statusText  = 'AI 已关闭';
    statusClass = 'config-status off';
    warnTip     = 'config.json 中 enableSummary 为 false';
  } else if (!aiToggleEnabled) {
    statusText  = 'AI 已关闭';
    statusClass = 'config-status off';
    warnTip     = '页面底部 AI 总结开关已关闭';
  } else {
    statusText  = 'AI 未配置';
    statusClass = 'config-status off';
    warnTip     = 'AI 功能不可用，请检查配置';
  }

  configStatus.textContent = statusText;
  configStatus.className   = statusClass;

  // 惊叹号：仅在 AI 不完全可用时显示
  if (warnTip) {
    configWarn.style.display = 'inline-flex';
    configWarn.dataset.tip   = warnTip;
    const canClick = aiConfig._fileProtocol && !aiConfig._fileLoaded;
    configWarn.style.cursor = canClick ? 'pointer' : 'help';
    configStatus.style.cursor = canClick ? 'pointer' : 'default';
  } else {
    configWarn.style.display = 'none';
    configStatus.style.cursor = 'default';
  }

  // AI 开关：只有 config.json 加载成功且有 Key 时才显示
  aiToggleLabel.style.display = (aiConfig._fileLoaded && hasKey) ? 'flex' : 'none';
  aiToggle.checked = aiToggleEnabled;
  imgRecogBtn.style.display = 'inline-flex'; // 始终显示，未配置时弹窗内提示
}

// ---- 调用 DeepSeek API 总结备注 ----
async function summarizeNotes(notes) {
  if (!isSummaryAvailable()) return { summary: null, error: 'AI 功能未配置' };
  if (!notes || notes.length <= SUMMARY_CHAR_THRESHOLD) return { summary: null, error: null };

  try {
    const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiConfig.apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        messages: [
          { role: 'system', content: '你是一个任务概述助手。用不超过25个汉字总结用户提供的任务备注，必须保留任务主题和关键要求，去掉废话。只输出总结句子，不要加任何前缀或解释。' },
          { role: 'user', content: notes }
        ],
        max_tokens: 200,
        temperature: 0.3
      })
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      let errMsg = `请求失败 (${resp.status})`;
      if (resp.status === 401) errMsg = 'API Key 无效';
      else if (resp.status === 429) errMsg = 'API 请求频繁，稍后重试';
      else if (resp.status >= 500) errMsg = 'API 服务暂时不可用';
      return { summary: null, error: errMsg };
    }
    const data = await resp.json();
    const summary = data.choices?.[0]?.message?.content?.trim();
    return { summary: summary || null, error: null };
  } catch (e) {
    return { summary: null, error: '网络连接失败，请检查网络' };
  }
}

// ---- 为单个 todo 触发 AI 总结（异步，完成后局部更新 DOM） ----
async function triggerSummary(todo) {
  if (!isSummaryAvailable()) return;
  if (!todo.notes || todo.notes.length <= SUMMARY_CHAR_THRESHOLD) return;
  if (todo.notesSummary) return;

  const li = document.querySelector(`.todo-item[data-id="${todo.id}"]`);
  if (li) {
    const summaryRow = li.querySelector('.todo-summary-row');
    const summaryText = summaryRow?.querySelector('.summary-text');
    if (summaryText) summaryText.innerHTML = '<span class="summary-loading">AI 总结中…</span>';
  }

  const { summary, error } = await summarizeNotes(todo.notes);
  if (error) {
    showToast('error', 'AI 总结失败', error);
  }
  todo.notesSummary = summary || '';
  saveTodos();

  // 局部刷新该卡片的第三行
  if (li) updateTodoItemSummaryRow(li, todo);
}

// ============================================================
// 三、渲染函数
// ============================================================
function renderTodoList(animateNewItemId = null) {
  let incompleteHTML = '';
  let completedHTML = '';
  let activeCount = 0;
  let doneCount = 0;

  todos.forEach(todo => {
    if (!todo.completed) activeCount++; else doneCount++;

    const ddlDisplay = todo.ddlType === 'datetime' && todo.ddlDatetime
      ? '截止 ' + formatDatetime(todo.ddlDatetime)
      : '长期';
    const countdownText = getCountdownText(todo);
    const urgencyClass  = getUrgencyClass(todo);
    const isCompleted   = todo.completed ? ' completed' : '';
    const fadeIn        = todo.id === animateNewItemId ? ' fade-in' : '';

    // 第三行：备注概述
    let summaryHTML = '';
    const hasNotes = todo.notes && todo.notes.trim().length > 0;
    if (hasNotes) {
      const notesLen  = todo.notes.trim().length;
      const isLong    = notesLen > SUMMARY_CHAR_THRESHOLD;

      if (isLong && todo.notesSummary) {
        summaryHTML = `
          <span class="summary-ai-badge">AI</span>
          <span class="summary-text">${escapeHTML(todo.notesSummary)}</span>
          <button class="summary-expand-btn" data-action="expandNotes">展开原文 ▾</button>
          <div class="summary-full-text">${escapeHTML(todo.notes)}</div>`;
      } else if (isLong && !todo.notesSummary) {
        const preview = escapeHTML(todo.notes.trim().slice(0, 80));
        const canAI = isSummaryAvailable();
        summaryHTML = `
          <span class="summary-text">${preview}…</span>
          <button class="ai-trigger ${canAI ? 'active' : 'inactive'}"
                  data-action="triggerSummary"
                  ${canAI ? '' : 'disabled'}
                  title="${canAI ? '点击用 AI 总结此备注' : 'AI 总结功能未启用'}">✨ 总结</button>`;
      } else {
        summaryHTML = `<span class="summary-text">${escapeHTML(todo.notes)}</span>`;
      }
    }

    const itemHTML = `
      <li class="todo-item${isCompleted}${fadeIn}" data-id="${todo.id}">

        <!-- 第一行：复选框 + 标题 + 删除 -->
        <div class="todo-main-row">
          <input type="checkbox" data-action="toggle" ${todo.completed ? 'checked' : ''}>
          <span class="todo-text" data-action="edit-title">${escapeHTML(todo.text)}</span>
          <button class="delete-btn" data-action="delete" title="删除事项">&#10005;</button>
        </div>

        <!-- 第二行：生成时间 + 截止时间 + 倒计时 -->
        <div class="todo-meta-row">
          <span class="todo-timestamp">生成 ${escapeHTML(todo.createdAt)}</span>
          <span class="todo-ddl">${ddlDisplay}</span>
          <span class="todo-countdown ${urgencyClass}" data-countdown-id="${todo.id}">${escapeHTML(countdownText)}</span>
        </div>

        <!-- 第三行：备注概述（有备注才显示） -->
        <div class="todo-summary-row${hasNotes ? ' has-notes' : ''}" data-summary-id="${todo.id}">
          ${summaryHTML}
        </div>

        <!-- 展开详情 -->
        <button class="expand-toggle" data-action="expand">详情 ▾</button>

        <!-- 详情面板 -->
        <div class="todo-details">
          <!-- DDL 设置 -->
          <div class="field-group">
            <label>DDL设置</label>
            <select data-field="ddlType">
              <option value="long-term" ${todo.ddlType === 'long-term' ? 'selected' : ''}>长期</option>
              <option value="datetime"  ${todo.ddlType === 'datetime'  ? 'selected' : ''}>指定时间</option>
            </select>
            <input type="datetime-local" data-field="ddlDatetime"
                   value="${escapeHTML(todo.ddlDatetime || '')}"
                   style="${todo.ddlType !== 'datetime' ? 'display:none' : ''}">
          </div>

          <!-- 备注编辑 -->
          <div class="field-group">
            <label>备注</label>
            <textarea data-field="notes" placeholder="添加备注信息…">${escapeHTML(todo.notes || '')}</textarea>
          </div>

          <!-- 属性 -->
          <div class="attr-row">
            <input type="text" data-field="assignee"    placeholder="任务分配人" value="${escapeHTML(todo.assignee || '')}">
            <input type="text" data-field="department"  placeholder="责任部门"   value="${escapeHTML(todo.department || '')}">
            <input type="text" data-field="responsible"  placeholder="责任人"     value="${escapeHTML(todo.responsible || '')}">
          </div>
        </div>
      </li>`;

    if (todo.completed) {
      completedHTML += itemHTML;
    } else {
      incompleteHTML += itemHTML;
    }
  });

  incompleteList.innerHTML = incompleteHTML;
  completedList.innerHTML = completedHTML;

  // 分区显示/隐藏
  incompleteSection.style.display = activeCount === 0 && doneCount === 0 ? '' : '';
  completedSection.style.display = doneCount > 0 ? '' : 'none';
  incompleteCount.textContent = activeCount > 0 ? `(${activeCount})` : '';
  completedCount.textContent = doneCount > 0 ? `(${doneCount})` : '';

  // 绑定 datetime-local 的 change 监听（两个列表都要）
  todoListWrapper.querySelectorAll('[data-field="ddlDatetime"]').forEach(input => {
    input.addEventListener('change', function() {
      const itemLi = this.closest('.todo-item');
      if (!itemLi) return;
      const todoId = parseInt(itemLi.dataset.id);
      const targetTodo = todoMap.get(todoId);
      if (!targetTodo) return;
      targetTodo.ddlDatetime = this.value || null;
      saveTodos();
      updateTodoItemMeta(itemLi, targetTodo);
    });
  });

  countNumber.textContent = activeCount;
  emptyHint.style.display = todos.length === 0 ? 'block' : 'none';

  const hasCompleted = todos.some(t => t.completed);
  clearCompletedBtn.style.opacity    = hasCompleted ? '1' : '0.4';
  clearCompletedBtn.style.pointerEvents = hasCompleted ? 'auto' : 'none';
}

// ============================================================
// 3b. 今日总结模块
// ============================================================
function renderTodaySummary() {
  const d = new Date();
  const todayStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const todayCompleted = todos.filter(t =>
    t.completed && t.completedAt && t.completedAt.startsWith(todayStr)
  );

  if (todayCompleted.length === 0) {
    todaySummary.classList.remove('has-items');
    return;
  }

  todayCount.textContent = `(${todayCompleted.length})`;
  todaySummaryList.innerHTML = todayCompleted.map(t => {
    const time = t.completedAt.slice(11, 16) || '';
    return `
      <li class="today-summary-item" data-jump-id="${t.id}">
        <span class="item-check">✓</span>
        <span>${escapeHTML(t.text)}</span>
        ${time ? `<span class="item-time">${time}</span>` : ''}
        <button class="item-del" data-action="delete-today" data-delete-id="${t.id}" title="删除">✕</button>
      </li>`;
  }).join('');

  todaySummary.classList.add('has-items');
}

// 点击今日总结条目 → 跳转到列表中的对应卡片
function jumpToTodoItem(todoId) {
  // 确保完成分区可见
  completedSection.style.display = '';

  // 在列表中查找对应卡片
  const item = document.querySelector(`.todo-item[data-id="${todoId}"]`);
  if (!item) return;

  // 展开详情面板
  const details = item.querySelector('.todo-details');
  const toggle = item.querySelector('.expand-toggle');
  if (details && details.style.display !== 'block') {
    details.style.display = 'block';
    if (toggle) toggle.textContent = '收起 ▴';
  }

  // 滚动到卡片位置
  item.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // 高亮闪一下
  item.classList.remove('flash-highlight');
  void item.offsetWidth;
  item.classList.add('flash-highlight');
}

// ============================================================
// 四、增量 DOM 更新（避免重绘导致详情面板折叠）
// ============================================================

// ---- 4a. 更新单个卡片的第二行（DDL + 倒计时） ----
function updateTodoItemMeta(li, todo) {
  const ddlEl = li.querySelector('.todo-ddl');
  const cdEl  = li.querySelector('.todo-countdown');
  if (ddlEl) {
    ddlEl.textContent = todo.ddlType === 'datetime' && todo.ddlDatetime
      ? '截止 ' + formatDatetime(todo.ddlDatetime)
      : '长期';
  }
  if (cdEl) {
    cdEl.textContent = getCountdownText(todo);
    cdEl.className   = 'todo-countdown ' + getUrgencyClass(todo);
  }
}

// ---- 4b. 更新单个卡片的第三行（备注概述） ----
function updateTodoItemSummaryRow(li, todo) {
  const row = li.querySelector('.todo-summary-row');
  if (!row) return;

  const hasNotes = todo.notes && todo.notes.trim().length > 0;
  row.classList.toggle('has-notes', hasNotes);

  if (!hasNotes) {
    row.innerHTML = '';
    return;
  }

  const notesLen = todo.notes.trim().length;
  const isLong   = notesLen > SUMMARY_CHAR_THRESHOLD;

  if (isLong && todo.notesSummary) {
    row.innerHTML = `
      <span class="summary-ai-badge">AI</span>
      <span class="summary-text">${escapeHTML(todo.notesSummary)}</span>
      <button class="summary-expand-btn" data-action="expandNotes">展开原文 ▾</button>
      <div class="summary-full-text">${escapeHTML(todo.notes)}</div>`;
  } else if (isLong && !todo.notesSummary) {
    const preview = escapeHTML(todo.notes.trim().slice(0, 80));
    const canAI = isSummaryAvailable();
    row.innerHTML = `
      <span class="summary-text">${preview}…</span>
      <button class="ai-trigger ${canAI ? 'active' : 'inactive'}"
              data-action="triggerSummary"
              ${canAI ? '' : 'disabled'}
              title="${canAI ? '点击用 AI 总结此备注' : 'AI 总结功能未启用'}">✨ 总结</button>`;
  } else {
    row.innerHTML = `<span class="summary-text">${escapeHTML(todo.notes)}</span>`;
  }
}

// ---- 4c. 全局倒计时更新（每分钟） ----
function updateAllCountdowns() {
  document.querySelectorAll('.todo-countdown').forEach(el => {
    const todoId = parseInt(el.dataset.countdownId);
    const todo = todoMap.get(todoId);
    if (!todo) return;
    el.textContent = getCountdownText(todo);
    el.className = 'todo-countdown ' + getUrgencyClass(todo);
  });
}
let countdownTimer = setInterval(updateAllCountdowns, 60000);

// ============================================================
// 五、添加新事项
// ============================================================
function addTodo() {
  const text  = todoInput.value.trim();
  if (text === '') { todoInput.focus(); return; }

  const notes = notesInput.value.trim();

  const newTodo = {
    id:            Date.now(),
    text:          text,
    completed:     false,
    completedAt:   null,
    createdAt:     formatNow(),
    ddlType:       inputDdlType.value,
    ddlDatetime:   inputDdlDatetime.value || null,
    notes:         notes,
    notesSummary:  '',
    assignee:      inputAssignee.value.trim(),
    department:    inputDepartment.value.trim(),
    responsible:   inputResponsible.value.trim()
  };

  todos.unshift(newTodo);
  saveTodos();
  renderTodoList(newTodo.id);

  // 新建事项备注超过阈值时自动触发 AI 总结
  if (notes.length > SUMMARY_CHAR_THRESHOLD && isSummaryAvailable()) {
    triggerSummary(newTodo);
  }

  // 重置输入区
  todoInput.value  = '';
  notesInput.value = '';
  inputDdlType.value = 'long-term';
  inputDdlDatetime.value = '';
  inputDdlDatetime.style.display = 'none';
  inputAssignee.value = '';
  inputDepartment.value = '';
  inputResponsible.value = '';
  todoInput.focus();
}

// ============================================================
// 5b. 截图识别任务（弹窗模式）
// ============================================================

let pastedImageBase64 = '';       // 当前粘贴的图片 base64
let recognizedFields  = null;     // 识别结果

// ---- 弹窗 ----
function openRecognizeModal() {
  recognizeModal.classList.add('open');
  resetRecognizeModal();
  document.addEventListener('paste', onModalPaste);
}

function closeRecognizeModal() {
  recognizeModal.classList.remove('open');
  document.removeEventListener('paste', onModalPaste);
}

function resetRecognizeModal() {
  pastedImageBase64 = '';
  recognizedFields  = null;
  modalPasteHint.style.display = '';
  modalImage.style.display = 'none';
  modalImage.src = '';
  modalPasteArea.classList.remove('has-image');
  modalFields.style.display = 'none';
  modalFields.innerHTML = '';
  modalLoading.style.display = 'none';
  modalRecognizeBtn.disabled = true;
  modalFillBtn.style.display = 'none';
}

// ---- 粘贴事件（仅在弹窗打开时生效） ----
function onModalPaste(e) {
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault();
      const blob = item.getAsFile();
      const reader = new FileReader();
      reader.onload = () => {
        pastedImageBase64 = reader.result;
        modalImage.src = pastedImageBase64;
        modalImage.style.display = 'block';
        modalPasteHint.style.display = 'none';
        modalPasteArea.classList.add('has-image');
        modalRecognizeBtn.disabled = false;
        modalFields.style.display = 'none';
        modalFillBtn.style.display = 'none';
        recognizedFields = null;
      };
      reader.readAsDataURL(blob);
      return;
    }
  }
}

// 点击粘贴区域也可以重新粘贴（提示）
modalPasteArea.addEventListener('click', () => {
  // 触发票粘贴提示 - 不做复杂处理，用户直接用 Ctrl+V
});

// ---- Provider：智谱 GLM-4V-Flash ----
function buildZhipuRequest(base64Image) {
  return {
    model: 'glm-4v-flash',
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: base64Image } },
        { type: 'text', text: `今天是${new Date().toLocaleDateString('zh-CN')}。请从这张截图中提取任务信息，返回严格的JSON格式（不要markdown代码块，只要纯JSON）：
{
  "title": "任务标题（简洁概括，不超过30字）",
  "notes": "任务详细描述或备注（如无可为空字符串）",
  "assignee": "任务分配人（如无可为空字符串）",
  "department": "责任部门（如无可为空字符串）",
  "responsible": "责任人（如无可为空字符串）",
  "ddl": "截止时间，格式YYYY-MM-DDTHH:MM（如无可为空字符串）"
}
如果截图中没有任务相关信息，将所有字段设为空字符串。` }
      ]
    }],
    max_tokens: 300,
    temperature: 0.2
  };
}

function parseZhipuResponse(json) {
  try {
    let content = json.choices?.[0]?.message?.content?.trim() || '';
    // 去掉可能的 markdown 代码块包裹
    content = content.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
    const parsed = JSON.parse(content);
    return {
      title:       parsed.title       || '',
      notes:       parsed.notes       || '',
      assignee:    parsed.assignee    || '',
      department:  parsed.department  || '',
      responsible: parsed.responsible || '',
      ddl:         parsed.ddl         || ''
    };
  } catch (e) {
    console.warn('GLM-4V 返回非 JSON 内容:', json.choices?.[0]?.message?.content);
    return null;
  }
}

// ---- 弹窗内错误提示 ----
function showModalError(msg) {
  modalFields.style.display = 'block';
  modalFields.innerHTML = `<div class="modal-field-row"><span class="modal-field-empty">⚠️ ${msg}</span></div>`;
}

// ---- 调用 API 识别 ----
async function recognizeImage() {
  if (!pastedImageBase64) {
    showModalError('请先在虚线框中粘贴截图（Ctrl+V）');
    return;
  }
  if (!imgRecogConfig.enabled || !imgRecogConfig.apiKey) {
    showModalError('请先加载 config.json 配置文件（点击顶部 ⚠️ 图标手动加载）');
    return;
  }

  modalLoading.style.display = 'flex';
  modalRecognizeBtn.disabled = true;
  modalRecognizeBtn.textContent = '识别中…';
  modalFields.style.display = 'none';
  modalFillBtn.style.display = 'none';

  let errorMsg = null;
  try {
    const resp = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${imgRecogConfig.apiKey}`
      },
      body: JSON.stringify(buildZhipuRequest(pastedImageBase64))
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      console.error('智谱 API 错误:', resp.status, errText);
      errorMsg = `识别失败 (${resp.status})`;
      if (resp.status === 401) errorMsg = 'API Key 无效';
      else if (resp.status === 429) errorMsg = 'API 请求频繁，稍后重试';
      else if (resp.status >= 500) errorMsg = 'API 服务暂时不可用';
      recognizedFields = null;
    } else {
      const data = await resp.json();
      recognizedFields = parseZhipuResponse(data);
      if (!recognizedFields) {
        errorMsg = 'AI 返回数据格式异常';
      }
    }
  } catch (e) {
    console.error('识别请求失败:', e);
    errorMsg = '网络连接失败，请检查网络';
    recognizedFields = null;
  }

  modalLoading.style.display = 'none';
  modalRecognizeBtn.disabled = false;
  modalRecognizeBtn.textContent = '🔍 识别';

  if (errorMsg) {
    showToast('error', '截图识别失败', errorMsg);
    modalFields.style.display = 'block';
    modalFields.innerHTML = `<div class="modal-field-row"><span class="modal-field-empty">⚠️ ${errorMsg}</span></div>`;
  } else if (recognizedFields && Object.values(recognizedFields).some(v => v)) {
    showRecognizedFields(recognizedFields);
  } else {
    modalFields.style.display = 'block';
    modalFields.innerHTML = '<div class="modal-field-row"><span class="modal-field-empty">未能识别出任务信息，请尝试更清晰的截图</span></div>';
  }
}

// ---- 预览识别结果（可编辑） ----
function showRecognizedFields(fields) {
  modalFields.style.display = 'block';
  const labels = {
    title: '标题', notes: '备注', assignee: '分配人',
    department: '部门', responsible: '责任人', ddl: 'DDL'
  };
  let html = '';
  for (const [key, label] of Object.entries(labels)) {
    const value = fields[key] || '';
    if (key === 'notes') {
      html += `<div class="modal-field-row">
        <span class="modal-field-label">${label}</span>
        <textarea class="modal-field-input" data-recog-field="${key}" rows="2" placeholder="（未识别）">${escapeHTML(value)}</textarea>
      </div>`;
    } else if (key === 'ddl') {
      html += `<div class="modal-field-row">
        <span class="modal-field-label">${label}</span>
        <input class="modal-field-input" type="datetime-local" data-recog-field="${key}" value="${escapeHTML(value)}">
      </div>`;
    } else {
      html += `<div class="modal-field-row">
        <span class="modal-field-label">${label}</span>
        <input class="modal-field-input" type="text" data-recog-field="${key}" value="${escapeHTML(value)}" placeholder="（未识别）">
      </div>`;
    }
  }
  modalFields.innerHTML = html;
  modalFillBtn.style.display = 'inline-block';
}

// ---- 填入输入区（从弹窗可编辑字段读取） ----
function fillInputFields() {
  const getField = (key) => {
    const el = modalFields.querySelector(`[data-recog-field="${key}"]`);
    return el ? el.value.trim() : '';
  };

  const title       = getField('title');
  const notes       = getField('notes');
  const assignee    = getField('assignee');
  const department  = getField('department');
  const responsible = getField('responsible');
  const ddl         = getField('ddl');

  if (title)       todoInput.value = title;
  if (notes)       notesInput.value = notes;
  if (assignee)    inputAssignee.value = assignee;
  if (department)  inputDepartment.value = department;
  if (responsible) inputResponsible.value = responsible;
  if (ddl) {
    inputDdlType.value = 'datetime';
    inputDdlDatetime.style.display = '';
    inputDdlDatetime.value = ddl;
  }
  closeRecognizeModal();
  todoInput.focus();
}

// ---- 弹窗事件绑定 ----
imgRecogBtn.addEventListener('click', openRecognizeModal);
modalClose.addEventListener('click', closeRecognizeModal);
recognizeModal.addEventListener('click', (e) => {
  if (e.target === recognizeModal) closeRecognizeModal();
});
modalRecognizeBtn.addEventListener('click', recognizeImage);
modalFillBtn.addEventListener('click', fillInputFields);

// ============================================================
// 六、事件委托
// ============================================================

// ---- 今日总结点击跳转 ----
todaySummary.addEventListener('click', (e) => {
  // 删除按钮
  if (e.target.dataset.action === 'delete-today') {
    e.stopPropagation();
    const deleteId = parseInt(e.target.dataset.deleteId);
    if (deleteId) {
      todos = todos.filter(t => t.id !== deleteId);
      saveTodos();
      renderTodoList();
      renderTodaySummary();
    }
    return;
  }
  // 点击条目：跳转
  const item = e.target.closest('.today-summary-item');
  if (!item) return;
  const todoId = parseInt(item.dataset.jumpId);
  if (todoId) jumpToTodoItem(todoId);
});

// ---- 6a. 点击事件 ----
todoListWrapper.addEventListener('click', (e) => {
  const li  = e.target.closest('.todo-item');
  if (!li) return;
  const id  = parseInt(li.dataset.id);
  const todo = todoMap.get(id);
  if (!todo) return;

  const action = e.target.dataset.action;

  // 切换完成
  if (action === 'toggle') {
    todo.completed = e.target.checked;
    todo.completedAt = todo.completed ? formatNow() : null;
    saveTodos();
    renderTodoList();
    renderTodaySummary();
    return;
  }

  // 删除
  if (action === 'delete') {
    li.classList.add('fade-out');
    li.addEventListener('animationend', () => {
      todos = todos.filter(t => t.id !== id);
      saveTodos();
      renderTodoList();
    }, { once: true });
    return;
  }

  // 展开/收起详情
  if (action === 'expand') {
    const details = li.querySelector('.todo-details');
    const isOpen  = details.style.display === 'block';
    details.style.display = isOpen ? 'none' : 'block';
    e.target.textContent  = isOpen ? '详情 ▾' : '收起 ▴';
    return;
  }

  // 展开/收起原文（第三行）
  if (action === 'expandNotes') {
    const fullText = li.querySelector('.summary-full-text');
    if (!fullText) return;
    const isOpen = fullText.classList.toggle('open');
    e.target.textContent = isOpen ? '收起 ▲' : '展开原文 ▾';
    return;
  }

  // 行内编辑标题
  if (action === 'edit-title') {
    const span = e.target;
    const oldText = todo.text;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'todo-text-edit';
    input.value = oldText;
    input.maxLength = 200;
    span.replaceWith(input);
    input.focus();
    input.select();

    const save = () => {
      const newText = input.value.trim();
      if (newText && newText !== oldText) {
        todo.text = newText;
        saveTodos();
      }
      // 替换回 span
      const newSpan = document.createElement('span');
      newSpan.className = 'todo-text';
      newSpan.dataset.action = 'edit-title';
      newSpan.textContent = todo.text;
      input.replaceWith(newSpan);
    };

    input.addEventListener('blur', save);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
      if (e.key === 'Escape') { input.value = oldText; input.blur(); }
    });
    return;
  }

  // 触发 AI 总结
  if (action === 'triggerSummary') {
    if (!isSummaryAvailable()) return;
    const btn = e.target;
    btn.textContent = '总结中…';
    btn.disabled = true;
    triggerSummary(todo);
    return;
  }
});

// ---- 6b. 修改事件（详情面板中的表单控件） ----
todoListWrapper.addEventListener('change', (e) => {
  const li  = e.target.closest('.todo-item');
  if (!li) return;
  const id  = parseInt(li.dataset.id);
  const todo = todoMap.get(id);
  if (!todo) return;

  const field = e.target.dataset.field;
  if (!field) return;

  switch (field) {
    case 'ddlType':
      todo.ddlType = e.target.value;
      if (todo.ddlType === 'long-term') todo.ddlDatetime = null;
      const dtInput = li.querySelector('[data-field="ddlDatetime"]');
      if (dtInput) dtInput.style.display = todo.ddlType === 'datetime' ? '' : 'none';
      break;
    case 'ddlDatetime':
      todo.ddlDatetime = e.target.value || null;
      break;
    case 'notes': {
      const oldNotes = todo.notes;
      todo.notes = e.target.value;
      if (todo.notes.trim() !== (oldNotes || '').trim()) {
        todo.notesSummary = '';
      }
      break;
    }
    case 'assignee':
      todo.assignee = e.target.value;
      break;
    case 'department':
      todo.department = e.target.value;
      break;
    case 'responsible':
      todo.responsible = e.target.value;
      break;
  }

  saveTodos();

  // DDL 相关字段 → 增量更新第二行，不重绘（保持详情展开）
  if (field === 'ddlType' || field === 'ddlDatetime') {
    updateTodoItemMeta(li, todo);
    return;
  }

  // 备注字段 → 增量更新第三行，不重绘
  if (field === 'notes') {
    updateTodoItemSummaryRow(li, todo);
    return;
  }
});

// ---- 6c. focusout 事件（兜底 datetime-local 的 change 事件不可靠） ----
todoListWrapper.addEventListener('focusout', (e) => {
  const field = e.target.dataset.field;
  if (field !== 'ddlDatetime') return;

  const li = e.target.closest('.todo-item');
  if (!li) return;
  const id = parseInt(li.dataset.id);
  const todo = todoMap.get(id);
  if (!todo) return;

  const newValue = e.target.value || null;
  if (todo.ddlDatetime !== newValue) {
    todo.ddlDatetime = newValue;
    saveTodos();
    updateTodoItemMeta(li, todo);
  }
});

// ============================================================
// 七、清除已完成
// ============================================================
function clearCompleted() {
  const items = todoListWrapper.querySelectorAll('.todo-item.completed');
  if (items.length === 0) return;
  items.forEach(item => item.classList.add('fade-out'));
  const lastItem = items[items.length - 1];
  lastItem.addEventListener('animationend', () => {
    todos = todos.filter(t => !t.completed);
    saveTodos();
    renderTodoList();
    renderTodaySummary();
  }, { once: true });
}

// ============================================================
// 八、导出/导入
// ============================================================
function exportData() {
  const json = JSON.stringify(todos, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'todos-data.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data)) throw new Error('格式错误');
      todos = data.map(migrateTodo);
      saveTodos();
      renderTodoList();
      renderTodaySummary();
      alert(`成功导入 ${todos.length} 条待办事项！`);
    } catch (err) {
      alert('导入失败：文件格式不正确。');
    }
  };
  reader.readAsText(file);
}

async function tryAutoLoadJSON() {
  if (window.location.protocol === 'file:') return false;
  try {
    const resp = await fetch('./todos-data.json');
    if (!resp.ok) return false;
    const data = await resp.json();
    if (Array.isArray(data) && data.length > 0) {
      const merged = [...data.map(migrateTodo)];
      for (const t of todos) {
        if (!merged.find(m => m.id === t.id)) merged.push(t);
      }
      todos = merged;
      saveTodos();
      return true;
    }
  } catch (e) { /* 静默 */ }
  return false;
}

// ============================================================
// 九、顶层事件绑定
// ============================================================
addBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTodo();
});

// 输入区 DDL 类型切换
inputDdlType.addEventListener('change', () => {
  const isDatetime = inputDdlType.value === 'datetime';
  inputDdlDatetime.style.display = isDatetime ? '' : 'none';
  if (!isDatetime) {
    inputDdlDatetime.value = '';
  } else {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    const pad = (n) => String(n).padStart(2, '0');
    inputDdlDatetime.value = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }
});

clearCompletedBtn.addEventListener('click', clearCompleted);
exportBtn.addEventListener('click', exportData);
importBtn.addEventListener('click', () => importFileInput.click());
importFileInput.addEventListener('change', () => {
  if (importFileInput.files.length > 0) {
    importData(importFileInput.files[0]);
    importFileInput.value = '';
  }
});

// 手动加载 config.json（file:// 协议时的降级方案）
function triggerConfigFilePicker() {
  if (aiConfig._fileProtocol && !aiConfig._fileLoaded) {
    configFileInput.click();
  }
}
configWarn.addEventListener('click', triggerConfigFilePicker);
configStatus.addEventListener('click', triggerConfigFilePicker);
configFileInput.addEventListener('change', () => {
  if (configFileInput.files.length > 0) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const cfg = JSON.parse(e.target.result);
        aiConfig._fileLoaded = true;
        aiConfig.apiKey      = cfg.deepseekApiKey || null;
        aiConfig.fileEnabled = cfg.enableSummary !== false;
        if (cfg.imageRecognition && cfg.imageRecognition.enabled && cfg.imageRecognition.apiKey) {
          imgRecogConfig = {
            enabled: true,
            provider: cfg.imageRecognition.provider || 'zhipu',
            apiKey: cfg.imageRecognition.apiKey
          };
        } else {
          imgRecogConfig = { enabled: false, provider: '', apiKey: '' };
        }
        updateConfigUI();
        // 配置加载成功后，为已有长备注触发总结
        if (isSummaryAvailable()) {
          todos.forEach(todo => {
            if (todo.notes && todo.notes.trim().length > SUMMARY_CHAR_THRESHOLD && !todo.notesSummary) {
              triggerSummary(todo);
            }
          });
        }
      } catch (err) {
        alert('config.json 格式不正确');
      }
    };
    reader.readAsText(configFileInput.files[0]);
    configFileInput.value = '';
  }
});

// AI 开关
aiToggle.addEventListener('change', () => {
  aiToggleEnabled = aiToggle.checked;
  localStorage.setItem('ai_toggle_enabled', aiToggleEnabled);
  updateConfigUI();
  // 开关打开时，为已有事项补充总结
  if (aiToggleEnabled && isSummaryAvailable()) {
    todos.forEach(todo => {
      if (todo.notes && todo.notes.trim().length > SUMMARY_CHAR_THRESHOLD && !todo.notesSummary) {
        triggerSummary(todo);
      }
    });
  }
});

// ============================================================
// 十、启动入口
// ============================================================
async function init() {
  loadTodos();                     // localStorage
  await loadConfig();              // config.json（AI 配置）
  await tryAutoLoadJSON();         // 共享 JSON 文件
  renderTodoList();                // 首次渲染
  renderTodaySummary();            // 今日总结
}
init();

// 注册 Service Worker（PWA，仅 HTTP/HTTPS 协议）
if ('serviceWorker' in navigator && !window.location.protocol.startsWith('file')) {
  navigator.serviceWorker.register('./service-worker.js');
}
