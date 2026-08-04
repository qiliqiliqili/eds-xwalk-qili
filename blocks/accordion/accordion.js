import { decorateBlock, loadBlock } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Each accordion-item is authored as a free-form Section (resourceType
 * core/franklin/components/section/v1/section), so its content arrives flat
 * (no fixed fields). This mirrors the grouping aem.js's decorateSections()
 * does for top-level sections, scoped to one accordion item instead of
 * main's direct children, so nested blocks can be found the same way
 * decorateBlocks() finds them at the page level.
 * @param {Element} container the accordion-item body
 */
function wrapContent(container) {
  const wrappers = [];
  let defaultContent = false;
  [...container.children].forEach((e) => {
    if ((e.tagName === 'DIV' && e.className) || !defaultContent) {
      const wrapper = document.createElement('div');
      wrappers.push(wrapper);
      defaultContent = e.tagName !== 'DIV' || !e.className;
      if (defaultContent) wrapper.classList.add('default-content-wrapper');
    }
    wrappers[wrappers.length - 1].append(e);
  });
  wrappers.forEach((wrapper) => container.append(wrapper));
}

/**
 * Decorates and loads any blocks freely placed inside an accordion item,
 * since decorateBlocks()/loadBlock() in aem.js only scan one level below
 * <main> and never see blocks nested inside another block.
 * @param {Element} container the accordion-item body
 */
async function decorateNestedBlocks(container) {
  const blocks = [...container.querySelectorAll(':scope > div > div')]
    .filter((el) => el.className);
  blocks.forEach(decorateBlock);
  await Promise.all(blocks.map(loadBlock));
}

export default async function decorate(block) {
  const rows = [...block.children];
  await Promise.all(rows.map(async (row, i) => {
    row.classList.add('accordion-item');

    // The first freely-placed component becomes the clickable header;
    // everything after it becomes the body.
    const header = row.firstElementChild;
    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    if (header) {
      moveInstrumentation(header, summary);
      summary.append(...header.childNodes);
      header.remove();
    }

    const body = document.createElement('div');
    body.className = 'accordion-item-body';
    body.append(...row.childNodes);
    wrapContent(body);
    await decorateNestedBlocks(body);

    const details = document.createElement('details');
    details.className = 'accordion-item-details';
    if (i === 0) details.setAttribute('open', '');
    details.append(summary, body);

    row.replaceChildren(details);
  }));
}
