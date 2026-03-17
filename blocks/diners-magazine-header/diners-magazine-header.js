/**
 * diners-magazine-header block
 *
 * Renders the original Diners Club header HTML extracted from diners-revo/content.html,
 * styled with the same CSS assets. Below the header, appends the magazine category
 * sub-nav built from this block's own content.html (Section 2).
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

function loadScript(src) {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = resolve;
    document.head.appendChild(script);
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

async function loadSubNavContent() {
  try {
    const url = new URL('./content.html', import.meta.url);
    const resp = await fetch(url);
    if (!resp.ok) return null;

    const main = document.createElement('main');
    const temp = document.createElement('div');
    temp.innerHTML = await resp.text();

    [...temp.children].forEach((child) => {
      if (child.nodeType !== Node.ELEMENT_NODE) return;
      const section = document.createElement('div');
      section.className = 'section';
      const wrapper = document.createElement('div');
      wrapper.className = 'default-content-wrapper';
      while (child.firstChild) wrapper.append(child.firstChild);
      section.append(wrapper);
      main.append(section);
    });

    return main;
  } catch {
    return null;
  }
}

function setActiveSubNav(subNav) {
  const { pathname } = window.location;
  subNav.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (href && pathname.startsWith(href)) {
      a.classList.add('dmh-sub-nav-active');
      a.setAttribute('aria-current', 'page');
    }
  });
}

export default async function decorate(block) {
  block.textContent = '';

  // Load original CSS assets (non-blocking)
  const cssFiles = ['module_v2.css', 'KnowledgeSyndication.css', 'aem_component.css', 'new_ac.css'];
  cssFiles.forEach((f) => loadCSS(`${REVO_PATH}/assets/${f}`));

  // Fetch revo content.html and extract the <header> element
  const response = await fetch(`${REVO_PATH}/content.html`);
  if (!response.ok) return;

  const html = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Rewrite asset paths to point to revo/assets/
  doc.querySelectorAll('[src]').forEach((el) => rewriteAttr(el, 'src'));
  doc.querySelectorAll('[href]').forEach((el) => rewriteAttr(el, 'href'));

  // Preserve explicit img widths before injecting
  doc.querySelectorAll('img[width]').forEach((img) => {
    const w = parseInt(img.getAttribute('width'), 10);
    if (!Number.isNaN(w)) img.style.width = `${w}px`;
  });

  const headerEl = doc.querySelector('header.dc__diners_header');
  if (!headerEl) return;

  // Convert <header> → <div> so common.js's $("header").css("position","fixed")
  // scroll handler cannot match and override our layout control.
  // All class-based selectors (.dc__diners_header, etc.) still work normally.
  const headerDiv = document.createElement('div');
  [...headerEl.attributes].forEach(({ name, value }) => headerDiv.setAttribute(name, value));
  while (headerEl.firstChild) headerDiv.appendChild(headerEl.firstChild);

  // Place the header inside a fixed wrapper.
  // module_v2.css sets .dc__diners_header { position: absolute }; override to relative
  // so the fixed .dmh-wrapper handles positioning.
  headerDiv.style.position = 'relative';

  const wrapper = document.createElement('div');
  wrapper.className = 'dmh-wrapper';
  wrapper.append(headerDiv);

  // ── Magazine sub-nav (Section 2 of this block's content.html) ──
  const fragment = await loadSubNavContent();
  if (fragment) {
    const sections = [...fragment.querySelectorAll(':scope > .section')];
    const subNavSection = sections[1]; // Section 2: magazine category tabs

    if (subNavSection) {
      const sourceUl = subNavSection.querySelector('ul');
      if (sourceUl) {
        const subNav = document.createElement('nav');
        subNav.className = 'dmh-sub-nav';
        subNav.setAttribute('aria-label', 'マガジンカテゴリー');

        const subList = document.createElement('ul');
        subList.className = 'dmh-sub-nav-list';

        [...sourceUl.children].forEach((srcLi) => {
          const a = srcLi.querySelector('a');
          const imgEl = srcLi.querySelector('img, picture');

          // SIGNATURE icon item: link contains only an image, no text
          if (imgEl && a && !a.textContent.trim()) {
            const li = document.createElement('li');
            li.className = 'dmh-sub-nav-logo-item';
            li.append(a.cloneNode(true));
            subList.append(li);
            return;
          }

          const li = document.createElement('li');
          if (a) {
            const link = a.cloneNode(true);
            if (srcLi.classList.contains('active') || a.classList.contains('active')) {
              link.classList.add('dmh-sub-nav-active');
            }
            li.append(link);
          } else {
            li.textContent = srcLi.textContent.trim();
          }
          subList.append(li);
        });

        subNav.append(subList);
        setActiveSubNav(subNav);
        wrapper.append(subNav);
      }
    }
  }

  block.append(wrapper);

  // ── Scroll: hide/show dc__menu_1 to replicate original sticky behavior ──────
  // At page top : full header visible (menu_1 + menu_2 + sub-nav).
  // On scroll   : menu_1 hides, only menu_2 + sub-nav remain fixed at top.
  // This mirrors what common.js originally did ($('#dc__menu_1').hide()),
  // but driven by our own listener so common.js's scroll handler is not needed.
  const menu1El = headerDiv.querySelector('#dc__menu_1');
  let isHeaderShrunk = false;

  window.addEventListener('scroll', () => {
    const scrolled = (window.scrollY || document.documentElement.scrollTop) > 82;
    if (scrolled === isHeaderShrunk) return;
    isHeaderShrunk = scrolled;
    if (menu1El) menu1El.style.display = scrolled ? 'none' : '';
  }, { passive: true });

  // ── Body padding: always based on the full wrapper height (menu_1 visible) ──
  // Body padding stays constant so the content never jumps when menu_1 hides.
  // Sets inline style directly so it overrides common.js's resize handler which
  // runs $("body").css("padding-top","12.2rem") when #dc__menu_2nd is absent.
  const updateHeight = () => {
    // Temporarily reveal menu_1 to measure the full header height accurately.
    const wasHidden = menu1El && menu1El.style.display === 'none';
    if (wasHidden) menu1El.style.display = '';
    const height = wrapper.offsetHeight;
    if (wasHidden) menu1El.style.display = 'none';
    if (height) {
      document.body.style.setProperty('--dmh-height', `${height}px`);
      document.body.style.paddingTop = `${height}px`;
    }
  };
  requestAnimationFrame(updateHeight);
  window.addEventListener('load', updateHeight);
  // Fires after common.js's resize handler (registered later → runs later).
  window.addEventListener('resize', updateHeight);

  // Load jQuery then common.js for header dropdown / SP menu interactivity
  await loadScript(`${REVO_PATH}/assets/jquery.min.js`);
  await loadScript(`${REVO_PATH}/assets/common.js`);

  // Disable common.js's scroll-based header position changes.
  // common.js checks $(window).data("fixed_header") === false to skip its scroll
  // handler entirely — our own listener above manages menu_1 show/hide instead.
  if (window.jQuery) window.jQuery(window).data('fixed_header', false);

  // Override body padding that common.js set during its $(function(){}) init.
  requestAnimationFrame(updateHeight);
}
