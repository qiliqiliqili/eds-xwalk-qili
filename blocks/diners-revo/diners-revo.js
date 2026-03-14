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

  // Rewrite asset paths to be absolute from block path.
  // content.html uses NFD Unicode in the directory prefix (e.g. "_files/"),
  // so match by the stable "_files/" suffix instead of the full NFD prefix.
  const FILES_MARKER = '_files/';

  function rewriteAttr(el, attr) {
    const val = el.getAttribute(attr);
    if (!val) return;
    const filesIdx = val.indexOf(FILES_MARKER);
    if (filesIdx !== -1) {
      // e.g. "./リボ..._files/logo.png" → "/blocks/diners-revo/assets/logo.png"
      el.setAttribute(attr, `${BLOCK_PATH}/assets/${val.slice(filesIdx + FILES_MARKER.length)}`);
    } else if (val.startsWith('./assets/')) {
      el.setAttribute(attr, `${BLOCK_PATH}/assets/${val.slice('./assets/'.length)}`);
    }
  }

  doc.querySelectorAll('[src]').forEach((el) => rewriteAttr(el, 'src'));
  doc.querySelectorAll('[href]').forEach((el) => rewriteAttr(el, 'href'));

  // Inject body content into block
  const wrapper = document.createElement('div');
  wrapper.className = 'diners-revo-content';
  wrapper.innerHTML = doc.body.innerHTML;
  block.replaceChildren(wrapper);

  // Initialize AEM accordion (data-cmp-is="accordion").
  // CSS: .AES-acd .cmp-accordion__item[data-cmp-expanded='']
  // .cmp-accordion__panel { display:block }
  // Toggle data-cmp-expanded="" on the item and is-active on the header.
  wrapper.querySelectorAll('[data-cmp-is="accordion"]').forEach((accordion) => {
    accordion.querySelectorAll('[data-cmp-hook-accordion="button"]').forEach((button) => {
      const item = button.closest('[data-cmp-hook-accordion="item"]');
      const header = button.closest('.cmp-accordion__header');
      if (!item) return;
      button.addEventListener('click', () => {
        const isExpanded = item.hasAttribute('data-cmp-expanded');
        if (isExpanded) {
          item.removeAttribute('data-cmp-expanded');
          header?.classList.remove('is-active');
        } else {
          item.setAttribute('data-cmp-expanded', '');
          header?.classList.add('is-active');
        }
      });
    });
  });

  // Load functional scripts after content is in DOM
  await loadScripts();
}
