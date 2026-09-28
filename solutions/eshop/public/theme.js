(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AppTheme = api;

  if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    let storage;
    try {
      storage = window.localStorage;
    } catch {
      storage = { getItem: () => null, setItem: () => {} };
    }
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    const controller = api.createThemeController({
      root: document.documentElement,
      storage,
      storageKey: 'autosupply-theme',
      prefersDark: Boolean(media?.matches),
    });
    const updateButtons = () => {
      document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
        const dark = controller.getTheme() === 'dark';
        button.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} mode`);
        button.setAttribute('aria-pressed', String(dark));
        button.title = `Switch to ${dark ? 'light' : 'dark'} mode`;
      });
    };
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
        button.addEventListener('click', () => {
          controller.toggle();
          updateButtons();
        });
      });
      updateButtons();
    });
    media?.addEventListener('change', (event) => {
      controller.updateSystemPreference(event.matches);
      updateButtons();
    });
  }
})(globalThis, function () {
  function createThemeController({ root, storage, storageKey, prefersDark = false }) {
    let savedTheme;
    try {
      savedTheme = storage.getItem(storageKey);
    } catch {
      savedTheme = null;
    }
    let hasUserChoice = savedTheme === 'dark' || savedTheme === 'light';
    let theme = hasUserChoice ? savedTheme : (prefersDark ? 'dark' : 'light');

    function apply(nextTheme) {
      theme = nextTheme;
      root.dataset.theme = theme;
    }

    apply(theme);
    return {
      getTheme: () => theme,
      toggle() {
        hasUserChoice = true;
        apply(theme === 'dark' ? 'light' : 'dark');
        try {
          storage.setItem(storageKey, theme);
        } catch {
          return theme;
        }
        return theme;
      },
      updateSystemPreference(systemPrefersDark) {
        if (!hasUserChoice) apply(systemPrefersDark ? 'dark' : 'light');
        return theme;
      },
    };
  }

  return { createThemeController };
});
