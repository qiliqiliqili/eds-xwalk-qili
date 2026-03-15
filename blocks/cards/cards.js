import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/* ─── Recommends show-more ─────────────────────────────────────
 * When the block has the class `recommends`, only the first 4 cards
 * are visible initially. A "もっと見る" button reveals the next 4
 * on each click and hides itself when all cards are shown.
 * ─────────────────────────────────────────────────────────────── */
const RECOMMENDS_PAGE_SIZE = 4;

/**
 * Add progressive-reveal behaviour to a .cards.recommends block.
 * @param {HTMLElement} block  The block element (already contains the <ul>)
 */
function decorateRecommends(block) {
  const ul = block.querySelector('ul');
  if (!ul) return;

  const items = [...ul.querySelectorAll(':scope > li')];
  if (items.length <= RECOMMENDS_PAGE_SIZE) {
    // Nothing to paginate — all cards fit on the first page
    return;
  }

  // Hide items beyond the initial page
  items.slice(RECOMMENDS_PAGE_SIZE).forEach((li) => li.classList.add('hidden'));

  let visibleCount = RECOMMENDS_PAGE_SIZE;

  // Build "もっと見る" (show more) button
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'cards-show-more';
  btn.textContent = 'もっと見る';

  btn.addEventListener('click', () => {
    const nextBatch = items.slice(visibleCount, visibleCount + RECOMMENDS_PAGE_SIZE);
    nextBatch.forEach((li) => li.classList.remove('hidden'));
    visibleCount += nextBatch.length;

    // Hide the button when every card is visible
    if (visibleCount >= items.length) {
      btn.remove();
    }
  });

  block.append(btn);
}

/* ─── Main decorate ────────────────────────────────────────────── */
export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.replaceChildren(ul);

  // Add show-more behaviour for the recommends variant
  if (block.classList.contains('recommends')) {
    decorateRecommends(block);
  }
}
