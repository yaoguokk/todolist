# 交互式待办清单

一个纯前端待办事项管理应用，毛玻璃暗色 UI，支持 DDL 倒计时、AI 智能总结、数据导入导出。

## 功能特性

- **待办事项管理** — 添加、完成、删除，数据自动保存到浏览器 localStorage
- **DDL 截止日期** — 支持具体日期时间选择（datetime-local），实时倒计时，过期/临近自动变色提醒
- **备注 & AI 总结** — 每条事项可添加备注，超过 120 字符时调用 DeepSeek API 一句话总结
- **待完成 / 已完成分区** — 打勾后自动归入已完成区域，未完成事项独立展示
- **任务属性** — 分配人、责任部门、责任人
- **数据导出/导入** — 导出为 JSON 文件，支持多人文件夹共享

## 快速开始

1. 克隆仓库到本地
2. 创建 `config.json`（参考下方配置）
3. 通过 HTTP 服务器打开 `index.html`（如 VS Code Live Server 或 `python -m http.server`）

> 直接双击打开（`file://` 协议）也可以使用，但需手动加载 `config.json`（点击页面顶部的惊叹号选择文件）。

## 配置文件

在项目根目录创建 `config.json`：

```json
{
  "deepseekApiKey": "sk-你的-api-key",
  "enableSummary": true
}
```

| 字段 | 说明 |
|------|------|
| `deepseekApiKey` | DeepSeek API 密钥（从 [platform.deepseek.com](https://platform.deepseek.com) 获取） |
| `enableSummary` | `true` 启用 AI 总结，`false` 关闭 |

不创建 `config.json` 也可正常使用所有功能，只是 AI 总结不可用。

## 技术栈

- HTML / CSS / JavaScript（单文件应用）
- DeepSeek API（`deepseek-v4-flash`，OpenAI 兼容格式）
- localStorage 数据持久化
- 毛玻璃 UI（backdrop-filter）+ 暗色渐变背景

## 近期变更

### v2.1.4 (2026-05-21)

- AI 总结提示词优化，缩短总结长度，保留任务核心内容
- 任务列表拆分为「待完成」和「已完成」两个区域，打勾自动排序
- 移除顶部导出/导入快捷入口
- 支持 `file://` 协议下手动加载 `config.json`

### v2.1.3 (2026-05-20)

- AI 总结改为手动触发，备注超 120 字显示紫色「✨ 总结」按钮
- AI 配置状态旁新增惊叹号诊断，hover 显示具体缺失原因

### v2.1.2 (2026-05-20)

- 修复 DDL datetime-local 在 WebKit 浏览器中事件不触发的问题

### v2.1.1 (2026-05-20)

- 修复 DDL 始终显示「长期」的 bug

### v2.1.0 (2026-05-20)

- DDL 改为 `datetime-local` 具体日期时间选择器
- 创建时即可填写备注和 DDL
- 三行卡片布局，备注概述直接可见
- AI 一句话总结功能上线

### v2.0.0 (2026-05-20)

- DDL 截止日期 + 实时倒计时（过期变色/脉冲动画）
- 备注字段 + 任务属性（分配人/责任部门/责任人）
- 生成时间戳
- 数据导出/导入 JSON 分享

完整更新日志见 [CHANGELOG.md](CHANGELOG.md)。
