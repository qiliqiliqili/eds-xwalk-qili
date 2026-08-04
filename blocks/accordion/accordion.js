import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  [...block.children].forEach((row, i) => {
    row.classList.add('accordion-item');

    const label = row.children[0];
    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    moveInstrumentation(label, summary);
    summary.append(...label.childNodes);
    label.remove();

    const details = document.createElement('details');
    details.className = 'accordion-item-details';
    if (i === 0) details.setAttribute('open', '');
    details.append(summary);

    const body = row.children[0];
    if (body) {
      body.className = 'accordion-item-body';
      details.append(body);
    }

    row.replaceChildren(details);
  });
}
