/**
 * diners-magazine-footer block
 *
 * Loads footer content from a fragment (path from the block's first link,
 * or falls back to /magazine-footer). Renders:
 *   - Page-top scroll button (fixed bottom-right)
 *   - FAQ + Application buttons columns
 *   - Footer link rows
 *   - SNS icon links
 *   - Copyright bar with logo and text
 *
 * Fragment document expected structure
 * ─────────────────────────────────────
 * Section 1  H2 "よくあるご質問"   + UL of FAQ links
 * Section 2  H2 "お申し込み"       + UL of application links (2 items expected)
 * Section 3  H2 "リンク"           + one or more ULs of footer links
 * Section 4  H2 "SNS"             + UL of SNS links (text = platform name)
 * Section 5  P  copyright text (may contain a logo image)
 */

import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/* ─── content.html fallback ─────────────────────────────────
 * Loads the bundled content.html from the block directory and
 * wraps each top-level <div> into a .section > .default-content-wrapper
 * so the rest of the code can treat it identically to a loadFragment result.
 * ─────────────────────────────────────────────────────────── */
async function loadContentHtml() {
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

/* ─── helpers ──────────────────────────────────────────────── */

/**
 * Extract the first section element whose H2 text matches the given label.
 * Falls back to matching by section index if no H2 found.
 * @param {HTMLElement[]} sections
 * @param {number}        index    0-based fallback index
 * @param {string}        [label] optional text to search for
 */
function getSection(sections, index, label) {
  if (label) {
    const found = sections.find((s) => {
      const h2 = s.querySelector('h2');
      return h2 && h2.textContent.trim().includes(label);
    });
    if (found) return found;
  }
  return sections[index] || null;
}

/**
 * Build the page-top button that scrolls the page to the top.
 */
function buildPageTopBtn() {
  const btn = document.createElement('button');
  btn.className = 'dmf-pagetop';
  btn.setAttribute('aria-label', 'ページトップへ');
  btn.type = 'button';
  btn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"
         fill="none" stroke="currentColor" stroke-width="2.5"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  `;
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Show/hide based on scroll position
  const onScroll = () => {
    btn.classList.toggle('dmf-pagetop--visible', window.scrollY > 300);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  return btn;
}

/**
 * Build the FAQ + Application two-column section.
 * @param {HTMLElement|null} faqSection
 * @param {HTMLElement|null} applySection
 */
function buildColumns(faqSection, applySection) {
  const columns = document.createElement('div');
  columns.className = 'dmf-columns';

  /* ── FAQ column ── */
  const faqCol = document.createElement('div');
  faqCol.className = 'dmf-col-faq';

  if (faqSection) {
    const heading = faqSection.querySelector('h2');
    if (heading) {
      const titleRow = document.createElement('div');
      titleRow.className = 'dmf-section-title-row';

      const h = document.createElement('p');
      h.className = 'dmf-section-title';
      h.textContent = heading.childNodes[0]?.textContent?.trim() || heading.textContent.trim();
      titleRow.append(h);

      // 「一覧へ」link inside the H2
      const listLink = heading.querySelector('a');
      if (listLink) {
        const a = document.createElement('a');
        a.href = listLink.href;
        a.textContent = listLink.textContent.trim();
        a.className = 'dmf-faq-list-link';
        if (listLink.target) a.target = listLink.target;
        if (listLink.rel) a.rel = listLink.rel;
        titleRow.append(a);
      }

      faqCol.append(titleRow);
    }

    const ul = faqSection.querySelector('ul');
    if (ul) {
      const list = document.createElement('ul');
      list.className = 'dmf-faq-list';
      [...ul.querySelectorAll('li')].forEach((srcLi) => {
        const li = document.createElement('li');
        const a = srcLi.querySelector('a');
        if (a) {
          const link = document.createElement('a');
          link.href = a.href;
          link.textContent = a.textContent.trim();
          li.append(link);
        } else {
          li.textContent = srcLi.textContent.trim();
        }
        list.append(li);
      });
      faqCol.append(list);
    }
  }

  /* ── Application column ── */
  const applyCol = document.createElement('div');
  applyCol.className = 'dmf-col-apply';

  if (applySection) {
    const heading = applySection.querySelector('h2');
    if (heading) {
      const h = document.createElement('p');
      h.className = 'dmf-section-title';
      h.textContent = heading.textContent.trim();
      applyCol.append(h);
    }

    const ul = applySection.querySelector('ul');
    if (ul) {
      [...ul.querySelectorAll('li')].forEach((srcLi) => {
        const a = srcLi.querySelector('a');
        const btn = document.createElement('a');
        btn.className = 'dmf-apply-btn';
        if (a) {
          btn.href = a.href;
          btn.textContent = a.textContent.trim();
        } else {
          btn.href = '#';
          btn.textContent = srcLi.textContent.trim();
        }
        applyCol.append(btn);
      });
    }
  }

  columns.append(faqCol, applyCol);
  return columns;
}

/**
 * Build the footer link lists section.
 * @param {HTMLElement|null} linksSection
 */
function buildFooterLinks(linksSection) {
  const wrapper = document.createElement('div');
  wrapper.className = 'dmf-links';

  if (!linksSection) return wrapper;

  const heading = linksSection.querySelector('h2');
  if (heading) {
    const h = document.createElement('p');
    h.className = 'dmf-section-title';
    h.textContent = heading.textContent.trim();
    wrapper.append(h);
  }

  const uls = linksSection.querySelectorAll('ul');
  uls.forEach((ul) => {
    const row = document.createElement('ul');
    row.className = 'dmf-links-row';
    [...ul.querySelectorAll('li')].forEach((srcLi) => {
      const li = document.createElement('li');
      const a = srcLi.querySelector('a');
      if (a) {
        const link = document.createElement('a');
        link.href = a.href;
        link.textContent = a.textContent.trim();
        li.append(link);
      } else {
        li.textContent = srcLi.textContent.trim();
      }
      row.append(li);
    });
    wrapper.append(row);
  });

  return wrapper;
}

/** Map platform names to SVG icon markup (white, 24×24). */
const SNS_ICONS = {
  twitter: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.256 5.627 5.908-5.627zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>`,
  x: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.256 5.627 5.908-5.627zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>`,
  facebook: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
  </svg>`,
  instagram: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>`,
  youtube: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>`,
};

/**
 * Get an SVG icon string for a given platform name.
 * @param {string} name  e.g. "Twitter", "Facebook"
 */
function getSnsIcon(name) {
  const key = name.toLowerCase().replace(/[^a-z]/g, '');
  return SNS_ICONS[key] || `<span aria-hidden="true">${name[0]}</span>`;
}

/**
 * Build the SNS row.
 * @param {HTMLElement|null} snsSection
 */
function buildSnsRow(snsSection) {
  const wrapper = document.createElement('div');
  wrapper.className = 'dmf-sns';

  if (!snsSection) return wrapper;

  const ul = snsSection.querySelector('ul');
  if (!ul) return wrapper;

  const list = document.createElement('ul');
  list.className = 'dmf-sns-list';

  [...ul.querySelectorAll('li')].forEach((srcLi) => {
    const a = srcLi.querySelector('a');
    const li = document.createElement('li');
    const link = document.createElement('a');
    const name = (a ? a.textContent : srcLi.textContent).trim();
    link.href = a ? a.href : '#';
    link.className = 'dmf-sns-link';
    link.setAttribute('aria-label', name);
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    link.innerHTML = getSnsIcon(name);
    li.append(link);
    list.append(li);
  });

  wrapper.append(list);
  return wrapper;
}

/**
 * Build the copyright bar.
 * Matches the original page layout:
 *   Left   – corporate logo (linked) from first <p> containing <img>
 *   Center – copyright text from first text-only <p>
 *   Right  – utility icon links from <ul> (remote operator, international)
 *
 * @param {HTMLElement|null} copyrightSection
 */
function buildCopyright(copyrightSection) {
  const bar = document.createElement('div');
  bar.className = 'dmf-copyright';

  if (!copyrightSection) {
    const inner = document.createElement('div');
    inner.className = 'dmf-copyright-inner';
    const p = document.createElement('p');
    p.className = 'dmf-copyright-text';
    p.textContent = `© ${new Date().getFullYear()} Diners Club Japan. All rights reserved.`;
    inner.append(p);
    bar.append(inner);
    return bar;
  }

  const inner = document.createElement('div');
  inner.className = 'dmf-copyright-inner';

  // ── Left: corporate logo ──
  const logoP = copyrightSection.querySelector('p:has(img), p:has(picture)');
  if (logoP) {
    const logoWrap = document.createElement('div');
    logoWrap.className = 'dmf-copyright-logo';
    const a = logoP.querySelector('a');
    if (a) {
      logoWrap.append(a.cloneNode(true));
    } else {
      const img = logoP.querySelector('picture, img');
      if (img) logoWrap.append(img.cloneNode(true));
    }
    inner.append(logoWrap);
  }

  // ── Center: copyright text ──
  const textP = [...copyrightSection.querySelectorAll('p')].find(
    (p) => !p.querySelector('img, picture') && p.textContent.trim(),
  );
  if (textP) {
    const p = document.createElement('p');
    p.className = 'dmf-copyright-text';
    p.textContent = textP.textContent.trim();
    inner.append(p);
  }

  // ── Right: utility icon links (remote operator, international) ──
  const iconUl = copyrightSection.querySelector('ul');
  if (iconUl) {
    const iconsWrap = document.createElement('div');
    iconsWrap.className = 'dmf-copyright-icons';
    [...iconUl.querySelectorAll('li')].forEach((li) => {
      const a = li.querySelector('a');
      if (a) iconsWrap.append(a.cloneNode(true));
    });
    inner.append(iconsWrap);
  }

  bar.append(inner);
  return bar;
}

/* ─── main decorate ─────────────────────────────────────────── */

export default async function decorate(block) {
  // ── 1. Determine fragment path ──────────────────────────────
  const fragmentLink = block.querySelector('a[href]');
  const fragmentPath = fragmentLink
    ? new URL(fragmentLink.href).pathname
    : (getMetadata('magazine-footer-path') || '/magazine-footer');

  // Clear block while loading
  block.textContent = '';

  // ── 2. Build page-top button (added to document body) ───────
  const pageTopBtn = buildPageTopBtn();
  document.body.append(pageTopBtn);

  // ── 3. Load content ─────────────────────────────────────────
  // Priority: explicit link in block → content.html fallback → /magazine-footer fragment
  /** @type {HTMLElement | null} */
  let fragment;
  if (fragmentLink) {
    fragment = /** @type {HTMLElement | null} */ (await Promise.resolve(loadFragment(fragmentPath)));
  } else {
    fragment = await loadContentHtml();
    if (!fragment) {
      fragment = /** @type {HTMLElement | null} */ (await Promise.resolve(loadFragment(fragmentPath)));
    }
  }

  const sections = fragment
    ? [...fragment.querySelectorAll(':scope > .section')]
    : [];

  const faqSection     = getSection(sections, 0, 'よくあるご質問');
  const applySection   = getSection(sections, 1, 'お申し込み');
  const linksSection   = getSection(sections, 2, 'リンク');
  const snsSection     = getSection(sections, 3, 'SNS');
  const copyrightSection = getSection(sections, 4);

  // ── 4. Compose footer HTML ──────────────────────────────────
  const wrapper = document.createElement('div');
  wrapper.className = 'dmf-wrapper';

  const content = document.createElement('div');
  content.className = 'dmf-content';

  // FAQ + Apply columns
  content.append(buildColumns(faqSection, applySection));

  // Horizontal rule separator
  const hr = document.createElement('hr');
  hr.className = 'dmf-divider';
  content.append(hr);

  // Footer links
  content.append(buildFooterLinks(linksSection));

  // SNS row
  content.append(buildSnsRow(snsSection));

  wrapper.append(content);

  // Copyright bar (full-width, outside content max-width)
  wrapper.append(buildCopyright(copyrightSection));

  block.append(wrapper);
}
