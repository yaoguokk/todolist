const { test, expect, devices } = require('@playwright/test');

// 移动端测试单独运行
test.use({ ...devices['Pixel 5'] });

test.describe('移动端适配', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('移动端页面正常显示', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('我的待办清单');
  });

  test('移动端添加任务', async ({ page }) => {
    await page.fill('#todoInput', '移动端任务');
    await page.tap('#addBtn');

    await expect(page.locator('.todo-item')).toContainText('移动端任务');
  });
});

test.describe('待办清单核心功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 清空 localStorage 确保测试环境干净
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('页面加载正常显示标题', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('我的待办清单');
  });

  test('添加待办事项', async ({ page }) => {
    // 输入待办内容
    await page.fill('#todoInput', '测试任务一');
    await page.click('#addBtn');

    // 验证添加成功
    await expect(page.locator('.todo-item')).toContainText('测试任务一');
    await expect(page.locator('#countNumber')).toContainText('1');
  });

  test('添加多个待办事项', async ({ page }) => {
    for (let i = 1; i <= 3; i++) {
      await page.fill('#todoInput', `任务 ${i}`);
      await page.click('#addBtn');
    }

    // 验证添加成功
    await expect(page.locator('.todo-item')).toHaveCount(3);
    await expect(page.locator('#countNumber')).toContainText('3');
  });

  test('完成待办事项', async ({ page }) => {
    // 添加任务
    await page.fill('#todoInput', '待完成的任务');
    await page.click('#addBtn');

    // 等待任务项出现并点击复选框
    const todoItem = page.locator('.todo-item');
    await expect(todoItem).toBeVisible();
    const checkbox = todoItem.locator('input[type="checkbox"]');
    await expect(checkbox).toBeVisible();
    await checkbox.click();

    // 验证移到已完成区域
    await expect(page.locator('#completedList .todo-item')).toContainText('待完成的任务');
    await expect(page.locator('#countNumber')).toContainText('0');
  });

  test('删除待办事项', async ({ page }) => {
    // 添加任务
    await page.fill('#todoInput', '要删除的任务');
    await page.click('#addBtn');

    // 点击删除按钮
    await page.locator('.todo-item .delete-btn').click();

    // 验证删除成功
    await expect(page.locator('.todo-item')).toHaveCount(0);
    await expect(page.locator('#emptyHint')).toBeVisible();
  });

  test('数据持久化到 localStorage', async ({ page }) => {
    // 添加任务
    await page.fill('#todoInput', '持久化测试');
    await page.click('#addBtn');

    // 验证 localStorage 已保存
    const stored = await page.evaluate(() => {
      const data = localStorage.getItem('my_todo_list_v2_1');
      return data ? JSON.parse(data) : null;
    });

    expect(stored).toBeTruthy();
    expect(stored).toHaveLength(1);
    expect(stored[0].text).toBe('持久化测试');
  });

  test('页面刷新后数据保留', async ({ page }) => {
    // 添加任务
    await page.fill('#todoInput', '刷新测试');
    await page.click('#addBtn');

    // 刷新页面
    await page.reload();

    // 验证数据保留
    await expect(page.locator('.todo-item')).toContainText('刷新测试');
  });

  test('添加带备注的待办', async ({ page }) => {
    await page.fill('#todoInput', '带备注的任务');
    await page.fill('#notesInput', '这是备注内容');
    await page.click('#addBtn');

    // 验证添加成功
    await expect(page.locator('.todo-item')).toContainText('带备注的任务');
  });

  test('添加带 DDL 的待办', async ({ page }) => {
    await page.fill('#todoInput', '有截止时间的任务');
    await page.selectOption('#inputDdlType', 'datetime');

    // 等待 datetime-local 输入框显示
    await expect(page.locator('#inputDdlDatetime')).toBeVisible();

    // 设置日期时间（格式：YYYY-MM-DDTHH:MM）
    await page.fill('#inputDdlDatetime', '2026-12-31T17:00');
    await page.click('#addBtn');

    // 验证添加成功
    await expect(page.locator('.todo-item')).toContainText('有截止时间的任务');
  });

  test('清除已完成事项', async ({ page }) => {
    // 添加两个任务
    await page.fill('#todoInput', '要保留的任务');
    await page.click('#addBtn');
    await page.fill('#todoInput', '要删除的任务');
    await page.click('#addBtn');

    // 等待列表渲染
    await page.waitForTimeout(300);

    // 完成第二个任务
    const secondTodo = page.locator('.todo-item').nth(1);
    await expect(secondTodo).toBeVisible();
    const secondCheckbox = secondTodo.locator('input[type="checkbox"]');
    await expect(secondCheckbox).toBeVisible();
    await secondCheckbox.click();

    // 等待动画完成
    await page.waitForTimeout(500);

    // 点击清除已完成
    await page.click('#clearCompletedBtn');

    // 等待清除完成
    await page.waitForTimeout(1000);

    // 验证只剩一个未完成
    await expect(page.locator('.todo-item')).toHaveCount(1);
    await expect(page.locator('.todo-item .todo-main-row .todo-text')).toContainText('要保留的任务');
  });

  test('导出数据功能', async ({ page }) => {
    // 添加任务
    await page.fill('#todoInput', '导出测试');
    await page.click('#addBtn');

    // 监听下载
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#exportBtn'),
    ]);

    // 验证下载文件名
    expect(download.suggestedFilename()).toBe('todos-data.json');
  });

  test('展开/收起详情面板', async ({ page }) => {
    await page.fill('#todoInput', '展开测试任务');
    await page.click('#addBtn');

    // 点击展开按钮
    await page.locator('.expand-toggle').click();

    // 验证详情面板显示
    await expect(page.locator('.todo-details')).toBeVisible();

    // 再次点击收起
    await page.locator('.expand-toggle').click();
    await expect(page.locator('.todo-details')).not.toBeVisible();
  });

  test('空输入时不能添加', async ({ page }) => {
    // 不输入任何内容直接点击添加
    await page.click('#addBtn');

    // 验证没有添加任何事项
    await expect(page.locator('.todo-item')).toHaveCount(0);
  });
});

test.describe('今日总结功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('完成事项后显示今日总结', async ({ page }) => {
    // 添加并完成一个任务
    await page.fill('#todoInput', '今日完成的任务');
    await page.click('#addBtn');

    const todoItem = page.locator('.todo-item');
    await expect(todoItem).toBeVisible();
    const checkbox = todoItem.locator('input[type="checkbox"]');
    await expect(checkbox).toBeVisible();
    await checkbox.click();

    // 验证今日总结显示
    await expect(page.locator('.today-summary')).toBeVisible();
    await expect(page.locator('.today-summary-list li')).toContainText('今日完成的任务');
  });

  test('今日总结可删除', async ({ page }) => {
    test.setTimeout(60000); // 增加超时时间

    // 添加并完成一个任务
    await page.fill('#todoInput', '要删除的已完成任务');
    await page.click('#addBtn');

    const todoItem = page.locator('.todo-item');
    await expect(todoItem).toBeVisible();
    const checkbox = todoItem.locator('input[type="checkbox"]');
    await expect(checkbox).toBeVisible();
    await checkbox.click();

    // 验证今日总结显示
    await expect(page.locator('.today-summary')).toBeVisible();
    await expect(page.locator('.today-summary-list li')).toHaveCount(1);

    // 点击今日总结中的删除按钮
    const deleteBtn = page.locator('.item-del').first();
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    // 等待更新完成
    await page.waitForTimeout(2000);

    // 验证已从总结中移除
    await expect(page.locator('.today-summary-list li')).toHaveCount(0);
  });
});

