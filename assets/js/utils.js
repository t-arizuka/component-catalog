/**
 * utils.js
 * カタログ・管理画面共通ユーティリティ
 */

'use strict';

/* ============================================================
   コンポーネント用CSS変数
   ============================================================ */

const COMPONENT_CSS_VARIABLES = `
:root {
  /*------▼基本設定▼------*/
  --color-background: #fff;
  --color-font: #111;
  --color-primary: #333;
  --color-primary-shade: #111;
  --color-primary-tint: #666;
  --color-secondary: #aaa;
  --color-secondary-tint: #eee;
  --color-table-border: #ccc;
  --body-font-size: min(calc(1.6rem + (1vw - 1.92rem) * 0.1294), 1.6rem);
  --body-font-family: 'Noto Sans JP', sans-serif;
  --content-max-width: 1240px;

  /*------▼フォント設定▼------*/
  --font-family01: 'Noto Sans JP', sans-serif;
  --font-family02: 'Oswald', 'Noto Sans JP', sans-serif;

  /*------▼pxバリエーション▼------*/
  --px240: min(calc(240px + (1vw - 19.2px) * 10.3560), 240px);
  --px200: min(calc(200px + (1vw - 19.2px) * 6.4725), 200px);
  --px180: min(calc(180px + (1vw - 19.2px) * 3.8835), 180px);
  --px160w: min(calc(160px + (1vw - 19.2px) * 5.1780), 160px);
  --px160: min(calc(160px + (1vw - 19.2px) * 6.4725), 160px);
  --px150: min(calc(150px + (1vw - 19.2px) * 3.2362), 150px);
  --px140: min(calc(140px + (1vw - 19.2px) * 6.4725), 140px);
  --px120: min(calc(120px + (1vw - 19.2px) * 2.5890), 120px);
  --px100w: min(calc(100px + (1vw - 19.2px) * 3.2362), 100px);
  --px100: min(calc(100px + (1vw - 19.2px) * 3.8835), 100px);
  --px96: min(calc(96px + (1vw - 19.2px) * 3.1068), 96px);
  --px80w: min(calc(80px + (1vw - 19.2px) * 1.2945), 80px);
  --px80: min(calc(80px + (1vw - 19.2px) * 2.5890), 80px);
  --px80s: min(calc(80px + (1vw - 19.2px) * 3.8835), 80px);
  --px60w: min(calc(60px + (1vw - 19.2px) * 1.2945), 60px);
  --px60: min(calc(60px + (1vw - 19.2px) * 1.9417), 60px);
  --px50: min(calc(50px + (1vw - 19.2px) * 1.2945), 50px);
  --px40w: min(calc(40px + (1vw - 19.2px) * 0.6472), 40px);
  --px40: min(calc(40px + (1vw - 19.2px) * 1.2945), 40px);
  --px30w: min(calc(30px + (1vw - 19.2px) * 0.6472), 30px);
  --px30: min(calc(30px + (1vw - 19.2px) * 0.9709), 30px);
  --px24: min(calc(24px + (1vw - 19.2px) * 0.6472), 24px);
  --px20: min(calc(20px + (1vw - 19.2px) * 0.6472), 20px);
  --px18: min(calc(18px + (1vw - 19.2px) * 0.2589), 18px);
  --px16: min(calc(16px + (1vw - 19.2px) * 0.1294), 16px);
  --px14: min(calc(14px + (1vw - 19.2px) * 0.1294), 14px);
  --px12: min(calc(12px + (1vw - 19.2px) * 0.0647), 12px);
}
`;

const COMPONENT_PREVIEW_RESET_CSS = `
/* ==========================================================================
   Component Styles reset
   Scope: .post .package_parts
   ========================================================================== */

/* ボックスモデルの統一 */
.post .package_parts,
.post .package_parts * {
  box-sizing: border-box;
}

/* --- 見出し(h1-h6)のリセット --- */

.post .package_parts h1,
.post .package_parts h2,
.post .package_parts h3,
.post .package_parts h4,
.post .package_parts h5,
.post .package_parts h6 {
  margin: 0;
  padding: 0;
  border: none;
  background: none;
  font-size: 100%;
  font-weight: normal;
  color: inherit;
  line-height: 1.5;
  box-shadow: none;
  text-shadow: none;
  width: auto;
  position: static;
}

/* 見出しの擬似要素(アイコン等)を消去 */
.post .package_parts h1::before, .post .package_parts h1::after,
.post .package_parts h2::before, .post .package_parts h2::after,
.post .package_parts h3::before, .post .package_parts h3::after,
.post .package_parts h4::before, .post .package_parts h4::after,
.post .package_parts h5::before, .post .package_parts h5::after,
.post .package_parts h6::before, .post .package_parts h6::after {
  content: none;
  display: none;
  background: transparent;
}

/* --- リスト(ul, ol, li)のリセット --- */
.post .package_parts ul,
.post .package_parts ol {
  list-style: none;
  margin: 0;
  padding: 0;
  background: none;
}

.post .package_parts li {
  list-style: none;
  margin: 0;
  padding: 0;
  border: none;
  background: none;
  display: block;
  width: auto;
}

.post .package_parts li::before,
.post .package_parts li::after {
  content: none;
  display: none;
}

/* --- 定義リスト(dl, dt, dd)のリセット --- */
.post .package_parts dl,
.post .package_parts dt,
.post .package_parts dd {
  margin: 0;
  padding: 0;
  border: none;
  background: none;
  font-weight: normal;
  line-height: 1.5;
}

/* --- その他タグのリセット --- */
.post .package_parts p,
.post .package_parts figure,
.post .package_parts blockquote,
.post .package_parts dl,
.post .package_parts dt,
.post .package_parts dd {
  margin: 0;
  padding: 0;
  background: none;
  border: none;
}

.post .package_parts table {
  border-collapse: collapse;
  margin: 0;
  padding: 0;
  width: 100%;
  border: none;
  background: none;
}

.post .package_parts th,
.post .package_parts td {
  padding: 0;
  border: none;
  background: none;
  text-align: left;
}

/* --- 画像のリセット --- */
.post .package_parts img {
  padding: 0 !important;
  border: none !important;
  margin: 0;
  max-width: 100%;
  height: auto;
  box-shadow: none !important;
  vertical-align: bottom;
  float: none;
  background: none !important;
}

/* --- リンクのリセット --- */
.post .package_parts a {
  text-decoration: none;
  color: inherit;
  transition: none;
  border: none;
}

/* --- WordPress固有クラスの無効化 --- */
.post .package_parts .aligncenter,
.post .package_parts .alignleft,
.post .package_parts .alignright {
  float: none;
  margin: 0;
  display: inline;
}
`;

/* ============================================================
   クリップボードコピー
   ============================================================ */

/**
 * テキストをクリップボードにコピーする
 * @param {string} text - コピーするテキスト
 * @returns {Promise<boolean>} 成功なら true
 */
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // フォールバック: textarea を使った旧来手法
      const el = document.createElement('textarea');
      el.value = text;
      el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    return true;
  } catch (e) {
    console.error('コピー失敗:', e);
    return false;
  }
}

/* ============================================================
   トースト通知
   ============================================================ */

// トーストコンテナを取得 or 作成
function getToastContainer() {
  let el = document.querySelector('.toast-container');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast-container';
    document.body.appendChild(el);
  }
  return el;
}

/**
 * トースト通知を表示する
 * @param {string} message - 表示テキスト
 * @param {'success'|'error'|'info'} type - 種別
 * @param {number} duration - 表示ミリ秒（デフォルト2000）
 */
function showToast(message, type = 'success', duration = 2000) {
  const container = getToastContainer();

  const icons = { success: '✓', error: '✕', info: 'ℹ' };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] ?? icons.info}</span>
    <span>${escapeHtml(message)}</span>
  `;
  container.appendChild(toast);

  // 指定時間後にフェードアウト → 削除
  setTimeout(() => {
    toast.classList.add('hiding');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}

/* ============================================================
   HTML エスケープ
   ============================================================ */

/**
 * 文字列を HTML エスケープする
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ============================================================
   ID 自動生成
   ============================================================ */

/**
 * カテゴリ名と既存IDリストをもとに新規IDを生成する
 * 例: "ボタン" → "btn-001"
 * @param {string} category
 * @param {string[]} existingIds
 * @returns {string}
 */
function generateId(category, existingIds = []) {
  const prefixMap = {
    'ボタン': 'btn',
    'カード': 'card',
    'フォーム': 'form',
    'ナビゲーション': 'nav',
    'モーダル': 'modal',
    'テーブル': 'table',
    'バッジ': 'badge',
    'その他': 'misc',
  };
  const prefix = prefixMap[category] ?? 'comp';

  // 同プレフィックスの既存IDから最大の連番を取得
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  let max = 0;
  for (const id of existingIds) {
    const m = id.match(pattern);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  const num = String(max + 1).padStart(3, '0');
  return `${prefix}-${num}`;
}

/* ============================================================
   日付フォーマット
   ============================================================ */

/**
 * Date または ISO 文字列を "YYYY-MM-DD" 形式にフォーマット
 * @param {Date|string} [date]
 * @returns {string}
 */
function formatDate(date) {
  const d = date ? new Date(date) : new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/* ============================================================
   JSON ダウンロード
   ============================================================ */

/**
 * オブジェクトを JSON ファイルとしてダウンロードする
 * @param {object} data
 * @param {string} filename
 */
function downloadJson(data, filename = 'components.json') {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ============================================================
   Figma プラグイン ZIP ダウンロード
   ============================================================ */

/**
 * Figma プラグインの 3 ファイルを ZIP にまとめてダウンロードする
 */
async function downloadPluginZip() {
  const files = [
    'figma-plugin/manifest.json',
    'figma-plugin/code.js',
    'figma-plugin/ui.html',
  ];
  try {
    const entries = await Promise.all(files.map(async (path) => {
      const res = await fetch(path);
      if (!res.ok) throw new Error(path + ' の取得に失敗しました');
      const text = await res.text();
      return { name: path.split('/').pop(), data: new TextEncoder().encode(text) };
    }));
    const blob = buildZipBlob(entries);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'component-catalog-figma-plugin.zip';
    a.click();
    URL.revokeObjectURL(url);
    showToast('プラグインファイルをダウンロードしました', 'success');
  } catch (e) {
    showToast('ダウンロードに失敗しました: ' + e.message, 'error');
  }
}

/**
 * ファイルエントリ配列から ZIP の Blob を生成する（STORE・無圧縮）
 * @param {{ name: string, data: Uint8Array }[]} entries
 * @returns {Blob}
 */
function buildZipBlob(entries) {
  const localParts = [];
  const cdParts = [];
  let offset = 0;

  for (const entry of entries) {
    const name = new TextEncoder().encode(entry.name);
    const data = entry.data;
    const crc = zipCrc32(data);
    const size = data.length;

    // ローカルファイルヘッダー
    const lh = new Uint8Array(30 + name.length);
    const lv = new DataView(lh.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true);   // STORE（無圧縮）
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, name.length, true);
    lv.setUint16(28, 0, true);
    lh.set(name, 30);

    // セントラルディレクトリエントリ
    const cd = new Uint8Array(46 + name.length);
    const cv = new DataView(cd.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, name.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);   // ローカルヘッダーのオフセット
    cd.set(name, 46);

    localParts.push(lh, data);
    cdParts.push(cd);
    offset += lh.length + data.length;
  }

  const cdSize = cdParts.reduce(function(s, p) { return s + p.length; }, 0);

  // End of Central Directory
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  return new Blob(localParts.concat(cdParts).concat([eocd]), { type: 'application/zip' });
}

/**
 * ZIP 用 CRC-32 を計算する
 * @param {Uint8Array} data
 * @returns {number}
 */
function zipCrc32(data) {
  var crc = 0xFFFFFFFF;
  for (var i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (var j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/* ============================================================
   iframe srcdoc 生成
   ============================================================ */

/**
 * コンポーネントの HTML・CSS から iframe 用 srcdoc 文字列を生成する
 * @param {string} html
 * @param {string} css
 * @param {boolean} [scrollable=false] - true のとき縦スクロールを許可（拡大プレビュー用）
 * @returns {string}
 */
function buildSrcdoc(html, css, scrollable = false) {
  // ルート要素がセクション系タグかどうかで body スタイルを切り替える
  // section / header / main / footer / nav → full-width レイアウト向け
  // <div class="post"> + package_parts ラッパー形式 → full-width レイアウト向け
  // それ以外（post + package_partsなし、ボタン等）→ 中央配置（ボタン・バッジ等の小コンポーネント向け）
  const trimmed = html.trimStart();
  const isLayoutTag = /^<(section|header|main|footer|nav|article)[\s>]/i.test(trimmed)
    || (/^<div\b[^>]*\bclass="[^"]*\bpost\b/.test(trimmed) && /class="[^"]*\bpackage_parts\b/.test(trimmed));

  const bodyStyle = isLayoutTag
    ? `font-family: var(--body-font-family, "Noto Sans JP", sans-serif);
    font-size: var(--body-font-size, 14px);
    color: var(--color-font, #111);
    background: #f8fafc;
    ${scrollable ? 'overflow-y: auto;' : 'overflow: hidden;'}`
    : `font-family: var(--body-font-family, "Noto Sans JP", sans-serif);
    font-size: var(--body-font-size, 14px);
    color: var(--color-font, #111);
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100%;
    padding: 16px;
    background: #f8fafc;`;
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="assets/css/designcode.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">
<style>
  ${COMPONENT_CSS_VARIABLES}
  html { height: 100%; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { ${bodyStyle} }
  ${COMPONENT_PREVIEW_RESET_CSS}
  ${css}
</style>
</head>
<body>
  ${html}
</body>
</html>`;
}
