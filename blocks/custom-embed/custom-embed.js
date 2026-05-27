/**
 * Custom Embed block — renders raw HTML pasted by an author.
 *
 * Authoring (Universal Editor):
 *   1. "HTML Content" フィールド: Classic AEM の HTML 本文を貼り付ける
 *      （<link>/<script> タグは EDS が除去するため、このフィールドには入れない）
 *   2. "Resource URLs" フィールド: 読み込む CSS/JS の DAM パスを1行1つで記入
 *      例:
 *        /content/dam/sumitclub/eds/css/module_v2.css
 *        /content/dam/sumitclub/eds/js/jquery.min.js
 *
 * ページメタデータ "aem-base-url" でベース URL を設定します:
 *   テスト: https://publish-p1234-e5678.adobeaemcloud.com
 *   本番:   https://www.sumitclub.jp
 * 未設定の場合は window.location.origin を使用します。
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
 * aem.js の wrapTextNodes() はテキストノードを <p> で包むため、
 * cell.firstElementChild が null でなくなる場合がある。
 * 単一 <p> + 単一テキストノードのパターンは wrapTextNodes による包みと判定し
 * cell.textContent を返す（元の文字列を復元できる）。
 */
function extractRawText(cell) {
  const { firstElementChild: first } = cell;
  if (!first) return cell.textContent.trim();
  if (
    cell.children.length === 1
    && first.tagName === 'P'
    && first.childNodes.length === 1
    && first.firstChild.nodeType === Node.TEXT_NODE
  ) {
    return cell.textContent.trim();
  }
  return cell.innerHTML;
}

/**
 * Resource URLs フィールド（1行1パス）から CSS/JS URL を読み込む。
 * EDS 配信が <link>/<script> タグを除去するため、パスをプレーンテキストで格納する。
 */
async function loadResources(urlsCell, baseUrl) {
  if (!urlsCell) return;
  const raw = extractRawText(urlsCell);
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

export default async function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const htmlCell = cells[0];
  const urlsCell = cells[1];
  if (!htmlCell) return;

  const baseUrl = getAemBaseUrl();

  // Resource URLs フィールドから CSS/JS を先に読み込む
  await loadResources(urlsCell, baseUrl);

  const rawHtml = extractRawText(htmlCell);
  block.innerHTML = '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  // HTML 内に残っている <link rel="stylesheet"> があれば注入
  doc.querySelectorAll('link[rel="stylesheet"]').forEach((el) => {
    const href = toAbsolute(el.getAttribute('href'), baseUrl);
    if (href) injectStylesheet(href);
  });

  // <style> タグがあれば注入
  doc.querySelectorAll('style').forEach((el) => {
    injectInlineStyle(el.textContent);
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'custom-embed-content';
  wrapper.innerHTML = doc.body.innerHTML;

  rewriteImageSrcs(wrapper, baseUrl);
  block.appendChild(wrapper);

  // HTML 内に残っている <script> があれば実行
  await executeScripts(wrapper, baseUrl);
}
