import { moveInstrumentation } from '../../scripts/scripts.js';

let tabsGroupId = 0;

export default function decorate(block) {
  const groupId = tabsGroupId;
  tabsGroupId += 1;

  const tablist = document.createElement('div');
  tablist.className = 'tabs-list';
  tablist.setAttribute('role', 'tablist');

  [...block.children].forEach((row, i) => {
    const id = `tabs-${groupId}-${i}`;
    const [labelWrapper, panel] = row.children;

    panel.className = 'tabs-panel';
    panel.id = `tabpanel-${id}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `tab-${id}`);
    if (i !== 0) panel.setAttribute('hidden', '');

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tabs-tab';
    button.id = `tab-${id}`;
    button.innerHTML = labelWrapper.innerHTML;
    moveInstrumentation(labelWrapper, button);
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', `tabpanel-${id}`);
    button.setAttribute('aria-selected', i === 0);
    button.addEventListener('click', () => {
      tablist.querySelectorAll('[role="tab"]').forEach((tab) => tab.setAttribute('aria-selected', 'false'));
      block.querySelectorAll('[role="tabpanel"]').forEach((tp) => tp.setAttribute('hidden', ''));
      button.setAttribute('aria-selected', 'true');
      panel.removeAttribute('hidden');
    });

    tablist.append(button);
    labelWrapper.remove();
    row.className = 'tabs-panel-wrapper';
  });

  block.prepend(tablist);
}
