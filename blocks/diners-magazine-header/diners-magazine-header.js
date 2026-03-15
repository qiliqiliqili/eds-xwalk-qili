/**
 * diners-magazine-header block
 *
 * Loads navigation from a fragment (path taken from the block's first link,
 * or falls back to /magazine-nav). Renders:
 *   - Logo linked to homepage
 *   - Hamburger toggle (mobile)
 *   - Main navigation with dropdown sub-menus
 *   - Magazine category sub-navigation tabs
 *
 * Fragment document expected structure
 * ─────────────────────────────────────
 * Section 1 (logo + main nav)
 *   picture / img  →  logo image linked to homepage
 *   ul             →  main nav list; nested ul = dropdown
 *
 * Section 2 (magazine sub-nav)
 *   ul             →  category link list; active link has class "active"
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
 * Build a three-bar hamburger button element.
 * @param {string} controls  id of the nav element it controls
 */
function buildHamburger(controls) {
  const btn = document.createElement('button');
  btn.className = 'dmh-hamburger-btn';
  btn.setAttribute('aria-label', 'メニューを開く');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', controls);
  btn.type = 'button';
  for (let i = 0; i < 3; i += 1) {
    const span = document.createElement('span');
    span.className = 'dmh-bar';
    btn.append(span);
  }
  return btn;
}

/**
 * Toggle the mobile nav panel open/closed.
 * @param {HTMLButtonElement} btn
 * @param {HTMLElement}       nav
 */
function toggleMobileNav(btn, nav) {
  const expanded = btn.getAttribute('aria-expanded') === 'true';
  btn.setAttribute('aria-expanded', String(!expanded));
  nav.setAttribute('aria-hidden', String(expanded));
  btn.setAttribute('aria-label', expanded ? 'メニューを開く' : 'メニューを閉じる');
}

/**
 * Set up desktop hover + keyboard dropdown behaviour on a nav-drop item.
 * @param {HTMLElement} item   <li> element with dmh-nav-drop class
 */
function wireDropdown(item) {
  const link = item.querySelector('.dmh-nav-link');
  const panel = item.querySelector('.dmh-dropdown');
  if (!link || !panel) return;

  const panelId = `dmh-drop-${Math.random().toString(36).slice(2, 7)}`;
  panel.id = panelId;
  link.setAttribute('aria-haspopup', 'true');
  link.setAttribute('aria-expanded', 'false');
  link.setAttribute('aria-controls', panelId);

  const open = () => {
    link.setAttribute('aria-expanded', 'true');
    panel.removeAttribute('hidden');
  };
  const close = () => {
    link.setAttribute('aria-expanded', 'false');
    panel.setAttribute('hidden', '');
  };

  // Desktop: hover
  item.addEventListener('mouseenter', open);
  item.addEventListener('mouseleave', close);

  // Keyboard / click
  link.addEventListener('click', (e) => {
    const isExpanded = link.getAttribute('aria-expanded') === 'true';
    if (isExpanded) {
      close();
    } else {
      // Close all other open dropdowns first
      const siblings = item.closest('.dmh-nav-list')?.querySelectorAll('.dmh-nav-drop');
      siblings?.forEach((s) => {
        if (s !== item) {
          s.querySelector('.dmh-nav-link')?.setAttribute('aria-expanded', 'false');
          const p = s.querySelector('.dmh-dropdown');
          if (p) p.setAttribute('hidden', '');
        }
      });
      open();
      e.preventDefault();
    }
  });

  // Close when focus leaves the item entirely
  item.addEventListener('focusout', (e) => {
    if (!item.contains(e.relatedTarget)) close();
  });

  // Initially hidden
  panel.setAttribute('hidden', '');
}

/**
 * Highlight the sub-nav tab whose href matches the current path.
 * @param {HTMLElement} subNav  .dmh-sub-nav element
 */
function setActiveSubNav(subNav) {
  const { pathname } = window.location;
  const links = subNav.querySelectorAll('a');
  links.forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (href && pathname.startsWith(href)) {
      a.classList.add('dmh-sub-nav-active');
      a.setAttribute('aria-current', 'page');
    }
  });
}

/* ─── main decorate ─────────────────────────────────────────── */

export default async function decorate(block) {
  // ── 1. Determine fragment path ──────────────────────────────
  const fragmentLink = block.querySelector('a[href]');
  const fragmentPath = fragmentLink
    ? new URL(fragmentLink.href).pathname
    : (getMetadata('magazine-nav-path') || '/magazine-nav');

  // Clear block markup while we load
  block.textContent = '';

  // ── 2. Load content ─────────────────────────────────────────
  // Priority: explicit link in block → content.html fallback → /magazine-nav fragment
  let fragment;
  if (fragmentLink) {
    // Explicit CMS fragment path provided in the block
    fragment = await loadFragment(fragmentPath);
  } else {
    // No path specified: try the bundled content.html first
    fragment = await loadContentHtml();
    // If content.html is missing, fall back to the default fragment path
    if (!fragment) {
      fragment = await loadFragment(fragmentPath);
    }
  }

  if (!fragment) {
    // Fail silently — header simply stays empty
    return;
  }

  const sections = [...fragment.querySelectorAll(':scope > .section')];
  const [logoNavSection, subNavSection, utilityNavSection] = sections;

  // ── 3. Build wrapper ────────────────────────────────────────
  const wrapper = document.createElement('div');
  wrapper.className = 'dmh-wrapper';

  /* ── 3a. Top bar (logo + hamburger) ── */
  const topBar = document.createElement('div');
  topBar.className = 'dmh-top-bar';

  // Logo
  const logoArea = document.createElement('div');
  logoArea.className = 'dmh-logo';
  if (logoNavSection) {
    const pic = logoNavSection.querySelector('picture, img');
    if (pic) {
      // Wrap in a home link if not already inside one
      const existingLink = pic.closest('a');
      if (existingLink) {
        logoArea.append(existingLink.cloneNode(true));
      } else {
        const a = document.createElement('a');
        a.href = '/';
        a.setAttribute('aria-label', 'Diners Club Japan ホームへ');
        a.append(pic.cloneNode(true));
        logoArea.append(a);
      }
    }
  }
  topBar.append(logoArea);

  /* ── 3a-2. Utility nav (top-right) ── */
  if (utilityNavSection) {
    const sourceUl = utilityNavSection.querySelector('ul');
    if (sourceUl) {
      const utilNav = document.createElement('nav');
      utilNav.className = 'dmh-utility-nav';
      utilNav.setAttribute('aria-label', 'ユーティリティナビゲーション');

      const utilList = document.createElement('ul');
      utilList.className = 'dmh-utility-list';

      [...sourceUl.children].forEach((srcLi) => {
        const li = document.createElement('li');
        const a = srcLi.querySelector('a');
        if (a) {
          const link = a.cloneNode(true);
          link.className = 'dmh-utility-link';
          if (a.dataset.variant === 'primary') {
            link.classList.add('dmh-utility-link--primary');
          }
          li.append(link);
        }
        utilList.append(li);
      });

      utilNav.append(utilList);
      topBar.append(utilNav);
    }
  }

  /* ── 3b. Main nav ── */
  const navMain = document.createElement('nav');
  navMain.className = 'dmh-nav-main';
  navMain.id = 'dmh-nav-main';
  navMain.setAttribute('aria-label', 'メインナビゲーション');
  navMain.setAttribute('aria-hidden', 'true');

  if (logoNavSection) {
    const sourceUl = logoNavSection.querySelector('ul');
    if (sourceUl) {
      const navList = document.createElement('ul');
      navList.className = 'dmh-nav-list';

      [...sourceUl.children].forEach((srcLi) => {
        const li = document.createElement('li');
        const topLink = srcLi.querySelector(':scope > a');

        // Clone the top-level link as the nav link
        if (topLink) {
          const a = topLink.cloneNode(true);
          a.className = 'dmh-nav-link';
          li.append(a);
        }

        // Check for nested ul → dropdown
        const nestedUl = srcLi.querySelector(':scope > ul');
        if (nestedUl) {
          li.classList.add('dmh-nav-drop');
          const panel = document.createElement('div');
          panel.className = 'dmh-dropdown';
          const innerUl = nestedUl.cloneNode(true);
          panel.append(innerUl);
          li.append(panel);
          wireDropdown(li);
        }

        navList.append(li);
      });

      navMain.append(navList);
    }
  }

  // Hamburger — toggles the nav bar (row 2), not navMain directly
  const hamburger = buildHamburger('dmh-nav-bar');
  topBar.append(hamburger);

  // Row 2: nav bar wrapping navMain (separate row on desktop, toggled on mobile)
  const navBar = document.createElement('div');
  navBar.className = 'dmh-nav-bar';
  navBar.id = 'dmh-nav-bar';
  navBar.setAttribute('aria-hidden', 'true');
  navBar.append(navMain);

  hamburger.addEventListener('click', () => {
    toggleMobileNav(hamburger, navBar);
  });

  // Close nav when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (
      hamburger.getAttribute('aria-expanded') === 'true'
      && !wrapper.contains(e.target)
    ) {
      toggleMobileNav(hamburger, navBar);
    }
  });

  wrapper.append(topBar);
  wrapper.append(navBar);

  /* ── 3c. Magazine sub-nav ── */
  const subNav = document.createElement('nav');
  subNav.className = 'dmh-sub-nav';
  subNav.setAttribute('aria-label', 'マガジンカテゴリー');

  if (subNavSection) {
    const sourceUl = subNavSection.querySelector('ul');
    if (sourceUl) {
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
    }
  }

  wrapper.append(subNav);

  // ── 4. Mount into block ─────────────────────────────────────
  block.append(wrapper);

  // ── 5. Add body padding so page content is not hidden under fixed header ──
  // Update on paint and again after fonts load (sub-nav height may change)
  const updateHeight = () => {
    const height = wrapper.offsetHeight;
    if (height) document.body.style.setProperty('--dmh-height', `${height}px`);
  };
  requestAnimationFrame(updateHeight);
  window.addEventListener('load', updateHeight);
}
