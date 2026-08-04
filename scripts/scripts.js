import {
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateBlock,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadBlock,
  loadCSS,
  getMetadata,
  buildBlock,
} from './aem.js';

/**
 * Moves all the attributes from a given elmenet to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveAttributes(from, to, attributes) {
  if (!attributes) {
    // eslint-disable-next-line no-param-reassign
    attributes = [...from.attributes].map(({ nodeName }) => nodeName);
  }
  attributes.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to?.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

/**
 * Move instrumentation attributes from a given element to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds a hero block from a page's first heading and first picture, when the
 * picture appears before the heading in document order. This lets an author
 * drop a plain image + title at the top of the page without ever placing a
 * "Hero" block themselves; the block is synthesized at render time instead.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildHeroBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Finds blocks freely nested inside auto-blocked section content (e.g. a
 * Cards block placed inside a "Section Tab") and loads them. They sit
 * deeper than the single global decorateBlocks() pass in aem.js reaches (it
 * only scans `main > div.section > div > div`), so they arrive un-decorated.
 * @param {Element} container the container to scan
 */
async function decorateNestedBlocks(container) {
  const blocks = [...container.querySelectorAll(':scope > div > div')]
    .filter((el) => el.className);
  blocks.forEach(decorateBlock);
  await Promise.all(blocks.map(loadBlock));
}

/**
 * Combines consecutive top-level "Section Tab" sections into a single tabs
 * block, following the exact pattern from aem.live's "Content modeling for
 * AEM authoring projects": a Block cannot directly contain a Section in
 * EDS's content model (only one level of nesting is allowed: main > section
 * > default-content/blocks), so composite widgets like tabs and accordions
 * that need freely-authored content per item have to be modelled as
 * sections and combined client-side via auto-blocking. This mirrors the
 * documentation's own "Tab" example (resourceType
 * core/franklin/components/section/v1/section, template.filter: "section"),
 * renamed to "Section Tab" only to avoid an id clash with the Tabs block's
 * own "tab" item.
 *
 * The resulting markup exactly matches what the Tabs block
 * (blocks/tabs/tabs.js) expects from a manually-authored "Tab" item — one
 * row per section, with a label cell and a content cell — so the same
 * `.tabs` block class is used and no separate rendering code is needed:
 * two different authoring paths (placing a "Tabs" block by hand, or writing
 * consecutive "Section Tab" sections) converge on the same block.
 *
 * The "Section Tab" marker and its label come from the section's own model
 * field ("Tab Label"), which AEM appends to the section as metadata;
 * decorateSections() (called just before this function) turns that into
 * `section.dataset` entries. Must run after decorateSections() but before
 * decorateBlocks(), so the newly assembled `.tabs` block still gets picked
 * up by the normal block-loading flow.
 * @param {Element} main The container element
 */
function buildSectionTabsBlocks(main) {
  const getLabel = (section) => section.dataset.tabLabel ?? section.dataset.label;

  const sections = [...main.querySelectorAll(':scope > div.section')];
  let i = 0;
  while (i < sections.length) {
    if (getLabel(sections[i]) === undefined) {
      i += 1;
      // eslint-disable-next-line no-continue
      continue;
    }

    const group = [];
    while (i < sections.length && getLabel(sections[i]) !== undefined) {
      group.push(sections[i]);
      i += 1;
    }

    const tabs = document.createElement('div');
    tabs.className = 'tabs';
    group.forEach((section) => {
      const row = document.createElement('div');
      const label = document.createElement('div');
      // Non-empty classNames protect these cells from aem.js's wrapTextNodes(),
      // which otherwise treats an un-classed cell containing a nested block
      // (e.g. a Cards block placed inside this Section Tab) as a plain text
      // cell and corrupts it. tabs.js overwrites both classNames anyway.
      label.className = 'tabs-tab-raw';
      label.textContent = getLabel(section);
      const content = document.createElement('div');
      content.className = 'tabs-panel-raw';
      content.append(...section.childNodes);
      decorateNestedBlocks(content).catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Failed to decorate a block nested in a Section Tab', error);
      });
      row.append(label, content);
      tabs.append(row);
    });

    const replacement = document.createElement('div');
    replacement.className = 'section';
    replacement.dataset.sectionStatus = 'initialized';
    replacement.style.display = 'none';
    const wrapper = document.createElement('div');
    wrapper.append(tabs);
    replacement.append(wrapper);

    group[0].replaceWith(replacement);
    group.slice(1).forEach((section) => section.remove());
  }
}

/**
 * Adds .caption class to paragraphs that immediately follow an image
 * inside magazine article body sections.
 * Needed because EDS xwalk renders Image components as <p><picture>…</picture></p>,
 * making plain `picture + p` CSS selectors ineffective.
 * @param {Element} main
 */
/**
 * Adds .caption to a paragraph that immediately follows an image element.
 * Handles three possible DOM shapes produced by EDS xwalk / plain HTML:
 *   a) xwalk:     div[data-aue] > picture  +  div[data-aue] > p
 *   b) plain HTML: p > picture             +  p
 *   c) plain HTML: picture (direct)        +  p (direct)
 */
function decorateMagazineCaptions(main) {
  main.querySelectorAll('.section.magazine-article-body .default-content-wrapper').forEach((wrapper) => {
    const items = [...wrapper.children];
    items.forEach((el, i) => {
      const hasImage = el.querySelector('picture, img')
        || el.matches('picture')
        || el.matches('img');
      if (!hasImage) return;
      const next = items[i + 1];
      if (!next) return;
      // Caption lives in next element's first <p>, or next itself if it is a <p>
      const caption = next.matches('p') ? next : next.querySelector('p');
      if (caption) caption.classList.add('caption');
    });
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  buildSectionTabsBlocks(main);
  decorateBlocks(main);
  decorateMagazineCaptions(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  if (getMetadata('hide-header') !== 'true') loadHeader(doc.querySelector('header'));
  if (getMetadata('hide-footer') !== 'true') loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);

  // Load template-specific CSS (e.g. styles/magazine.css for template=magazine pages)
  const template = getMetadata('template');
  if (template) loadCSS(`${window.hlx.codeBasePath}/styles/${template}.css`);

  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
