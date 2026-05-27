/**
 * Custom Embed block — DAM に保存した HTML ファイルを fetch して描画する。
 *
 * EDS は textarea フィールドの値を sanitize するため、HTML 本文は
 * DAM に .html ファイルとしてアップロードし、ブロックはそのパスを参照する。
 *
 * Authoring (Universal Editor):
 *   1. "HTML File URL" フィールド: DAM パスを記入
 *        例: /content/dam/custom-embed/html/recruit.html
 *   2. "Resource URLs" フィールド: 読み込む CSS/JS の DAM パスを1行1つで記入
 *        例:
 *          /content/dam/custom-embed/css/module_v2.css
 *          /content/dam/custom-embed/js/jquery.min.js
 *
 * ページメタデータ "aem-base-url" でベース URL を設定します:
 *   テスト: https://publish-p1234-e5678.adobeaemcloud.com
 *   本番:   https://www.sumitclub.jp
 * 未設定の場合は window.location.origin を使用します。
 *
 * ローカルテスト用フォールバック:
 *   cell[0] の textContent が .html で終わらない場合（インライン HTML）は
 *   そのまま innerHTML として使用します。
 */

function getAemBaseUrl() {
  const meta = document.head.querySelector('meta[name="aem-base-url"]');
  const raw = meta ? meta.content : window.location.origin;
  return raw.replace(/\/$/, '');
}

function toAbsolute(path, baseUrl) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/')) return `${baseUrl}${path}`;
  try { return new URL(path, document.baseURI).href; } catch { return path; }
}

function injectStylesheet(href) {
  if (document.head.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

function injectInlineStyle(cssText) {
  const style = document.createElement('style');
  style.textContent = cssText;
  document.head.appendChild(style);
}

function loadElement(el) {
  return new Promise((resolve, reject) => {
    el.addEventListener('load', resolve, { once: true });
    el.addEventListener('error', reject, { once: true });
  });
}

async function executeScripts(container, baseUrl) {
  const scripts = [...container.querySelectorAll('script')];
  await scripts.reduce(async (prev, old) => {
    await prev;
    const next = document.createElement('script');
    [...old.attributes].forEach((a) => {
      next.setAttribute(a.name, a.name === 'src' ? toAbsolute(a.value, baseUrl) : a.value);
    });
    if (old.getAttribute('src')) {
      next.src = toAbsolute(old.getAttribute('src'), baseUrl);
      old.replaceWith(next);
      await loadElement(next).catch(() => {});
    } else {
      next.textContent = old.textContent;
      old.replaceWith(next);
    }
  }, Promise.resolve());
}

function rewriteImageSrcs(container, baseUrl) {
  container.querySelectorAll('img[src]').forEach((img) => {
    img.src = toAbsolute(img.getAttribute('src'), baseUrl);
  });
}

/**
 * Resource URLs フィールド（1行1パス）から CSS/JS URL を読み込む。
 * textContent を使うことで EDS が <p>/<br> で囲んでも純粋なパス文字列を取得できる。
 */
async function loadResources(urlsCell, baseUrl) {
  if (!urlsCell) return;
  const raw = urlsCell.textContent;
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  const scripts = [];
  lines.forEach((line) => {
    const url = toAbsolute(line, baseUrl);
    if (line.endsWith('.css')) {
      injectStylesheet(url);
    } else if (line.endsWith('.js')) {
      scripts.push(url);
    }
  });
  await scripts.reduce(async (prev, src) => {
    await prev;
    const script = document.createElement('script');
    script.src = src;
    document.head.appendChild(script);
    await loadElement(script).catch(() => {});
  }, Promise.resolve());
}

/**
 * cell[0] の内容を解決して HTML 文字列を返す。
 *   - .html で終わる単一行  → DAM ファイルを fetch（Cloud モード）
 *   - それ以外              → cell の innerHTML をそのまま使用（ローカルテストモード）
 */
async function resolveHtml(htmlCell, baseUrl) {
  const text = htmlCell.textContent.trim();
  const isSingleLine = !text.includes('\n');
  if (isSingleLine && text.endsWith('.html')) {
    const url = toAbsolute(text, baseUrl);
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`custom-embed: fetch failed ${resp.status} ${url}`);
    return resp.text();
  }
  // ローカルテスト: cell 内にインライン HTML が直接入っている場合
  const { firstElementChild: first } = htmlCell;
  if (!first) return text;
  if (
    htmlCell.children.length === 1
    && first.tagName === 'P'
    && first.childNodes.length === 1
    && first.firstChild.nodeType === Node.TEXT_NODE
  ) {
    return text;
  }
  return htmlCell.innerHTML;
}

export default async function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const htmlCell = cells[0];
  const urlsCell = cells[1];
  if (!htmlCell) return;

  const baseUrl = getAemBaseUrl();

  await loadResources(urlsCell, baseUrl);

  const rawHtml = await resolveHtml(htmlCell, baseUrl);
  block.innerHTML = '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  doc.querySelectorAll('link[rel="stylesheet"]').forEach((el) => {
    const href = toAbsolute(el.getAttribute('href'), baseUrl);
    if (href) injectStylesheet(href);
  });

  doc.querySelectorAll('style').forEach((el) => {
    injectInlineStyle(el.textContent);
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'custom-embed-content';
  wrapper.innerHTML = doc.body.innerHTML;

  rewriteImageSrcs(wrapper, baseUrl);
  block.appendChild(wrapper);

  await executeScripts(wrapper, baseUrl);
}
