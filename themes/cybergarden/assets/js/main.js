(() => {
  const root = document.documentElement;
  const meta = document.getElementById('theme-color-meta');
  const button = document.querySelector('.theme-toggle');
  const storageKey = 'cybergarden-theme';
  const darkColor = '#111111';
  const lightColor = '#F6F4F0';

  const getSystemTheme = () =>
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';

  const getTheme = () => root.dataset.theme || getSystemTheme();

  const updateUI = () => {
    const dark = getTheme() === 'dark';
    if (button) {
      button.setAttribute('aria-pressed', String(dark));
      button.setAttribute('aria-label', dark ? '切换浅色模式' : '切换深色模式');
      button.setAttribute('title', dark ? '切换浅色模式' : '切换深色模式');
    }
    if (meta) meta.setAttribute('content', dark ? darkColor : lightColor);
  };

  if (button) {
    button.addEventListener('click', () => {
      const next = getTheme() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem(storageKey, next); } catch (_) {}
      updateUI();
    });
  }

  const media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  if (media) {
    const onSystemChange = () => {
      try {
        if (!localStorage.getItem(storageKey)) updateUI();
      } catch (_) { updateUI(); }
    };
    if (media.addEventListener) media.addEventListener('change', onSystemChange);
    else if (media.addListener) media.addListener(onSystemChange);
  }

  updateUI();
})();