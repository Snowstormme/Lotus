(function () {
  'use strict';
  const storageKey = 'lotus-theme';
  const root = document.documentElement;
  let theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  try {
    const saved = window.localStorage.getItem(storageKey);
    if (saved === 'light' || saved === 'dark') theme = saved;
  } catch (_) {
    // Themes still work when browser storage is unavailable.
  }

  function applyTheme(value) {
    theme = value;
    root.dataset.theme = value;
    document.querySelectorAll('[name="appearance"]').forEach(function (input) {
      input.checked = input.value === value;
    });
  }

  applyTheme(theme);
  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(theme);
    document.querySelectorAll('[name="appearance"]').forEach(function (input) {
      input.addEventListener('change', function () {
        if (!input.checked || !['light', 'dark'].includes(input.value)) return;
        applyTheme(input.value);
        const status = document.getElementById('appearance-status');
        try {
          window.localStorage.setItem(storageKey, input.value);
          if (status) status.textContent = 'Appearance saved. This theme applies to every page on this browser.';
        } catch (_) {
          if (status) status.textContent = 'Theme changed for this page. Browser storage is unavailable, so it could not be saved.';
        }
      });
    });
  });

  window.addEventListener('storage', function (event) {
    if (event.key === storageKey && ['light', 'dark'].includes(event.newValue)) {
      applyTheme(event.newValue);
    }
  });
}());
