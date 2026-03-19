import '@fontsource-variable/jetbrains-mono';
import '@fontsource/fusion-pixel-12px-monospaced-sc';
import './styles-base.css';
import './styles-default.css';
import './nav-hoard.ts';

function loadCustomStyles() {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const href = `${normalizedBase}nav-hoard.custom.css`;

  if (document.querySelector('link[data-nav-hoard-custom-style="true"]')) {
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.dataset.navHoardCustomStyle = 'true';
  document.head.appendChild(link);
}

loadCustomStyles();
