# Ledger Expense Tracker

A small expense-tracking dashboard built with Node.js, Express, and browser JavaScript. Expenses are kept in memory and reset when the server restarts, as allowed by the challenge brief.

## Requirements

- Node.js 18 or newer
- npm

## Run

From this directory:

```sh
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). Set `PORT` to use another port.

## API

- `GET /api/categories` returns the supported categories.
- `GET /api/expenses?month=YYYY-MM` lists expenses, optionally filtered by month.
- `POST /api/expenses` creates an expense with `amount`, `category`, `date`, and `description`.
- `DELETE /api/expenses/:id` deletes an expense.
- `GET /api/summary?month=YYYY-MM` returns the monthly total, count, category totals, and daily totals.

## Test

```sh
npm test
```