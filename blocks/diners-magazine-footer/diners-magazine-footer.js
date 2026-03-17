/**
 * diners-magazine-footer block
 *
 * Renders the original Diners Club footer HTML extracted from diners-revo/content.html,
 * styled with the same CSS assets from diners-revo/assets/.
 */

const REVO_PATH = '/blocks/diners-revo';
const FILES_MARKER = '_files/';

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

function rewriteAttr(el, attr) {
  const val = el.getAttribute(attr);
  if (!val) return;
  const filesIdx = val.indexOf(FILES_MARKER);
  if (filesIdx !== -1) {
    el.setAttribute(attr, `${REVO_PATH}/assets/${val.slice(filesIdx + FILES_MARKER.length)}`);
  } else if (val.startsWith('./assets/')) {
    el.setAttribute(attr, `${REVO_PATH}/assets/${val.slice('./assets/'.length)}`);
  }
}

export default async function decorate(block) {
  block.textContent = '';

  // Load original CSS assets (non-blocking)
  const cssFiles = ['module_v2.css', 'KnowledgeSyndication.css', 'aem_component.css', 'new_ac.css'];
  cssFiles.forEach((f) => loadCSS(`${REVO_PATH}/assets/${f}`));

  // Fetch revo content.html and extract the <footer> element
  const response = await fetch(`${REVO_PATH}/content.html`);
  if (!response.ok) {
    block.textContent = 'コンテンツの読み込みに失敗しました。';
    return;
  }

  const html = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Rewrite asset paths to point to revo/assets/
  doc.querySelectorAll('[src]').forEach((el) => rewriteAttr(el, 'src'));
  doc.querySelectorAll('[href]').forEach((el) => rewriteAttr(el, 'href'));

  // Preserve explicit img widths
  doc.querySelectorAll('img[width]').forEach((img) => {
    const w = parseInt(img.getAttribute('width'), 10);
    if (!Number.isNaN(w)) img.style.width = `${w}px`;
  });

  const footerEl = doc.querySelector('footer.dc__diners_footer');
  if (!footerEl) return;

  // Fix pagetop link: original href points to the revo page URL, rewrite to scroll-to-top
  const pagetopLink = footerEl.querySelector('a.dc__pagetop');
  if (pagetopLink) {
    pagetopLink.href = '#';
    pagetopLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'dmf-wrapper';
  wrapper.append(footerEl);

  block.append(wrapper);
}
