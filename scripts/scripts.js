import {
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
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
 * Reads an "Accordion Item" section's header text from its section metadata.
 * The model field is named `accordionHeading` (its label is "Accordion
 * Title"), and it isn't fully documented whether AEM renders the section
 * metadata table's key column from a field's `name` or its `label` — so
 * both possible resulting dataset keys are checked here.
 * @param {Element} section a decorated section element
 * @returns {string|undefined} the header text, if this is an Accordion Item
 */
function getAccordionHeading(section) {
  return section.dataset.accordionHeading ?? section.dataset.accordionTitle;
}

/**
 * Combines consecutive top-level "Accordion Item" sections into a single
 * accordion block. A Block cannot directly contain a Section in EDS's
 * content model (only one level of nesting is allowed: main > section >
 * default-content/blocks), so composite widgets like accordions and tabs
 * that need freely-authored content per item have to be modelled as
 * sections and combined client-side via auto-blocking — this is the
 * officially documented pattern (see aem.live "Content modeling for AEM
 * authoring projects").
 *
 * Each "Accordion Item" section carries its header text as section
 * metadata: authoring the "Accordion Title" field renders a
 * `div.section-metadata` block inside the section, which decorateSections()
 * (called just before this function) turns into a `section.dataset` entry
 * and strips it from the DOM. This function must therefore run after
 * decorateSections() but before decorateBlocks(), so the newly assembled
 * `.accordion` block still gets picked up by the normal block-loading flow.
 * @param {Element} main The container element
 */
function buildAccordionBlocks(main) {
  const sections = [...main.querySelectorAll(':scope > div.section')];
  let i = 0;
  while (i < sections.length) {
    if (getAccordionHeading(sections[i]) === undefined) {
      i += 1;
      // eslint-disable-next-line no-continue
      continue;
    }

    const group = [];
    while (i < sections.length && getAccordionHeading(sections[i]) !== undefined) {
      group.push(sections[i]);
      i += 1;
    }

    const accordion = document.createElement('div');
    accordion.className = 'accordion';
    group.forEach((section) => {
      const row = document.createElement('div');
      const header = document.createElement('div');
      header.className = 'accordion-item-header';
      header.textContent = getAccordionHeading(section);
      const body = document.createElement('div');
      body.className = 'accordion-item-body';
      body.append(...section.childNodes);
      row.append(header, body);
      accordion.append(row);
    });

    const replacement = document.createElement('div');
    replacement.className = 'section';
    replacement.dataset.sectionStatus = 'initialized';
    replacement.style.display = 'none';
    const wrapper = document.createElement('div');
    wrapper.append(accordion);
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
  buildAccordionBlocks(main);
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
