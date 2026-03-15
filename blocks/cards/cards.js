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

/**
 * Post-process card bodies in the recommends variant:
 * 1. Ensure semantic classes exist on paragraphs (in case content comes from
 *    EDS richtext without custom classes).
 * 2. Remove the "button" class that EDS decorateButtons() injects on <a>
 *    elements inside lone-link paragraphs — those classes trigger the heavy
 *    pill-button styles from styles.css and must be stripped here in JS so
 *    that CSS overrides are not needed.
 * @param {HTMLElement} ul  The decorated <ul> element
 */
function decorateRecommendsCards(ul) {
  ul.querySelectorAll(':scope > li').forEach((li) => {
    const body = li.querySelector('.cards-card-body');
    if (!body) return;

    // Assign semantic classes to the first two block-level children if missing
    const paras = [...body.querySelectorAll(':scope > p')];
    if (paras[0] && !paras[0].classList.contains('cards-card-meta')) {
      paras[0].classList.add('cards-card-meta');
    }
    if (paras[1] && !paras[1].classList.contains('cards-card-title')) {
      paras[1].classList.add('cards-card-title');
    }

    // Remove EDS button decoration from every link inside the card body.
    // decorateButtons() adds class="button" (and "button-container" on the
    // parent <p>) which triggers unwanted pill-button styles in styles.css.
    body.querySelectorAll('a').forEach((a) => {
      a.classList.remove('button', 'button-primary', 'button-secondary');
      if (a.parentElement) {
        a.parentElement.classList.remove('button-container');
      }
    });
  });
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

  // Recommends-specific processing
  if (block.classList.contains('recommends')) {
    decorateRecommendsCards(ul);
    decorateRecommends(block);
  }
}
