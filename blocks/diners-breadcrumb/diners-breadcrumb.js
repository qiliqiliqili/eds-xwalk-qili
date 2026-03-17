/**
 * diners-breadcrumb block
 *
 * Renders a breadcrumb trail with an optional page description beneath it,
 * matching the CCM013_Breadcrumb / .dc__breadcrumb structure from the original
 * Diners Club site.
 *
 * Block table layout (one row per entry):
 * ┌─────────────────────────────────────────────────────────────┐
 * │ [ダイナースクラブ クレジットカード](/ja/index.html)          │  ← linked crumb
 * │ [個人のお客様](/ja/pvt.html)                                │  ← linked crumb
 * │ [シグネチャー](/ja/magazine.html)                           │  ← linked crumb
 * │ [Interview](/ja/magazine/article/interview.html)            │  ← linked crumb
 * │ 日本料理の真心をいただく                                    │  ← current page (no link)
 * │ 天現寺境内の一角、緑に囲まれひっそりと佇む…                  │  ← description (no link)
 * └─────────────────────────────────────────────────────────────┘
 *
 * Rows containing an <a> element → linked breadcrumb items.
 * First row without an <a>      → current page label (aria-current="page").
 * Subsequent rows without an <a> → description text below the breadcrumb.
 */

export default function decorate(block) {
  // Collect all row cells
  const rows = [...block.querySelectorAll(':scope > div')];

  const items = [];
  rows.forEach((row) => {
    const cell = row.querySelector(':scope > div') || row;
    const anchor = cell.querySelector('a');
    const text = cell.textContent.trim();
    if (anchor) {
      items.push({ type: 'link', text: anchor.textContent.trim(), href: anchor.getAttribute('href') });
    } else {
      items.push({ type: 'text', text });
    }
  });

  // Split into: linked crumbs | current page | description lines
  let currentIndex = items.findIndex((it) => it.type === 'text');
  if (currentIndex === -1) currentIndex = items.length; // all linked — no current label

  const linkedCrumbs = items.slice(0, currentIndex);
  const currentItem = currentIndex < items.length ? items[currentIndex] : null;
  const descriptionItems = items.slice(currentIndex + 1);

  // ── Build breadcrumb nav ──────────────────────────────────────
  const nav = document.createElement('nav');
  nav.className = 'diners-breadcrumb-nav';
  nav.setAttribute('aria-label', 'パンくずリスト');

  const ol = document.createElement('ol');
  ol.setAttribute('itemscope', '');
  ol.setAttribute('itemtype', 'https://schema.org/BreadcrumbList');

  let position = 1;

  linkedCrumbs.forEach(({ text, href }) => {
    const li = document.createElement('li');
    li.setAttribute('itemprop', 'itemListElement');
    li.setAttribute('itemscope', '');
    li.setAttribute('itemtype', 'https://schema.org/ListItem');

    const a = document.createElement('a');
    a.setAttribute('itemprop', 'item');
    a.href = href;

    const span = document.createElement('span');
    span.setAttribute('itemprop', 'name');
    span.textContent = text;
    a.append(span);

    const meta = document.createElement('meta');
    meta.setAttribute('itemprop', 'position');
    meta.setAttribute('content', String(position));

    li.append(a, meta);
    ol.append(li);
    position += 1;
  });

  if (currentItem) {
    const li = document.createElement('li');
    li.setAttribute('itemprop', 'itemListElement');
    li.setAttribute('itemscope', '');
    li.setAttribute('itemtype', 'https://schema.org/ListItem');
    li.setAttribute('aria-current', 'page');

    const span = document.createElement('span');
    span.setAttribute('itemprop', 'name');
    span.textContent = currentItem.text;

    const meta = document.createElement('meta');
    meta.setAttribute('itemprop', 'position');
    meta.setAttribute('content', String(position));

    li.append(span, meta);
    ol.append(li);
  }

  nav.append(ol);

  // ── Build description area ────────────────────────────────────
  let descEl = null;
  if (descriptionItems.length > 0) {
    descEl = document.createElement('div');
    descEl.className = 'diners-breadcrumb-description';
    descriptionItems.forEach(({ text }) => {
      const p = document.createElement('p');
      p.textContent = text;
      descEl.append(p);
    });
  }

  // ── Replace block content ─────────────────────────────────────
  block.textContent = '';
  block.append(nav);
  if (descEl) block.append(descEl);
}
