/**
 * Custom Embed block — DAM に保存した HTML ファイルを fetch して描画する。
 *
 * Authoring (Universal Editor):
 *   "HTML File URL" フィールド: DAM にアップロードした HTML ファイルのパスを記入。
 *     例: /content/dam/custom-embed/html/recruit.html
 *   HTML ファイルには <link>/<script> タグを直接含めることができます。
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
  if (!href || document.head.querySelector(`link[href="${href}"]`)) return;
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

function rewriteImageSrcs(container, baseUrl) {
  container.querySelectorAll('img[src]').forEach((img) => {
    img.src = toAbsolute(img.getAttribute('src'), baseUrl);
  });
}

/**
 * script 要素のリストを順番に実行する。
 * headScripts は document.head に追加、bodyScripts は wrapper 内で置き換える。
 */
async function runScripts(headScripts, bodyScripts, baseUrl) {
  const makeScript = (old, forHead) => {
    const next = document.createElement('script');
    [...old.attributes].forEach((a) => {
      next.setAttribute(a.name, a.name === 'src' ? toAbsolute(a.value, baseUrl) : a.value);
    });
    if (!old.getAttribute('src')) next.textContent = old.textContent;
    return { next, forHead };
  };

  const tasks = [
    ...headScripts.map((s) => makeScript(s, true)),
    ...bodyScripts.map((s) => ({ next: makeScript(s, false).next, old: s, forHead: false })),
  ];

  await tasks.reduce(async (prev, { next, old, forHead }) => {
    await prev;
    if (forHead) {
      document.head.appendChild(next);
    } else {
      old.replaceWith(next);
    }
    if (next.src) await loadElement(next).catch(() => {});
  }, Promise.resolve());
}

/**
 * cell[0] の内容を解決して HTML 文字列を返す。
 *   - .html で終わる単一行 または <a href> → DAM ファイルを fetch（Cloud モード）
 *   - それ以外              → cell の innerHTML をそのまま使用（ローカルテストフォールバック）
 *
 * EDS は text フィールドの値を <a href="..."> として描画する場合があるため、
 * <a> 要素の href 属性からパスを取得する。
 */
async function resolveHtml(htmlCell, baseUrl) {
  // EDS が <a href="/content/dam/.../recruit.html"> として描画した場合
  const anchor = htmlCell.querySelector('a[href]');
  const rawPath = anchor ? anchor.getAttribute('href') : htmlCell.textContent.trim();

  if (rawPath && !rawPath.includes('\n') && rawPath.endsWith('.html')) {
    const url = toAbsolute(rawPath, baseUrl);
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`custom-embed: fetch failed ${resp.status} ${url}`);
    return resp.text();
  }
  const { firstElementChild: first } = htmlCell;
  if (!first) return htmlCell.textContent;
  if (
    htmlCell.children.length === 1
    && first.tagName === 'P'
    && first.childNodes.length === 1
    && first.firstChild.nodeType === Node.TEXT_NODE
  ) return htmlCell.textContent;
  return htmlCell.innerHTML;
}

export default async function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const htmlCell = cells[0];
  if (!htmlCell) return;

  const baseUrl = getAemBaseUrl();
  const rawHtml = await resolveHtml(htmlCell, baseUrl);
  block.innerHTML = '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  // <link rel="stylesheet"> / <style> を head から注入
  doc.querySelectorAll('link[rel="stylesheet"]').forEach((el) => {
    injectStylesheet(toAbsolute(el.getAttribute('href'), baseUrl));
  });
  doc.querySelectorAll('style').forEach((el) => {
    injectInlineStyle(el.textContent);
  });

  // body を描画
  const wrapper = document.createElement('div');
  wrapper.className = 'custom-embed-content';
  wrapper.innerHTML = doc.body.innerHTML;
  rewriteImageSrcs(wrapper, baseUrl);
  block.appendChild(wrapper);

  // head の <script> → body の <script> の順に実行
  const headScripts = [...doc.head.querySelectorAll('script')];
  const bodyScripts = [...wrapper.querySelectorAll('script')];
  await runScripts(headScripts, bodyScripts, baseUrl);
}
