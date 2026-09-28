const assert = require('node:assert/strict');
const test = require('node:test');

const themeModules = [
  ['Memory Game', require('../public/theme')],
  ['Expense Tracker', require('../../expensetracker/public/theme')],
  ['E-Shop', require('../../eshop/public/theme')],
];

function makeThemeContext(initialPreference, prefersDark = false) {
  const root = { dataset: {} };
  const values = new Map(initialPreference ? [['appearance', initialPreference]] : []);
  const storage = {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
  };
  return { root, storage, values, prefersDark };
}

for (const [appName, themeModule] of themeModules) {
  test(`${appName} follows the system theme until the user makes a choice`, () => {
    const context = makeThemeContext(null, true);
    const theme = themeModule.createThemeController({ ...context, storageKey: 'appearance' });

    assert.equal(theme.getTheme(), 'dark');
    assert.equal(context.root.dataset.theme, 'dark');
    theme.updateSystemPreference(false);
    assert.equal(theme.getTheme(), 'light');
  });

  test(`${appName} persists manual theme selections and respects them over system changes`, () => {
    const context = makeThemeContext(null, false);
    const theme = themeModule.createThemeController({ ...context, storageKey: 'appearance' });

    assert.equal(theme.toggle(), 'dark');
    assert.equal(context.values.get('appearance'), 'dark');
    theme.updateSystemPreference(false);
    assert.equal(theme.getTheme(), 'dark');

    const restored = themeModule.createThemeController({ ...context, prefersDark: false, storageKey: 'appearance' });
    assert.equal(restored.getTheme(), 'dark');
  });
}
