/**
 * utils.js
 * カタログ・管理画面共通ユーティリティ
 */

'use strict';

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
  // それ以外 → 中央配置（ボタン・バッジ・カード等の小コンポーネント向け）
  const trimmed = html.trimStart();
  const isLayoutTag = /^<(section|header|main|footer|nav)[\s>]/i.test(trimmed);

  const bodyStyle = isLayoutTag
    ? `font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Hiragino Sans", "Noto Sans JP", sans-serif;
    font-size: 14px;
    background: #f8fafc;
    ${scrollable ? 'overflow-y: auto;' : 'overflow: hidden;'}`
    : `font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Hiragino Sans", "Noto Sans JP", sans-serif;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 16px;
    background: #f8fafc;`;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { ${bodyStyle} }
  ${css}
</style>
</head>
<body>
  ${html}
</body>
</html>`;
}
