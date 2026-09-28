const assert = require('node:assert/strict');
const test = require('node:test');
const { buildCategoryRows, buildDailyBars } = require('../public/charts');

test('scales category totals to a full-width largest category', () => {
  const rows = buildCategoryRows([
    { category: 'Food', total: 40 },
    { category: 'Transport', total: 20 },
    { category: 'Bills', total: 0 },
  ]);

  assert.deepEqual(rows.map((row) => [row.category, row.percentage]), [
    ['Food', 100],
    ['Transport', 50],
    ['Bills', 0],
  ]);
});

test('creates one daily chart bar per date and scales values without negative heights', () => {
  const bars = buildDailyBars([
    { date: '2026-09-01', total: 0 },
    { date: '2026-09-02', total: 12.5 },
    { date: '2026-09-03', total: 25 },
  ]);

  assert.deepEqual(bars.map((bar) => [bar.date, bar.height]), [
    ['2026-09-01', 0],
    ['2026-09-02', 50],
    ['2026-09-03', 100],
  ]);
});
