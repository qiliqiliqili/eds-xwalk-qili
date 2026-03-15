import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/* ─── Recommends show-more ─────────────────────────────────────
 * Matches AES-js-more8to4 behaviour:
 *   - Initially show 8 cards (RECOMMENDS_INITIAL)
 *   - "もっと見る" only appears when total cards > 8
 *   - Each click reveals 4 more cards (RECOMMENDS_PAGE_SIZE)
 * ─────────────────────────────────────────────────────────────── */
const RECOMMENDS_INITIAL = 8;
const RECOMMENDS_PAGE_SIZE = 4;

/**
 * Add progressive-reveal behaviour to a .cards.recommends block.
 * @param {HTMLElement} block  The block element (already contains the <ul>)
 */
function decorateRecommends(block) {
  const ul = block.querySelector('ul');
  if (!ul) return;

  const items = [...ul.querySelectorAll(':scope > li')];
  if (items.length <= RECOMMENDS_INITIAL) {
    // 8枚以下なら「もっと見る」ボタン不要
    return;
  }

  // Hide items beyond the initial 8
  items.slice(RECOMMENDS_INITIAL).forEach((li) => li.classList.add('hidden'));

  let visibleCount = RECOMMENDS_INITIAL;

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
