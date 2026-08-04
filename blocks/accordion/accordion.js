import { decorateBlock, loadBlock } from '../../scripts/aem.js';

/**
 * Blocks freely nested inside an accordion item's body (e.g. a Cards block
 * placed by the author) sit deeper than the single global decorateBlocks()
 * pass in aem.js reaches (it only scans `main > div.section > div > div`),
 * so they arrive un-decorated. Find and load them here instead.
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
    const [header, body] = row.children;

    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    if (header) summary.append(...header.childNodes);

    const details = document.createElement('details');
    details.className = 'accordion-item-details';
    if (i === 0) details.setAttribute('open', '');
    details.append(summary);

    if (body) {
      body.className = 'accordion-item-body';
      await decorateNestedBlocks(body);
      details.append(body);
    }

    row.replaceChildren(details);
  }));
}
