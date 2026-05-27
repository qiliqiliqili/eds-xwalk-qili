/**
 * Esignature — PDF flipbook block.
 *
 * Authoring (Universal Editor):
 *   Add the "Esignature" block, then use the "PDF Document" reference
 *   picker to select a PDF from the DAM.  The block renders the PDF as a
 *   two-page spread flipbook with a CSS 3-D page-turn animation.
 *
 * Expected block HTML (produced by UE for a reference field):
 *   <div class="esignature block">
 *     <div><div><a href="/path/to/file.pdf">label</a></div></div>
 *   </div>
 */

/* ── PDF.js via cdnjs (UMD build — sets window.pdfjsLib) ────────────────── */
const PDFJS_SCRIPT = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const FLIP_MS = 650; // must match --esig-flip-dur in CSS

// ── Helpers ───────────────────────────────────────────────────────────────

let pdfjsLoadingPromise = null;

function loadPdfJs() {
  /* Cache so multiple block instances share one library load. */
  if (pdfjsLoadingPromise) return pdfjsLoadingPromise;
  pdfjsLoadingPromise = new Promise((resolve, reject) => {
    if (window.pdfjsLib) { resolve(window.pdfjsLib); return; }
    const s = document.createElement('script');
    s.src = PDFJS_SCRIPT;
    s.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      resolve(window.pdfjsLib);
    };
    s.onerror = () => reject(new Error(`Failed to load PDF.js from ${PDFJS_SCRIPT}`));
    document.head.appendChild(s);
  });
  return pdfjsLoadingPromise;
}

function getPdfUrl(block) {
  /* UE renders reference fields as <a href="…"> for non-image assets. */
  const anchor = block.querySelector('a[href]');
  if (anchor) return anchor.href;
  /* Fallback: plain-text path typed by the author. */
  const raw = block.querySelector('div > div')?.textContent?.trim();
  if (raw) {
    try { return new URL(raw, window.location.href).href; } catch { /* skip */ }
  }
  return null;
}

/** Render PDF page `n` (1-based) into a new off-screen canvas. */
async function renderPdfPage(pdfDoc, n, bufW, bufH) {
  const page = await pdfDoc.getPage(n);
  const nativeVp = page.getViewport({ scale: 1 });
  const scale = Math.min(bufW / nativeVp.width, bufH / nativeVp.height);
  const vp = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = bufW;
  canvas.height = bufH;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, bufW, bufH);
  /* Centre the page content inside the buffer. */
  const ox = Math.floor((bufW - vp.width) / 2);
  const oy = Math.floor((bufH - vp.height) / 2);
  ctx.save();
  ctx.translate(ox, oy);
  await page.render({ canvasContext: ctx, viewport: vp }).promise;
  ctx.restore();
  return canvas;
}

/** Copy an off-screen canvas into a visible display canvas.
 *  `mirror=true` flips content horizontally so it reads correctly
 *  on the back face of the 3-D flip element. */
function blit(src, dest, mirror = false) {
  const ctx = dest.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, dest.width, dest.height);
  if (!src) return;
  if (mirror) {
    ctx.save();
    ctx.translate(dest.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(src, 0, 0);
    ctx.restore();
  } else {
    ctx.drawImage(src, 0, 0);
  }
}

/** Create a canvas whose pixel buffer matches the desired HiDPI size. */
function makeCanvas(cssW, cssH, dpr) {
  const c = document.createElement('canvas');
  c.width = Math.round(cssW * dpr);
  c.height = Math.round(cssH * dpr);
  c.style.width = `${cssW}px`;
  c.style.height = `${cssH}px`;
  return c;
}

/** Show a styled error directly inside the block (no CSS classes needed). */
function showError(block, msg) {
  block.innerHTML = `
    <p style="color:#c0392b;font-family:sans-serif;font-size:.9rem;
              padding:12px 16px;background:#fdf3f2;border:1px solid #e8c4c0;
              border-radius:4px;margin:24px auto;max-width:600px;">
      ${msg}
    </p>`;
}

// ─────────────────────────────────────────────────────────────────────────────
export default async function decorate(block) {
  /* 1 ── Resolve PDF URL ─────────────────────────────────────────────────── */
  const pdfUrl = getPdfUrl(block);
  if (!pdfUrl) {
    showError(block, 'Esignature: no PDF document path found in block content.');
    return;
  }

  /* 2 ── Compute page dimensions from viewport ────────────────────────────── */
  block.innerHTML = ''; // clear raw authoring HTML

  function calcPageW() {
    const fromWidth = Math.floor(window.innerWidth * 0.46);
    // Reserve ~140px for nav bar, padding, browser chrome so pages fit vertically
    const fromHeight = Math.floor((window.innerHeight - 140) / Math.SQRT2);
    return Math.max(120, Math.min(fromWidth, fromHeight));
  }

  let cssPageW = calcPageW();
  let cssPageH = Math.round(cssPageW * Math.SQRT2);
  // Push computed sizes back as CSS vars so the CSS layout follows
  block.style.setProperty('--esig-page-w', `${cssPageW}px`);
  block.style.setProperty('--esig-page-h', `${cssPageH}px`);
  let dpr = Math.max(window.devicePixelRatio || 1, 1);
  let bufW = Math.round(cssPageW * dpr);
  let bufH = Math.round(cssPageH * dpr);

  /* 3 ── Build flipbook DOM ──────────────────────────────────────────────── */
  const book = document.createElement('div');
  book.className = 'esig-book';
  book.tabIndex = 0;
  book.setAttribute('role', 'region');
  book.setAttribute('aria-label', 'PDF flipbook');

  const spread = document.createElement('div');
  spread.className = 'esig-spread';

  /* Static page canvases (always visible, updated between flips) */
  const leftCanvas = makeCanvas(cssPageW, cssPageH, dpr);
  leftCanvas.className = 'esig-page-canvas esig-page-canvas-left';

  const spine = document.createElement('div');
  spine.className = 'esig-spine';

  const rightCanvas = makeCanvas(cssPageW, cssPageH, dpr);
  rightCanvas.className = 'esig-page-canvas esig-page-canvas-right';

  /* The 3-D flip element — hidden until a flip is triggered */
  const flipEl = document.createElement('div');
  flipEl.className = 'esig-flip';

  const flipFront = makeCanvas(cssPageW, cssPageH, dpr);
  flipFront.className = 'esig-flip-face esig-flip-face-front';

  const flipBack = makeCanvas(cssPageW, cssPageH, dpr);
  flipBack.className = 'esig-flip-face esig-flip-face-back';

  flipEl.append(flipFront, flipBack);
  spread.append(leftCanvas, spine, rightCanvas, flipEl);

  /* Loading indicator */
  const loadingWrap = document.createElement('div');
  loadingWrap.className = 'esig-loading-wrap';
  loadingWrap.innerHTML = `
    <div class="esig-loading">
      <span class="esig-loading-dot"></span>
      <span class="esig-loading-dot"></span>
      <span class="esig-loading-dot"></span>
    </div>`;

  /* Navigation */
  const nav = document.createElement('nav');
  nav.className = 'esig-nav';
  nav.setAttribute('aria-label', 'Page navigation');

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'esig-nav-btn esig-nav-btn-prev';
  prevBtn.setAttribute('aria-label', 'Previous pages');
  prevBtn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"
      fill="none" stroke="currentColor" stroke-width="2.5"
      stroke-linecap="round" stroke-linejoin="round">
    <path d="M15 6l-6 6 6 6"/>
  </svg>`;

  const indicator = document.createElement('span');
  indicator.className = 'esig-nav-indicator';
  indicator.setAttribute('aria-live', 'polite');

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'esig-nav-btn esig-nav-btn-next';
  nextBtn.setAttribute('aria-label', 'Next pages');
  nextBtn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"
      fill="none" stroke="currentColor" stroke-width="2.5"
      stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 6l6 6-6 6"/>
  </svg>`;

  nav.append(prevBtn, indicator, nextBtn);
  book.append(spread, loadingWrap, nav);
  block.append(book);

  /* 4 ── Load PDF.js ──────────────────────────────────────────────────────── */
  let pdfjsLib;
  try {
    pdfjsLib = await loadPdfJs();
  } catch (err) {
    loadingWrap.remove();
    showError(block, `Esignature: could not load PDF.js — ${err.message}`);
    return;
  }

  /* 5 ── Load the PDF document ────────────────────────────────────────────── */
  let pdfDoc;
  try {
    pdfDoc = await pdfjsLib.getDocument({
      url: pdfUrl,
      cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
      cMapPacked: true,
    }).promise;
  } catch (err) {
    loadingWrap.remove();
    showError(block, `Esignature: could not open PDF (${err.message})`);
    return;
  }

  loadingWrap.remove();

  const totalPages = pdfDoc.numPages;
  const totalSpreads = Math.ceil(totalPages / 2);

  /* Lazy render cache: page number (1-based) → Promise<canvas> */
  const cache = new Map();
  function getPage(n) {
    if (n < 1 || n > totalPages) return Promise.resolve(null);
    if (!cache.has(n)) cache.set(n, renderPdfPage(pdfDoc, n, bufW, bufH));
    return cache.get(n);
  }

  /* 6 ── Draw a spread onto the static canvases ───────────────────────────── */
  let spreadIdx = 0;
  let isFlipping = false;

  async function drawSpread(idx) {
    const ln = idx * 2 + 1;
    const rn = idx * 2 + 2;
    const [lc, rc] = await Promise.all([getPage(ln), getPage(rn)]);
    blit(lc, leftCanvas);
    blit(rc, rightCanvas);

    const hi = Math.min(rn, totalPages);
    indicator.textContent = rn <= totalPages
      ? `${ln}–${hi} / ${totalPages}`
      : `${ln} / ${totalPages}`;

    prevBtn.disabled = idx === 0;
    nextBtn.disabled = idx >= totalSpreads - 1;
  }

  /* 7 ── Forward flip: current right page curls to left, revealing next left ── */
  async function flipForward() {
    if (isFlipping || spreadIdx >= totalSpreads - 1) return;
    isFlipping = true;

    const nextIdx = spreadIdx + 1;
    const [frontSrc, backSrc, nextRightSrc] = await Promise.all([
      getPage(spreadIdx * 2 + 2), // current right page → front face (the page being turned)
      getPage(nextIdx * 2 + 1), // next left page     → back face (revealed as page turns)
      getPage(nextIdx * 2 + 2), // next right page    → show on right canvas before animation
    ]);

    blit(frontSrc, flipFront, false);
    blit(backSrc, flipBack, false);
    // Pre-load the next right page so it's visible as the flip element sweeps away
    blit(nextRightSrc, rightCanvas);

    flipEl.classList.add('esig-flip-active', 'esig-flip-forward');

    setTimeout(async () => {
      flipEl.style.visibility = 'hidden';
      spreadIdx = nextIdx;
      await drawSpread(spreadIdx);
      flipEl.classList.remove('esig-flip-forward');
      requestAnimationFrame(() => {
        flipEl.style.visibility = '';
        flipEl.classList.remove('esig-flip-active');
        isFlipping = false;
      });
      getPage(nextIdx * 2 + 3); // pre-render ahead
      getPage(nextIdx * 2 + 4);
    }, FLIP_MS);
  }

  /* 8 ── Backward flip: current left page curls to right, revealing prev right ─ */
  async function flipBackward() {
    if (isFlipping || spreadIdx === 0) return;
    isFlipping = true;

    const prevIdx = spreadIdx - 1;
    const [frontSrc, backSrc, prevLeftSrc] = await Promise.all([
      getPage(prevIdx * 2 + 2), // prev right page   → front face (revealed as page turns)
      getPage(spreadIdx * 2 + 1), // current left page → back face (the page being turned)
      getPage(prevIdx * 2 + 1), // prev left page    → show on left canvas before animation
    ]);

    blit(frontSrc, flipFront, false);
    blit(backSrc, flipBack, false);
    // Pre-load the prev left page so it's visible as the flip element sweeps away
    blit(prevLeftSrc, leftCanvas);

    flipEl.classList.add('esig-flip-active', 'esig-flip-flipped');
    flipEl.getBoundingClientRect(); // force reflow so initial state is applied
    flipEl.classList.add('esig-flip-backward');

    setTimeout(async () => {
      flipEl.style.visibility = 'hidden';
      spreadIdx = prevIdx;
      await drawSpread(spreadIdx);
      flipEl.classList.remove('esig-flip-backward', 'esig-flip-flipped');
      requestAnimationFrame(() => {
        flipEl.style.visibility = '';
        flipEl.classList.remove('esig-flip-active');
        isFlipping = false;
      });
    }, FLIP_MS);
  }

  /* 9 ── Events ───────────────────────────────────────────────────────────── */
  nextBtn.addEventListener('click', flipForward);
  prevBtn.addEventListener('click', flipBackward);

  rightCanvas.style.cursor = 'pointer';
  leftCanvas.style.cursor = 'pointer';
  rightCanvas.addEventListener('click', flipForward);
  leftCanvas.addEventListener('click', flipBackward);

  book.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); flipForward(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); flipBackward(); }
  });

  let touchStartX = 0;
  spread.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  spread.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 48) (dx < 0 ? flipForward : flipBackward)();
  }, { passive: true });

  /* 10 ── Initial render ──────────────────────────────────────────────────── */
  await drawSpread(0);
  getPage(3);
  getPage(4);

  /* 11 ── Responsive resize ───────────────────────────────────────────────── */
  let resizeTimer;
  function onResize() {
    const newPageW = calcPageW();
    if (newPageW === cssPageW) return;
    cssPageW = newPageW;
    cssPageH = Math.round(cssPageW * Math.SQRT2);
    dpr = Math.max(window.devicePixelRatio || 1, 1);
    bufW = Math.round(cssPageW * dpr);
    bufH = Math.round(cssPageH * dpr);
    block.style.setProperty('--esig-page-w', `${cssPageW}px`);
    block.style.setProperty('--esig-page-h', `${cssPageH}px`);
    [leftCanvas, rightCanvas, flipFront, flipBack].forEach((c) => {
      c.width = bufW;
      c.height = bufH;
      c.style.width = `${cssPageW}px`;
      c.style.height = `${cssPageH}px`;
    });
    cache.clear(); // old renders are the wrong size
    if (!isFlipping) drawSpread(spreadIdx);
  }
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(onResize, 150);
  }, { passive: true });
}
