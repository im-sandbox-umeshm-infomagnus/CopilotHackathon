(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ExpenseCharts = api;
})(globalThis, function () {
  function buildCategoryRows(categoryTotals) {
    const maximum = Math.max(0, ...categoryTotals.map((item) => item.total));
    return categoryTotals.map((item) => ({
      ...item,
      percentage: maximum === 0 ? 0 : Math.round((item.total / maximum) * 100),
    }));
  }

  function buildDailyBars(dailyTotals) {
    const maximum = Math.max(0, ...dailyTotals.map((item) => item.total));
    return dailyTotals.map((item) => ({
      ...item,
      height: maximum === 0 ? 0 : Math.round((item.total / maximum) * 100),
    }));
  }

  return { buildCategoryRows, buildDailyBars };
});