/**
 * Custom Embed block — renders raw HTML pasted by an author.
 *
 * Authoring (Universal Editor):
 *   1. Add the "Custom Embed" block to a page.
 *   2. In the "HTML Content" field, paste the raw HTML snippet.
 *      HTML には <link>, <style>, <script> タグを含めることができます。
 *   3. CSS/JS/img のパスは /content/dam/... の root-relative 形式で記述します。
 *      ブロックが自動的に aem-base-url メタデータのホスト名を付与します。
 *
 * ページメタデータに aem-base-url を設定することで環境を切り替えられます:
 *   テスト: <meta name="aem-base-url" content="https://publish-p1234-e5678.adobeaemcloud.com">
 *   本番:   <meta name="aem-base-url" content="https://www.sumitclub.jp">
 *
 * メタデータが未設定の場合は現在のページの origin を使用します。
 */

/**
 * ページの <meta name="aem-base-url"> からベース URL を取得する。
 * 未設定なら window.location.origin を返す。
 */
function getAemBaseUrl() {
  const meta = document.head.querySelector('meta[name="aem-base-url"]');
  const raw = meta ? meta.content : window.location.origin;
  return raw.replace(/\/$/, ''); // 末尾スラッシュを除去
}

/**
 * /content/dam/... や /etc.clientlibs/... などの root-relative パスに
 * AEM ベース URL を付与して絶対 URL に変換する。
 * すでに絶対 URL (http/https) または相対パス (./) はそのまま返す。
 */
function toAbsolute(path, baseUrl) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path; // すでに絶対URL
  if (path.startsWith('/')) return `${baseUrl}${path}`; // /content/dam/... 形式
  // ./relative パスは DOMParser の about:blank 問題を回避して page base で解決
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
      if (a.name === 'src') {
        next.src = toAbsolute(a.value, baseUrl);
      } else {
        next.setAttribute(a.name, a.value);
      }
    });
    if (!old.getAttribute('src')) {
      next.textContent = old.textContent;
    } else {
      await loadElement(next).catch(() => {});
    }
    old.replaceWith(next);
  }, Promise.resolve());
}

/** img[src] の root-relative パスを絶対 URL に書き換える */
function rewriteImageSrcs(container, baseUrl) {
  container.querySelectorAll('img[src]').forEach((img) => {
    img.src = toAbsolute(img.getAttribute('src'), baseUrl);
  });
}

export default async function decorate(block) {
  const cell = block.querySelector(':scope > div > div');
  if (!cell) return;

  const baseUrl = getAemBaseUrl();

  // text フィールド型 (UE での推奨): JCR の文字列値がHTMLエスケープされてテキストノードに入る
  //   → cell.textContent で生の HTML 文字列を取得する
  // richtext フィールド型 / テスト HTML で直書きした場合: セルに実際の DOM 要素がある
  //   → cell.innerHTML で HTML 文字列を取得する
  const hasElements = cell.firstElementChild !== null;
  const rawHtml = hasElements ? cell.innerHTML : cell.textContent;

  block.innerHTML = '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  // <link rel="stylesheet"> → document <head> に注入 (root-relative → 絶対 URL)
  doc.querySelectorAll('link[rel="stylesheet"]').forEach((el) => {
    const href = toAbsolute(el.getAttribute('href'), baseUrl);
    if (href) injectStylesheet(href);
  });

  // <style> → document <head> に注入
  doc.querySelectorAll('style').forEach((el) => {
    injectInlineStyle(el.textContent);
  });

  // コンテンツ HTML をラッパーに挿入
  const wrapper = document.createElement('div');
  wrapper.className = 'custom-embed-content';
  wrapper.innerHTML = doc.body.innerHTML;

  // img src を絶対 URL に変換
  rewriteImageSrcs(wrapper, baseUrl);

  block.appendChild(wrapper);

  // <script> を再生成して実行
  await executeScripts(wrapper, baseUrl);
}
