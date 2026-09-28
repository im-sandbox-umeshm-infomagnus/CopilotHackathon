const crypto = require('node:crypto');
const http = require('node:http');
const path = require('node:path');
const express = require('express');

const CATEGORIES = Object.freeze(['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Other']);
const PUBLIC_DIRECTORY = path.join(__dirname, 'public');

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function getMonth(value) {
  if (value === undefined) return currentMonth();
  if (typeof value !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return null;
  return value;
}

function toCents(amount) {
  return Math.round(amount * 100);
}

function createExpenseServer({ initialExpenses = [] } = {}) {
  const app = express();
  const httpServer = http.createServer(app);
  const expenses = initialExpenses.map((expense) => ({ ...expense }));

  app.use(express.json({ limit: '32kb' }));
  app.use(express.static(PUBLIC_DIRECTORY));

  app.get('/api/categories', (_request, response) => {
    response.json(CATEGORIES);
  });

  app.get('/api/expenses', (request, response) => {
    let filtered = expenses;
    if (request.query.month !== undefined) {
      const month = getMonth(request.query.month);
      if (!month) {
        response.status(400).json({ error: 'month must use YYYY-MM format.' });
        return;
      }
      filtered = expenses.filter((expense) => expense.date.startsWith(month));
    }
    response.json(filtered.slice().sort((left, right) => right.date.localeCompare(left.date)));
  });

  app.post('/api/expenses', (request, response) => {
    const { amount, category, date, description } = request.body ?? {};
    const cleanDescription = typeof description === 'string' ? description.trim() : '';
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0
      || !Number.isSafeInteger(toCents(amount)) || toCents(amount) < 1
      || !CATEGORIES.includes(category) || !isValidDate(date)
      || !cleanDescription || cleanDescription.length > 200) {
      response.status(400).json({
        error: 'Provide a positive amount, valid category and date, and a description of 1-200 characters.',
      });
      return;
    }

    const expense = {
      id: crypto.randomUUID(),
      amount: toCents(amount) / 100,
      category,
      date,
      description: cleanDescription,
    };
    expenses.push(expense);
    response.status(201).json(expense);
  });

  app.delete('/api/expenses/:id', (request, response) => {
    const index = expenses.findIndex((expense) => expense.id === request.params.id);
    if (index === -1) {
      response.status(404).json({ error: 'Expense not found.' });
      return;
    }
    expenses.splice(index, 1);
    response.status(204).end();
  });

  app.get('/api/summary', (request, response) => {
    const month = getMonth(request.query.month);
    if (!month) {
      response.status(400).json({ error: 'month must use YYYY-MM format.' });
      return;
    }

    const monthlyExpenses = expenses.filter((expense) => expense.date.startsWith(month));
    const categoryCents = new Map();
    const dailyCents = new Map();
    let totalCents = 0;
    for (const expense of monthlyExpenses) {
      const cents = toCents(expense.amount);
      totalCents += cents;
      categoryCents.set(expense.category, (categoryCents.get(expense.category) || 0) + cents);
      dailyCents.set(expense.date, (dailyCents.get(expense.date) || 0) + cents);
    }

    const [year, monthNumber] = month.split('-').map(Number);
    const daysInMonth = new Date(year, monthNumber, 0).getDate();
    const dailyTotals = Array.from({ length: daysInMonth }, (_, index) => {
      const date = `${month}-${String(index + 1).padStart(2, '0')}`;
      return { date, total: (dailyCents.get(date) || 0) / 100 };
    });
    const categoryTotals = [...categoryCents.entries()]
      .map(([category, cents]) => ({ category, total: cents / 100 }))
      .sort((left, right) => right.total - left.total || left.category.localeCompare(right.category));

    response.json({
      month,
      total: totalCents / 100,
      expenseCount: monthlyExpenses.length,
      categoryTotals,
      dailyTotals,
    });
  });

  app.use('/api', (_request, response) => {
    response.status(404).json({ error: 'API endpoint not found.' });
  });

  app.use((error, _request, response, _next) => {
    const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 500
      ? error.status
      : 500;
    response.status(status).json({ error: status === 400 ? 'Invalid request body.' : 'Request failed.' });
  });

  return { app, httpServer };
}

if (require.main === module) {
  const { httpServer } = createExpenseServer();
  const port = Number(process.env.PORT || 3000);
  httpServer.listen(port, () => {
    console.log(`Expense tracker is ready at http://localhost:${port}`);
  });
}

module.exports = { CATEGORIES, createExpenseServer };
