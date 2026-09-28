const assert = require('node:assert/strict');
const test = require('node:test');
const { createExpenseServer } = require('../server');

const sampleExpenses = [
  { id: 'food-1', amount: 12.5, category: 'Food', date: '2026-09-02', description: 'Groceries' },
  { id: 'transport-1', amount: 8.25, category: 'Transport', date: '2026-09-02', description: 'Bus fare' },
  { id: 'food-2', amount: 22.99, category: 'Food', date: '2026-08-31', description: 'Dinner' },
];

async function startExpenseServer(t, initialExpenses = []) {
  const service = createExpenseServer({ initialExpenses });
  await new Promise((resolve, reject) => {
    service.httpServer.once('error', reject);
    service.httpServer.listen(0, '127.0.0.1', resolve);
  });
  t.after(() => new Promise((resolve) => service.httpServer.close(resolve)));
  return `http://127.0.0.1:${service.httpServer.address().port}`;
}

async function postExpense(url, expense) {
  return fetch(`${url}/api/expenses`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(expense),
  });
}

test('creates an expense and returns it in the expense list', async (t) => {
  const url = await startExpenseServer(t);
  const response = await postExpense(url, {
    amount: 18.75,
    category: 'Food',
    date: '2026-09-14',
    description: 'Lunch',
  });
  const created = await response.json();
  const list = await (await fetch(`${url}/api/expenses?month=2026-09`)).json();

  assert.equal(response.status, 201);
  assert.equal(created.amount, 18.75);
  assert.equal(created.category, 'Food');
  assert.match(created.id, /^\S+$/);
  assert.deepEqual(list, [created]);
});

test('rejects invalid amounts, categories, dates, and empty descriptions', async (t) => {
  const url = await startExpenseServer(t);
  const invalidExpenses = [
    { amount: 0, category: 'Food', date: '2026-09-01', description: 'Zero' },
    { amount: -3, category: 'Food', date: '2026-09-01', description: 'Negative' },
    { amount: 1e100, category: 'Food', date: '2026-09-01', description: 'Too large' },
    { amount: '12.00', category: 'Food', date: '2026-09-01', description: 'String amount' },
    { amount: 4, category: 'Pets', date: '2026-09-01', description: 'Unknown category' },
    { amount: 4, category: 'Food', date: '2026-02-30', description: 'Invalid date' },
    { amount: 4, category: 'Food', date: '2026-09-01', description: '   ' },
  ];

  for (const expense of invalidExpenses) {
    const response = await postExpense(url, expense);
    assert.equal(response.status, 400, JSON.stringify(expense));
  }
});

test('lists only the selected month in newest-first order', async (t) => {
  const url = await startExpenseServer(t, sampleExpenses);
  const response = await fetch(`${url}/api/expenses?month=2026-09`);

  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).map((expense) => expense.id), ['food-1', 'transport-1']);
});

test('summarizes the selected month by total, category, and day', async (t) => {
  const url = await startExpenseServer(t, sampleExpenses);
  const response = await fetch(`${url}/api/summary?month=2026-09`);
  const summary = await response.json();

  assert.equal(response.status, 200);
  assert.equal(summary.month, '2026-09');
  assert.equal(summary.total, 20.75);
  assert.equal(summary.expenseCount, 2);
  assert.deepEqual(summary.categoryTotals, [
    { category: 'Food', total: 12.5 },
    { category: 'Transport', total: 8.25 },
  ]);
  assert.deepEqual(summary.dailyTotals.filter((day) => day.total > 0), [
    { date: '2026-09-02', total: 20.75 },
  ]);
});

test('deletes an expense and returns not found for an unknown ID', async (t) => {
  const url = await startExpenseServer(t, sampleExpenses);
  const deleted = await fetch(`${url}/api/expenses/food-1`, { method: 'DELETE' });
  const missing = await fetch(`${url}/api/expenses/no-such-expense`, { method: 'DELETE' });
  const remaining = await (await fetch(`${url}/api/expenses`)).json();

  assert.equal(deleted.status, 204);
  assert.equal(missing.status, 404);
  assert.deepEqual(remaining.map((expense) => expense.id), ['transport-1', 'food-2']);
});

test('rejects invalid month filters', async (t) => {
  const url = await startExpenseServer(t);

  for (const endpoint of ['/api/expenses?month=2026-13', '/api/summary?month=not-a-month']) {
    const response = await fetch(`${url}${endpoint}`);
    assert.equal(response.status, 400, endpoint);
  }
});
