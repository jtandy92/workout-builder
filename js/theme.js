// Theme toggle functionality
(function() {
  const THEME_KEY = 'workout-app-theme';
  const DEFAULT_THEME = 'dark';

  function getSavedTheme() {
    return localStorage.getItem(THEME_KEY);
  }

  function initTheme() {
    const savedTheme = getSavedTheme();
    const root = document.documentElement;

    if (savedTheme === 'light') {
      root.classList.remove('dark');
    } else if (savedTheme === 'dark' || savedTheme === null) {
      root.classList.add('dark');
    }
  }

  function toggleTheme() {
    const root = document.documentElement;
    const isDark = root.classList.toggle('dark');
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    updateToggleIcon();
  }

  function updateToggleIcon() {
    const root = document.documentElement;
    const isDark = root.classList.contains('dark');

    document.querySelectorAll('[data-theme-toggle-icon]').forEach(icon => {
      icon.textContent = isDark ? 'light_mode' : 'dark_mode';
    });
  }

  function setupThemeToggle() {
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.addEventListener('click', toggleTheme);
    });

    updateToggleIcon();
  }

  // Initialize theme as early as possible
  initTheme();

  // Setup toggles when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupThemeToggle);
  } else {
    setupThemeToggle();
  }

  // Expose for external use if needed
  window.ThemeToggle = { toggle: toggleTheme, init: initTheme };
})();
