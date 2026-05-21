# 交互式待办清单 — 更新日志

## v2.2.3 (2026-05-21)

### 性能优化

- **Map 索引替代 find 遍历**：`todos.find(t => t.id === id)` 全部替换为 `todoMap.get(id)`，O(n) → O(1)
  - 新增 `todoMap`（`Map<id, todo>`）+ `syncTodoMap()` 函数，在 `saveTodos()`/`loadTodos()` 后自动同步
  - 影响范围：倒计时更新、点击事件、详情面板修改、DDL 修改等 5 处查找点
  - 大量待办时（500+）可避免每次操作遍历全数组

---

## v2.2.2 (2026-05-21)

### 开发体验

- **引入 E2E 测试**：使用 Playwright 编写端到端测试，覆盖核心功能
  - 测试框架：Playwright（支持 Chromium / Mobile Chrome）
  - 测试覆盖：添加/完成/删除待办、DDL 设置、数据持久化、导出功能、今日总结、移动端适配
  - 运行方式：`npm test`（命令行）/ `npm run test:ui`（可视化界面）

### 新增文件

| 文件 | 说明 |
|------|------|
| `package.json` | Node.js 项目配置，定义测试脚本 |
| `playwright.config.js` | Playwright 测试配置 |
| `tests/todo.spec.js` | E2E 测试用例（15 个测试场景） |

---

## v2.2.1 (2026-05-21)

### 优化改进

- **Toast 通知系统**：新增全局 Toast 通知组件，支持 error/warning/success/info 四种类型，自动消失动画
- **AI 总结错误提示**：DeepSeek API 调用失败时，通过 Toast 显示具体错误原因（API Key 无效、请求频繁、网络连接失败等），不再静默失败
- **截图识别错误提示**：智谱 GLM-4V API 调用失败时，同时在 Toast 和弹窗内显示具体错误原因，用户可明确感知失败原因

---

## v2.1.7 (2026-05-21)

### 新功能

- **今日总结模块**：标题下方新增「今日总结」面板，列出当天完成的所有事项标题及完成时间。点击可跳转到列表中对应卡片并高亮。今天无完成时自动隐藏。

- **截图识别任务**：输入区新增「截图识别」按钮，点击弹出模态窗口，粘贴截图后调用智谱 GLM-4V API 自动提取任务信息（标题、备注、分配人、部门、责任人、DDL），预填到输入区。通过 `config.json` 中 `imageRecognition` 配置节点控制开关，API 供应商可替换。

- **输入区属性字段**：新建待办时可直接填写任务分配人、责任部门、责任人，无需等创建后再修改。样式与详情面板保持一致。

### 其他

- **页面底部版本号**：footer 下方显示当前版本号（v2.1.7），半透明低调展示。

### Bug 修复

- **刘海屏遮挡标题**：移动端 body padding-top 从硬编码 `24px` 改为 `max(44px, env(safe-area-inset-top))`，修复 iPhone 刘海/灵动岛遮挡页面头部的问题。

- **今日 DDL 新建后显示「长期」**：新建待办时切换到「指定时间」后，iOS 原生选择器默认显示当天日期但不会主动写入 input.value，导致 DDL 被当作 null 回退为「长期」。修复：切换到 datetime 模式时自动预填当前时间（+1 分钟）。

- **AI 总结点击无效**：`deepseek-v4-flash` 升级为推理模型后，`max_tokens=60` 全部被推理消耗，输出为空。修复：`max_tokens` 调至 200。

- **DDL 日期解析兼容性**：`new Date('YYYY-MM-DDTHH:MM')` 在不同浏览器中行为不一致。修复：改为显式解析年月日时分，确保始终按本地时间处理。

- **截图识别 JSON 解析**：智谱 API 返回的 JSON 有时被 markdown 代码块包裹，`JSON.parse` 失败。修复：解析前先 strip 代码块。

- **截图识别按钮无反馈**：未粘贴图片或未加载配置时点击识别静默无反应。修复：弹窗内显示明确错误提示。

- **今日总结支持删除**：每项右侧新增 ✕ 删除按钮，可直接从总结面板删除已完成事项。

### 数据结构

- 新增 `completedAt` 字段（字符串格式 `YYYY-MM-DD HH:mm`），记录事项被勾选完成的时间。旧数据迁移时该字段默认为 `null`。

---

## v2.1.6 (2026-05-21)

### Bug 修复

- **AI 开关切换后顶部状态不变**：打开/关闭底部 AI 开关后，顶部「AI 已配置」/「AI 已关闭」状态文字不更新。原因：`aiToggle` change 事件中缺少 `updateConfigUI()` 调用。

---

## v2.1.5 (2026-05-21)

### 变更概述

1. **PWA 支持**：应用可安装到桌面/手机主屏幕，独立窗口运行，离线可用
2. **iOS 适配**：全面支持 iPhone（刘海屏安全区域、全屏模式、主屏幕图标）

### 新增文件

| 文件 | 说明 |
|------|------|
| `manifest.json` | Web App 清单（名称、图标、主题色、全屏模式） |
| `service-worker.js` | 离线缓存策略（核心文件缓存优先，API 请求走网络） |
| `icon.svg` | 应用图标（紫色渐变背景 + 白色复选框） |

### 技术改进

- `<meta viewport>` 增加 `viewport-fit=cover`（iPhone 全屏适配）
- body padding 使用 `env(safe-area-inset-*)` 适配刘海屏
- 注册 Service Worker，实现离线缓存和版本管理

---

## v2.1.4 (2026-05-21)

### 变更概述

1. **AI 总结提示词优化**：缩短总结字数限制（25 汉字），要求保留任务主题和关键要求，降低 max_tokens
2. **任务列表分区**：拆分为「待完成」和「已完成」两个区域，打勾后自动移到已完成区，各区显示计数
3. **删除顶部导出/导入快捷入口**：移除标题下方的「导出 JSON / 导入 JSON」行，底部按钮保留
4. **AI 配置手动加载**：`file://` 协议打开页面时，点击惊叹号可手动选择 `config.json` 加载

### 技术改进

- `#todoList` 改为 `#todoListWrapper` 容器 + 两个 `.todo-list` 分区列表
- `loadConfig` 检测 `file://` 协议，提供手动加载降级方案
- 事件委托绑定在 `todoListWrapper` 上，两个列表共享

---

## v2.1.3 (2026-05-20)

### 变更概述

1. **AI 总结改为手动触发**：备注超过 120 字时，卡片第三行显示「✨ 总结」按钮，点击后异步调用 API
2. **AI 配置状态诊断**：配置状态旁新增惊叹号图标，hover 显示 AI 不可用的具体原因

### 诊断场景

| 状态 | 惊叹号提示 |
|------|-----------|
| config.json 不存在 | 未找到 config.json 文件，请创建配置文件 |
| 缺少 deepseekApiKey | config.json 中未找到 deepseekApiKey |
| enableSummary: false | config.json 中 enableSummary 为 false |
| 页面开关关闭 | 页面底部 AI 总结开关已关闭 |
| 全部正常 | 无惊叹号 |

### 技术改进

- 移除 `renderTodoList` 末尾的自动 AI 总结触发逻辑
- 新增 `triggerSummary` 点击事件处理（事件委托）
- `loadConfig` 增加 `_fileLoaded` 标记，区分「文件不存在」和「加载失败」
- `updateConfigUI` 覆盖 5 种诊断分支

---

## v2.1.2 (2026-05-20)

### Bug 修复

- **DDL datetime-local 事件不可靠**：WebKit 浏览器中 `change`/`focusout` 事件委托在 `<ul>` 上不稳定。改为在 `renderTodoList` 中通过 `querySelectorAll` 直接在每个 datetime-local 元素上绑定 `addEventListener('change', ...)`，完全绕过事件委托。

---

## v2.1.1 (2026-05-20)

### Bug 修复

- **DDL 始终显示「长期」**：datetime-local 的 `change` 事件在不同浏览器中冒泡行为不一致。新增 `focusout` 事件监听作为兜底方案，在输入框失去焦点时检测值变化并更新数据。

---

## v2.1.0 (2026-05-20)

### 变更概述

1. **DDL 改为具体日期时间**：不再使用「每周」，改用 `<input type="datetime-local">` 选择具体截止日期+时间，保留「长期」选项
2. **新增时填写备注**：输入区域标题下方新增备注 textarea，创建任务时一并填写
3. **三行卡片布局**：标题行 → 时间信息行 → 备注概述行，备注概述直接可见，无需展开详情
4. **AI 一句话总结**：备注超过 **120 个字符**时，自动调用 DeepSeek API（`deepseek-v4-flash`）用一句话总结任务，结果缓存在数据中
5. **DDL 修改不折叠详情**：DDL 字段变化时只做增量 DOM 更新，详情面板保持展开状态

### 配置文件 `config.json`

API Key 存放在外部文件 `config.json` 中，与 HTML 同目录：

```json
{
  "deepseekApiKey": "sk-...",
  "enableSummary": true
}
```

- 文件不存在 → AI 总结功能完全禁用，UI 不显示相关元素
- 文件存在但 `enableSummary: false` → 可通过页面开关手动启用
- 底部新增 **AI 总结开关**，状态持久化到 localStorage

### 数据结构变更

```json
{
  "id": 1716184200000,
  "text": "完成项目报告",
  "completed": false,
  "createdAt": "2026-05-20 14:30",
  "ddlType": "datetime",
  "ddlDatetime": "2026-05-25T17:00",
  "notes": "需要包含 Q2 数据...",
  "notesSummary": "项目报告需包含Q2数据",
  "assignee": "张三",
  "department": "技术部",
  "responsible": "李四"
}
```

| 变更 | 旧字段 | 新字段 | 说明 |
|------|--------|--------|------|
| 移除 | `ddlDay`, `ddlHour`, `ddlMinute` | — | 不再使用每周重复 |
| 新增 | — | `ddlDatetime` | ISO datetime-local 字符串，长期时为 null |
| 新增 | — | `notesSummary` | AI 生成的总结缓存 |

**迁移**：旧版 `weekly` 数据自动转为下一个匹配的 `datetime`，兼容升级。

### 卡片三行布局

```
┌──────────────────────────────────────────┐
│ ☐  任务标题                          [✕] │  ← 第一行：标题
│    生成 05-20 14:30 · 截止 05-25 17:00   │  ← 第二行：时间 + 倒计时
│    📝 AI 一句话总结概述… [展开原文▼]      │  ← 第三行：备注概述（无备注时隐藏）
└──────────────────────────────────────────┘
```

- 短备注（≤120 字）：直接显示原文
- 长备注无缓存：显示原文 + 后台异步调 AI 总结
- 长备注已缓存：显示总结 + `[AI]` 标签 + 可展开查看原文

### 技术改进

- 新增 `updateTodoItemMeta()` 和 `updateTodoItemSummaryRow()` 实现增量 DOM 更新
- DDL/备注字段变化不再触发全局重绘，只刷新受影响的 DOM 节点
- DeepSeek API 调用完全异步，不阻塞 UI
- 数据存储 key 升级为 `my_todo_list_v2_1`

---

## v2.0.0 (2026-05-20)

### 新增功能

#### 1. DDL 截止日期 + 实时倒计时
- 每个事项可在详情面板中设置 DDL 类型：
  - **长期**（默认）：无具体截止日期，不显示倒计时
  - **每周**：选择一个星期几（周一 ~ 周日）+ 具体时间（精确到分钟）
- 元信息行显示**实时倒计时**，每分钟自动更新
- 倒计时根据剩余时间**自动变色**：

| 剩余时间 | 颜色 | 样式 |
|---------|------|------|
| > 24 小时 | 蓝色 | 常规 |
| 1 ~ 24 小时 | 黄色 | 警告 |
| < 1 小时 | 红色 | 闪烁脉冲 |
| 已过期 | 暗红 | — |

#### 2. 备注字段
- 每个事项可添加**备注**（可选）
- 在详情面板中以文本域（textarea）形式展示
- 支持多行文本，字段可自由拉伸

#### 3. 任务属性（分配人 / 责任部门 / 责任人）
- **任务分配人**：文字输入框
- **责任部门**：文字输入框
- **责任人**：文字输入框
- 三个字段均在详情面板中，以三列并排布局

#### 4. 生成时间戳
- 每个待办事项在创建时自动记录**生成时间**
- 格式：`YYYY-MM-DD HH:MM`（精确到分钟）
- 显示在每个事项卡片的元信息行中，不可编辑

#### 5. 数据导出/导入（支持文件夹分享）
- **导出**：将全部事项导出为 `todos-data.json`，下载到本地
- **导入**：从本地选择 JSON 文件读取事项数据
- **自动检测**：网页启动时尝试加载同目录下的 `todos-data.json`（通过 HTTP 服务器打开时自动生效，如 Live Server）
- 导入数据会与当前 localStorage 数据**智能合并**（JSON 文件优先，保留本地独有条目）

### 数据结构

```json
{
  "id": 1716184200000,
  "text": "完成项目报告",
  "completed": false,
  "createdAt": "2026-05-20 14:30",
  "ddlType": "weekly",
  "ddlDay": 5,
  "ddlHour": 17,
  "ddlMinute": 0,
  "notes": "需要包含 Q2 数据",
  "assignee": "张三",
  "department": "技术部",
  "responsible": "李四"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | number | 唯一标识（创建时的时间戳） |
| `text` | string | 待办事项文字 |
| `completed` | boolean | 是否已完成 |
| `createdAt` | string | 生成时间（`YYYY-MM-DD HH:MM`） |
| `ddlType` | string | `"long-term"` 长期 / `"weekly"` 每周 |
| `ddlDay` | number | 1=周一 … 7=周日 |
| `ddlHour` | number | DDL 小时 (0-23) |
| `ddlMinute` | number | DDL 分钟 (0-59) |
| `notes` | string | 备注内容 |
| `assignee` | string | 任务分配人 |
| `department` | string | 责任部门 |
| `responsible` | string | 责任人 |

### 分享操作流程

```
用户 A（创建者）                    用户 B（接收者）
─────────────────                  ─────────────────
1. 添加事项，正常使用
2. 点击「导出数据」
   → 下载 todos-data.json
3. 将 JSON 文件放入项目文件夹
4. 分享整个文件夹 ──────────────→  5. 打开 index.html
                                   6. 点击「导入数据」
                                   7. 选择 todos-data.json
                                   8. 数据加载完成
```

> **提示**：如果通过 HTTP 服务器（如 `python -m http.server`、VS Code Live Server）打开网页，步骤 6-7 可省略——网页会自动检测并加载同目录下的 `todos-data.json`。

### 技术改进

- 数据存储 key 升级为 `my_todo_list_v2`，与 v1 版本隔离
- 内置数据迁移函数 `migrateTodo()`，打开旧版数据时自动补全新字段
- 事件处理改用**事件委托**，在 `<ul>` 上统一监听，减少内存占用
- 倒计时更新采用**增量更新**（仅修改文字节点），不触发整个列表重绘
- 增加 `escapeHTML()` 工具函数，防止 XSS 攻击

---

## v1.0.0 (初始版本)

- 基本待办事项增删改查
- 完成状态切换（复选框 + 删除线 + 半透明）
- 未完成数量统计
- 清除所有已完成事项
- localStorage 持久化存储
- 毛玻璃 UI 风格 + 深色背景
- 添加/删除淡入淡出动画
