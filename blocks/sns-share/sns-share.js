/**
 * sns-share block
 *
 * Generates social share buttons for X (Twitter), Facebook, and LINE.
 * Opens each share URL in a centred popup window.
 *
 * The block table content is entirely optional — the block works with
 * an empty table (just the block name row in the document).
 *
 * Share URL patterns
 * ───────────────────
 * X/Twitter : https://twitter.com/intent/tweet?text={title}&url={url}
 * Facebook  : https://www.facebook.com/sharer/sharer.php?u={url}
 * LINE      : https://line.me/R/msg/text/?{title}%20{url}
 */

/* ─── Inline SVG icons (white, 20×20 view-box) ─────────────── */
const ICONS = {
  x: /* X/Twitter logo */ `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
         width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17
               l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08
               l4.256 5.627 5.908-5.627zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>`,

  facebook: /* Facebook "f" */ `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
         width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073
               C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41
               c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97
               h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49
               h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
    </svg>`,

  line: /* LINE bubble chat mark */ `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
         width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M19.365 9.863c.349 0 .63.285.63.631
               0 .345-.281.63-.63.63H17.61v1.125h1.755
               c.349 0 .63.283.63.63 0 .344-.281.629-.63.629
               h-2.386c-.345 0-.627-.285-.627-.629V8.108
               c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63
               0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016
               c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031
               a.64.64 0 01-.547-.31L12.21 10.51v2.369
               c0 .345-.282.629-.63.629-.345 0-.627-.284-.627-.629
               V8.108c0-.27.174-.51.432-.595a.63.63 0 01.747.279
               l2.122 2.885V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63
               v4.771zm-5.741 0c0 .344-.282.629-.631.629
               -.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63
               .346 0 .628.285.628.63v4.771zm-2.466.629H5.917
               c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63
               .348 0 .63.285.63.63v4.141h1.756c.348 0 .63.283.63.63
               0 .344-.282.629-.63.629M24 10.314
               C24 4.943 18.615.572 12 .572S0 4.943 0 10.314
               c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59
               .12.301.079.766.038 1.08l-.164 1.02
               c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975
               C23.176 14.393 24 12.458 24 10.314"/>
    </svg>`,
};

/* ─── helpers ──────────────────────────────────────────────── */

/**
 * Open a popup window centred on the screen.
 * @param {string} url
 * @param {string} name   window name (must be unique per platform)
 */
function openPopup(url, name) {
  const w = 550;
  const h = 450;
  const left = Math.round((window.screen.width - w) / 2);
  const top = Math.round((window.screen.height - h) / 2);
  window.open(
    url,
    name,
    `width=${w},height=${h},top=${top},left=${left},scrollbars=1,resizable=1`,
  );
}

/**
 * Build a single share button element.
 * @param {{ platform: string, label: string, color: string,
 *   icon: string, getUrl: () => string }} config
 */
function buildShareBtn({
  platform, label, color, icon, getUrl,
}) {
  const li = document.createElement('li');

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `sns-share-btn sns-share-${platform}`;
  btn.setAttribute('aria-label', label);
  btn.title = label;
  btn.style.setProperty('--sns-color', color);
  btn.innerHTML = icon;

  btn.addEventListener('click', () => {
    openPopup(getUrl(), `share-${platform}`);
  });

  li.append(btn);
  return li;
}

/* ─── main decorate ─────────────────────────────────────────── */

export default function decorate(block) {
  // Clear any author-provided content rows (the block works without them)
  block.textContent = '';
  block.className = block.className.replace(/\bsns-share\b/, '').trim();
  block.classList.add('sns-share');

  const list = document.createElement('ul');
  list.className = 'sns-share-list';
  list.setAttribute('role', 'list');

  // Share metadata is captured at render time
  const getTitle = () => encodeURIComponent(document.title);
  const getUrl = () => encodeURIComponent(window.location.href);

  const buttons = [
    {
      platform: 'x',
      label: 'X (Twitter) でシェア',
      color: '#000',
      icon: ICONS.x,
      getUrl: () => `https://twitter.com/intent/tweet?text=${getTitle()}&url=${getUrl()}`,
    },
    {
      platform: 'facebook',
      label: 'Facebook でシェア',
      color: '#1877f2',
      icon: ICONS.facebook,
      getUrl: () => `https://www.facebook.com/sharer/sharer.php?u=${getUrl()}`,
    },
    {
      platform: 'line',
      label: 'LINE でシェア',
      color: '#06C755',
      icon: ICONS.line,
      getUrl: () => `https://line.me/R/msg/text/?${getTitle()}%20${getUrl()}`,
    },
  ];

  buttons.forEach((config) => list.append(buildShareBtn(config)));

  block.append(list);
}
