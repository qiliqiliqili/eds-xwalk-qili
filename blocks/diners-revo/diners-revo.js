/**
 * Diners Club - Revolving Payment page (静的コンテンツブロック / Static content block)
 * This block is NOT for authoring. It renders the preserved Diners Club
 * revolving payment page (リボルビング払い) with all its original assets.
 */

const BLOCK_PATH = '/blocks/diners-revo';

function loadCSS(href) {
  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = resolve;
    link.onerror = resolve;
    document.head.appendChild(link);
  });
}

function loadScript(src) {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = resolve;
    document.head.appendChild(script);
  });
}

async function loadStylesheets() {
  const cssFiles = [
    'module_v2.css',
    'KnowledgeSyndication.css',
    'aem_component.css',
    'new_ac.css',
    'revo.css',
  ];
  await Promise.all(cssFiles.map((f) => loadCSS(`${BLOCK_PATH}/assets/${f}`)));
}

async function loadScripts() {
  // Load jQuery and plugins sequentially (order matters)
  const scripts = [
    'jquery.min.js',
    'jquery-ui.min.js',
    'jquery.tmpl.min.js',
    'jquery.ui.touch-punch.min.js',
    'slick.min.js',
    'common.js',
    'card_detail.js',
    'slider.js',
    'matchHeight.js',
    'matchHeight_set.js',
    'modify.js',
  ];
  await scripts.reduce(
    (promise, s) => promise.then(() => loadScript(`${BLOCK_PATH}/assets/${s}`)),
    Promise.resolve(),
  );
}

export default async function decorate(block) {
  // Load CSS first (non-blocking render)
  loadStylesheets();

  // Fetch the preserved HTML content
  const response = await fetch(`${BLOCK_PATH}/content.html`);
  if (!response.ok) {
    block.textContent = 'コンテンツの読み込みに失敗しました。';
    return;
  }

  const html = await response.text();

  // Parse and extract <body> content
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Rewrite asset paths to be absolute from block path
  doc.querySelectorAll('[src]').forEach((el) => {
    const src = el.getAttribute('src');
    if (src && src.startsWith('./assets/')) {
      el.setAttribute('src', `${BLOCK_PATH}/assets/${src.slice('./assets/'.length)}`);
    }
  });
  doc.querySelectorAll('[href]').forEach((el) => {
    const href = el.getAttribute('href');
    if (href && href.startsWith('./assets/')) {
      el.setAttribute('href', `${BLOCK_PATH}/assets/${href.slice('./assets/'.length)}`);
    }
  });

  // Inject body content into block
  const wrapper = document.createElement('div');
  wrapper.className = 'diners-revo-content';
  wrapper.innerHTML = doc.body.innerHTML;
  block.replaceChildren(wrapper);

  // Load functional scripts after content is in DOM
  await loadScripts();
}
