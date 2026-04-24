/**
 * utility.js
 * ユーティリティクラス辞書ページ（utility.html）の処理
 */

'use strict';

/* ============================================================
   状態管理
   ============================================================ */
const utilityState = {
  all: [],
  filtered: [],
  activeTab: 'all',
  searchQuery: '',
  collapsedCategories: new Set(),
};

let rowModalCurrentId = null;
let cssModalDownloadFn = null;
let categoryObserver = null;

const CATEGORY_ORDER = [
  'Display', 'Position', 'Flexbox', 'Grid', 'Order', 'Gap',
  'Width', 'Max Width', 'Spacing',
  'Typography', 'Opacity', 'Border Radius', 'Blend Mode', 'Z-Index',
  'Media', 'Content Block', 'Navigation', 'Embed', 'Responsive',
];

/* ============================================================
   データ読み込み
   ============================================================ */

async function loadData() {
  if (location.protocol === 'file:' && window.UTILITY_DATA) {
    utilityState.all = window.UTILITY_DATA.utilities || [];
    applyFilter();
    render();
    return;
  }

  try {
    const res = await fetch('data/utilities.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    utilityState.all = data.utilities || [];
  } catch (e) {
    console.error('utilities.json の読み込みに失敗:', e);
    utilityState.all = [];
    showToast('データの読み込みに失敗しました', 'error');
  }

  applyFilter();
  render();
}

/* ============================================================
   フィルタリング
   ============================================================ */

function applyFilter() {
  const q = utilityState.searchQuery.toLowerCase().trim();
  const tab = utilityState.activeTab;

  utilityState.filtered = utilityState.all.filter(u => {
    if (tab === 'utility' && u.type !== 'utility') return false;
    if (tab === 'designcode' && u.type !== 'designcode') return false;

    if (!q) return true;

    return (
      u.className.toLowerCase().includes(q) ||
      u.meaning.toLowerCase().includes(q) ||
      (u.cssOutput || '').toLowerCase().includes(q) ||
      (u.cssRaw || '').toLowerCase().includes(q) ||
      (u.category || '').toLowerCase().includes(q) ||
      (u.keywords || []).some(k => k.toLowerCase().includes(q))
    );
  });
}

/* ============================================================
   CSS ユーティリティ
   ============================================================ */

function escapeCssSelector(className) {
  return className.replace(/[/:]/g, ch => '\\' + ch);
}

/**
 * ユーティリティアイテムの完全な CSS を取得
 * cssRaw が存在すればそのまま使用、なければ旧フォーマット（cssOutput + mediaQuery）から生成
 */
function getClassCss(u) {
  if (u.cssRaw) return u.cssRaw.trim();

  const sel = `.${escapeCssSelector(u.className)}`;
  const decl = u.cssOutput || '';
  if (u.mediaQuery) {
    return `${u.mediaQuery} {\n  ${sel} { ${decl} }\n}`;
  }
  return `${sel} { ${decl} }`;
}

/**
 * テーブル表示用 CSS（CSS出力列に表示する短縮版）
 */
function getDisplayCss(u) {
  if (u.cssOutput) return u.cssOutput;
  if (u.cssRaw) {
    const m = u.cssRaw.match(/\{([^}]+)\}/);
    if (m) return m[1].trim();
  }
  return '';
}

/**
 * CSS テキストをパースして同一 @media 条件のブロックをひとつにまとめる
 * 例: 複数クラスの @media (max-width: 768px) { ... } を1つの @media ブロックに統合
 */
function parseMergeCss(rawCss) {
  const regularBlocks = [];
  const mediaMap = new Map(); // condition → body[]
  let i = 0;
  const css = rawCss;

  while (i < css.length) {
    // 空白をスキップ
    while (i < css.length && /\s/.test(css[i])) i++;
    if (i >= css.length) break;

    // コメント /* ... */
    if (css[i] === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      i = end === -1 ? css.length : end + 2;
      continue;
    }

    if (css[i] === '@') {
      // @media などのアットルール
      let condEnd = i;
      while (condEnd < css.length && css[condEnd] !== '{') condEnd++;
      if (condEnd >= css.length) break;
      const condition = css.slice(i, condEnd).trim();

      let depth = 1, j = condEnd + 1;
      while (j < css.length && depth > 0) {
        if (css[j] === '{') depth++;
        else if (css[j] === '}') depth--;
        j++;
      }
      const body = css.slice(condEnd + 1, j - 1).trim();
      if (!mediaMap.has(condition)) mediaMap.set(condition, []);
      if (body) mediaMap.get(condition).push(body);
      i = j;
    } else {
      // 通常ルール: セレクタ { ... }
      let selectorEnd = i;
      while (selectorEnd < css.length && css[selectorEnd] !== '{') selectorEnd++;
      if (selectorEnd >= css.length) break;
      const selector = css.slice(i, selectorEnd).trim();

      let depth = 1, j = selectorEnd + 1;
      while (j < css.length && depth > 0) {
        if (css[j] === '{') depth++;
        else if (css[j] === '}') depth--;
        j++;
      }
      const body = css.slice(selectorEnd + 1, j - 1).trim();
      if (selector) regularBlocks.push({ selector, body });
      i = j;
    }
  }

  // 再構築：通常ルール → @media ブロック（まとめた状態で）
  const lines = [];
  regularBlocks.forEach(({ selector, body }) => {
    lines.push(`${selector} { ${body} }`);
  });
  mediaMap.forEach((bodies, condition) => {
    lines.push(`${condition} {`);
    bodies.forEach(body => {
      body.split('\n').forEach(line => lines.push(`  ${line}`));
    });
    lines.push(`}`);
  });
  return lines.join('\n');
}

/* ============================================================
   URL 状態管理
   ============================================================ */

function getUrlParams() {
  const p = new URLSearchParams(location.search);
  return { tab: p.get('tab') || 'all', q: p.get('q') || '' };
}

function updateUrl() {
  const p = new URLSearchParams();
  if (utilityState.activeTab !== 'all') p.set('tab', utilityState.activeTab);
  if (utilityState.searchQuery) p.set('q', utilityState.searchQuery);
  const qs = p.toString();
  history.replaceState(null, '', qs ? '?' + qs : location.pathname);
}

/* ============================================================
   テキスト検索ハイライト
   ============================================================ */

function highlightText(text, query) {
  if (!query) return escapeHtml(text);
  const q = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(q, 'gi');
  let result = '';
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    result += escapeHtml(text.slice(lastIndex, match.index));
    result += `<mark class="search-mark">${escapeHtml(match[0])}</mark>`;
    lastIndex = regex.lastIndex;
  }
  result += escapeHtml(text.slice(lastIndex));
  return result;
}

/* ============================================================
   CSS シンタックスハイライト
   ============================================================ */

function highlightCss(code) {
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return code.split('\n').map(line => {
    const trimmed = line.trimStart();
    if (trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('*/')) {
      return `<span class="css-comment">${esc(line)}</span>`;
    }
    if (trimmed.startsWith('@')) {
      return esc(line).replace(/^(\s*)(@[\w-]+(?:\s+[^{]*)?)/, '$1<span class="css-at">$2</span>');
    }
    if (/^\s+[\w-]+\s*:/.test(line)) {
      return esc(line).replace(
        /^(\s*)([\w-]+)(\s*:\s*)([^;]+)(;?)/,
        '$1<span class="css-prop">$2</span>$3<span class="css-val">$4</span>$5'
      );
    }
    if (trimmed.includes('{')) {
      return esc(line).replace(/^(\s*)([^{]+)(\{.*)$/, '$1<span class="css-selector">$2</span>$3');
    }
    return esc(line);
  }).join('\n');
}

/* ============================================================
   Spacing サブグループ分類
   ============================================================ */

function getSpacingSubgroup(className) {
  if (className.startsWith('mt') || className.startsWith('mb') || className.startsWith('u-mt-') || className.startsWith('u-mb-')) return 'Margin';
  if (className.startsWith('pt') || className.startsWith('pb') || className.startsWith('pd') || className.startsWith('u-p-')) return 'Padding';
  return null;
}

/* ============================================================
   全展開 / 全折りたたみ
   ============================================================ */

function expandAll() {
  utilityState.collapsedCategories.clear();
  render();
}

function collapseAll() {
  const groups = new Set();
  utilityState.filtered.forEach(u => groups.add(u.category || 'その他'));
  groups.forEach(cat => utilityState.collapsedCategories.add(cat));
  render();
}

/* ============================================================
   Intersection Observer（ナビアクティブ表示）
   ============================================================ */

function setupIntersectionObserver() {
  if (!('IntersectionObserver' in window)) return null;
  const headerH = (document.querySelector('.site-header')?.offsetHeight || 56)
    + (document.getElementById('cat-nav-wrapper')?.offsetHeight || 0);

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const cat = entry.target.querySelector('.cat-header')?.dataset.cat;
      if (!cat) return;
      const pill = [...document.querySelectorAll('.cat-nav-pill')]
        .find(p => p.dataset.navCat === cat);
      if (pill) pill.classList.toggle('is-active', entry.isIntersecting);
    });
  }, { rootMargin: `-${headerH}px 0px -50% 0px`, threshold: 0 });

  document.querySelectorAll('#utility-list-wrapper .cat-section').forEach(s => observer.observe(s));
  return observer;
}

/* ============================================================
   描画（カテゴリ別アコーディオン）
   ============================================================ */

function render() {
  const wrapper = document.getElementById('utility-list-wrapper');
  const countEl = document.getElementById('result-count');
  const q = utilityState.searchQuery;

  countEl.textContent = `${utilityState.filtered.length} 件`;

  if (utilityState.filtered.length === 0) {
    const msg = q ? `「${escapeHtml(q)}」に該当するクラスが見つかりません` : '該当するクラスが見つかりません';
    wrapper.innerHTML = `<div class="empty-cell">${msg}</div>`;
    renderCatNav();
    return;
  }

  // カテゴリでグループ化
  const rawGroups = new Map();
  utilityState.filtered.forEach(u => {
    const cat = u.category || 'その他';
    if (!rawGroups.has(cat)) rawGroups.set(cat, []);
    rawGroups.get(cat).push(u);
  });

  // CATEGORY_ORDER に従って並べ替え、未登録カテゴリは末尾に追加
  const groups = new Map();
  CATEGORY_ORDER.forEach(cat => {
    if (rawGroups.has(cat)) groups.set(cat, rawGroups.get(cat));
  });
  rawGroups.forEach((items, cat) => {
    if (!groups.has(cat)) groups.set(cat, items);
  });

  const renderCard = (u, cat) => `
    <div class="utility-card" data-cat="${escapeHtml(cat)}" data-id="${escapeHtml(u.id)}">
      <span class="badge badge-${escapeHtml(u.type)}">${u.type === 'utility' ? 'utility' : 'designcode'}</span>
      <code class="class-name" data-copy="${escapeHtml(u.className)}" role="button" tabindex="0" title="クリックでコピー: ${escapeHtml(u.className)}">${highlightText(u.className, q)}</code>
      <span class="card-meaning" data-meaning="${escapeHtml(u.meaning)}">${highlightText(u.meaning, q)}</span>
      <div class="row-btns">
        <button class="copy-css-btn" data-id="${escapeHtml(u.id)}" title="${escapeHtml(u.className)} の CSS を確認">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <ellipse cx="8" cy="8" rx="6.5" ry="4.5" stroke="currentColor" stroke-width="1.5"/>
            <circle cx="8" cy="8" r="2" fill="currentColor"/>
          </svg>
          CSS
        </button>
      </div>
    </div>`;

  let html = '';
  groups.forEach((items, cat) => {
    const collapsed = utilityState.collapsedCategories.has(cat);

    // Spacing カテゴリはサブグループ順にソートして区切りを挿入（utility/designcode 混合）
    let itemsHtml = '';
    if (cat === 'Spacing') {
      const subOrder = ['Margin', 'Padding'];
      const sorted = [...items].sort((a, b) => {
        const iA = subOrder.indexOf(getSpacingSubgroup(a.className) || '');
        const iB = subOrder.indexOf(getSpacingSubgroup(b.className) || '');
        return (iA === -1 ? 99 : iA) - (iB === -1 ? 99 : iB);
      });
      let currentSub = null;
      sorted.forEach(u => {
        const sub = getSpacingSubgroup(u.className);
        if (sub && sub !== currentSub) {
          currentSub = sub;
          itemsHtml += `<div class="spacing-subgroup-header">${escapeHtml(sub)}</div>`;
        }
        itemsHtml += renderCard(u, cat);
      });
    } else {
      itemsHtml = items.map(u => renderCard(u, cat)).join('');
    }

    html += `
      <section class="cat-section">
        <div class="cat-header${collapsed ? ' is-collapsed' : ''}" data-cat="${escapeHtml(cat)}" role="button" tabindex="0" aria-expanded="${collapsed ? 'false' : 'true'}">
          <div class="cat-header-inner">
            <svg class="cat-chevron" width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="cat-name">${escapeHtml(cat)}</span>
            <span class="cat-count">${items.length}件</span>
            <div class="cat-header-btns">
              <button class="btn-cat-css-preview" data-cat="${escapeHtml(cat)}" title="${escapeHtml(cat)} カテゴリの CSS をプレビュー">
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <ellipse cx="8" cy="8" rx="6.5" ry="4.5" stroke="currentColor" stroke-width="1.5"/>
                  <circle cx="8" cy="8" r="2" fill="currentColor"/>
                </svg>
                CSS
              </button>
              <button class="btn-cat-css-dl" data-cat="${escapeHtml(cat)}" title="${escapeHtml(cat)} カテゴリの CSS をダウンロード">
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 2v8M5 7l3 3 3-3M2 13h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                DL
              </button>
            </div>
          </div>
        </div>
        <div class="utility-items-grid${collapsed ? ' cat-row-hidden' : ''}" data-cat="${escapeHtml(cat)}">
          ${itemsHtml}
        </div>
      </section>`;
  });

  wrapper.innerHTML = html;
  attachAccordionHandlers();
  attachCopyHandlers();
  renderCatNav();
  if (categoryObserver) categoryObserver.disconnect();
  categoryObserver = setupIntersectionObserver();
}

/* ============================================================
   アコーディオン
   ============================================================ */

function attachAccordionHandlers() {
  document.querySelectorAll('#utility-list-wrapper .cat-header').forEach(header => {
    header.addEventListener('click', e => {
      if (e.target.closest('.btn-cat-css-dl') || e.target.closest('.btn-cat-css-preview')) return;
      toggleCategory(header.dataset.cat);
    });
    header.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target.closest('.btn-cat-css-dl') || e.target.closest('.btn-cat-css-preview')) return;
        e.preventDefault();
        toggleCategory(header.dataset.cat);
      }
    });

    header.querySelector('.btn-cat-css-preview')?.addEventListener('click', e => {
      e.stopPropagation();
      openCategoryCssModal(header.dataset.cat);
    });

    header.querySelector('.btn-cat-css-dl')?.addEventListener('click', e => {
      e.stopPropagation();
      downloadCategoryCss(header.dataset.cat);
    });
  });
}

function toggleCategory(cat) {
  const wrapper = document.getElementById('utility-list-wrapper');
  const isNowCollapsed = utilityState.collapsedCategories.has(cat)
    ? (utilityState.collapsedCategories.delete(cat), false)
    : (utilityState.collapsedCategories.add(cat), true);

  const header = [...wrapper.querySelectorAll('.cat-header')].find(h => h.dataset.cat === cat);
  if (header) {
    header.classList.toggle('is-collapsed', isNowCollapsed);
    header.setAttribute('aria-expanded', isNowCollapsed ? 'false' : 'true');
  }

  const grid = [...wrapper.querySelectorAll('.utility-items-grid')].find(g => g.dataset.cat === cat);
  if (grid) {
    grid.classList.toggle('cat-row-hidden', isNowCollapsed);
  }
}

/* ============================================================
   コピーボタン
   ============================================================ */

function attachCopyHandlers() {
  // CSS プレビュー — モーダルで CSS を確認してからコピー or DL
  document.querySelectorAll('#utility-list-wrapper .copy-css-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      openRowCssModal(btn.dataset.id);
    });
  });

  // クラス名クリックでコピー
  document.querySelectorAll('#utility-list-wrapper .class-name').forEach(el => {
    el.addEventListener('click', async () => {
      const text = el.dataset.copy;
      await copyToClipboard(text);
      showToast(`コピーしました: ${text}`);
      el.classList.add('copied');
      setTimeout(() => el.classList.remove('copied'), 1200);
    });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        el.click();
      }
    });
  });
}

/* ============================================================
   カテゴリ CSS ダウンロード（案B）
   同一カテゴリのクラスを連結し @media ブロックをまとめてダウンロード
   ============================================================ */

function downloadCategoryCss(cat) {
  // フィルタ後ではなく全データからカテゴリを抽出（タブ/検索に依存しない）
  const items = utilityState.all.filter(u => (u.category || 'その他') === cat);
  if (items.length === 0) return;

  const rawCss = items.map(u => getClassCss(u)).join('\n\n');
  const merged = parseMergeCss(rawCss);

  const css = [
    `/* ================================================================`,
    `   ${cat} — ユーティリティCSSクラス`,
    `   ================================================================ */`,
    '',
    merged,
  ].join('\n');

  const safeName = cat.replace(/[^\w　-鿿]/g, '-');
  const blob = new Blob([css], { type: 'text/css' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `utility-${safeName}.css`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`${cat} の CSS をダウンロードしました`);
}

/* ============================================================
   CSS全体生成・モーダル・ダウンロード
   ============================================================ */

function buildCategoryComment(cat) {
  return `/* ================================================================\n   ${cat}\n   ================================================================ */`;
}

function openTypedCssModal(type) {
  const items = type === 'all'
    ? utilityState.all
    : utilityState.all.filter(u => u.type === type);

  if (items.length === 0) return;

  const groups = new Map();
  items.forEach(u => {
    const cat = u.category || 'その他';
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push(u);
  });

  const sections = [];
  groups.forEach((catItems, cat) => {
    sections.push(buildCategoryComment(cat) + '\n\n' + catItems.map(u => getClassCss(u)).join('\n'));
  });

  const label = type === 'all'
    ? `全 ${items.length} クラス`
    : `${type} — ${items.length} クラス`;

  document.getElementById('css-modal-subtitle').textContent = label;
  document.getElementById('css-preview-code').innerHTML = highlightCss(sections.join('\n\n'));
  document.getElementById('css-modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  cssModalDownloadFn = () => downloadTypedCss(type, items);
}

function openCategoryCssModal(cat) {
  const items = utilityState.all.filter(u => (u.category || 'その他') === cat);
  if (items.length === 0) return;

  const preview = buildCategoryComment(cat) + '\n\n' + items.map(u => getClassCss(u)).join('\n');

  document.getElementById('css-modal-subtitle').textContent = `${cat}（${items.length}件）`;
  document.getElementById('css-preview-code').innerHTML = highlightCss(preview);
  document.getElementById('css-modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  cssModalDownloadFn = () => downloadCategoryCss(cat);
}

function closeCssModal() {
  document.getElementById('css-modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

/* ============================================================
   行CSS プレビューモーダル
   ============================================================ */

function openRowCssModal(id) {
  const u = utilityState.all.find(x => x.id === id);
  if (!u) return;
  rowModalCurrentId = id;
  document.getElementById('css-row-modal-classname').textContent = u.className;
  document.getElementById('css-row-preview-code').innerHTML = highlightCss(getClassCss(u));
  document.getElementById('css-row-modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeRowCssModal() {
  document.getElementById('css-row-modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
  rowModalCurrentId = null;
}

function downloadTypedCss(type, items) {
  const typeLabel = type === 'all' ? 'ユーティリティCSSクラス' : `${type} クラス`;
  const header = [
    '/* ================================================================',
    `   ${typeLabel} — 自動生成CSS`,
    '   ================================================================ */',
    '',
  ].join('\n');

  const rawCss = items.map(u => getClassCss(u)).join('\n');
  const merged = parseMergeCss(rawCss);
  const filename = type === 'all' ? 'utility-classes.css' : `utility-${type}.css`;

  const blob = new Blob([header + merged], { type: 'text/css' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`${filename} をダウンロードしました`);
}

/* ============================================================
   カテゴリナビゲーション
   ============================================================ */

function renderCatNav() {
  const wrapper = document.getElementById('cat-nav-wrapper');
  if (!wrapper) return;

  const rawGroups = new Map();
  utilityState.filtered.forEach(u => {
    const cat = u.category || 'その他';
    rawGroups.set(cat, (rawGroups.get(cat) || 0) + 1);
  });

  if (rawGroups.size <= 1) {
    wrapper.innerHTML = '';
    wrapper.hidden = true;
    return;
  }

  // CATEGORY_ORDER に従って並べ替え
  const groups = new Map();
  CATEGORY_ORDER.forEach(cat => {
    if (rawGroups.has(cat)) groups.set(cat, rawGroups.get(cat));
  });
  rawGroups.forEach((count, cat) => {
    if (!groups.has(cat)) groups.set(cat, count);
  });

  wrapper.hidden = false;
  let html = '<nav class="cat-nav" aria-label="カテゴリナビゲーション"><ul class="cat-nav-list">';
  groups.forEach((count, cat) => {
    html += `<li><button class="cat-nav-pill" data-nav-cat="${escapeHtml(cat)}">${escapeHtml(cat)}<span class="cat-nav-count">${count}</span></button></li>`;
  });
  html += '</ul></nav>';
  wrapper.innerHTML = html;

  wrapper.querySelectorAll('.cat-nav-pill').forEach(btn => {
    btn.addEventListener('click', () => scrollToCategory(btn.dataset.navCat));
  });
}

function scrollToCategory(cat) {
  if (utilityState.collapsedCategories.has(cat)) {
    toggleCategory(cat);
  }
  const section = [...document.querySelectorAll('#utility-list-wrapper .cat-section')]
    .find(s => s.querySelector('.cat-header')?.dataset.cat === cat);
  if (!section) return;
  const headerHeight = document.querySelector('.site-header')?.offsetHeight || 56;
  const catNavHeight = document.getElementById('cat-nav-wrapper')?.offsetHeight || 0;
  const top = section.getBoundingClientRect().top + window.scrollY - headerHeight - catNavHeight - 8;
  window.scrollTo({ top, behavior: 'smooth' });
}

/* ============================================================
   イベントハンドラ
   ============================================================ */

// タブ切り替え
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    utilityState.activeTab = btn.dataset.tab;
    applyFilter();
    render();
    updateUrl();
  });
});

// 検索
const searchInput = document.getElementById('search-input');
const searchClearBtn = document.getElementById('search-clear-btn');

searchInput.addEventListener('input', e => {
  utilityState.searchQuery = e.target.value;
  searchClearBtn.hidden = !e.target.value;
  applyFilter();
  render();
  updateUrl();
});

// 検索クリアボタン
searchClearBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchInput.focus();
  searchClearBtn.hidden = true;
  utilityState.searchQuery = '';
  applyFilter();
  render();
  updateUrl();
});

// 全展開 / 全折りたたみボタン
document.getElementById('btn-expand-all')?.addEventListener('click', expandAll);
document.getElementById('btn-collapse-all')?.addEventListener('click', collapseAll);

// CSS を見るボタン（メイン: すべて）
document.getElementById('btn-css-view').addEventListener('click', () => openTypedCssModal('all'));

// CSS を見るボタン（カレット: 種別ドロップダウン）
const cssViewDropdownEl = document.getElementById('css-view-dropdown');
const cssViewCaretBtn = document.getElementById('btn-css-view-caret');

cssViewCaretBtn.addEventListener('click', e => {
  e.stopPropagation();
  const isHidden = cssViewDropdownEl.hidden;
  cssViewDropdownEl.hidden = !isHidden;
  cssViewCaretBtn.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
});

cssViewDropdownEl.querySelectorAll('.css-view-dropdown-item').forEach(item => {
  item.addEventListener('click', () => {
    openTypedCssModal(item.dataset.cssType);
    cssViewDropdownEl.hidden = true;
    cssViewCaretBtn.setAttribute('aria-expanded', 'false');
  });
});

document.addEventListener('click', e => {
  if (!e.target.closest('#css-view-group')) {
    cssViewDropdownEl.hidden = true;
    cssViewCaretBtn.setAttribute('aria-expanded', 'false');
  }
});

// モーダル: 閉じるボタン
document.getElementById('css-modal-close').addEventListener('click', closeCssModal);

// モーダル: オーバーレイクリックで閉じる
document.getElementById('css-modal-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeCssModal();
});

// モーダル: CSSをコピー（表示内容をそのままコピー）
document.getElementById('btn-css-copy').addEventListener('click', async () => {
  const css = document.getElementById('css-preview-code').textContent;
  await copyToClipboard(css);
  showToast('CSSをコピーしました');
  const btn = document.getElementById('btn-css-copy');
  btn.classList.add('copied');
  btn.innerHTML = `
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path d="M3 8l4 4 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    コピー済み`;
  setTimeout(() => {
    btn.classList.remove('copied');
    btn.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
        <path d="M11 5V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      コピー`;
  }, 2000);
});

// モーダル: CSSをダウンロード（コンテキストに応じた関数を実行）
document.getElementById('btn-css-download').addEventListener('click', () => {
  if (cssModalDownloadFn) cssModalDownloadFn();
});

// 行CSSモーダル: 閉じるボタン
document.getElementById('css-row-modal-close').addEventListener('click', closeRowCssModal);

// 行CSSモーダル: オーバーレイクリックで閉じる
document.getElementById('css-row-modal-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeRowCssModal();
});

// 行CSSモーダル: コピー
document.getElementById('btn-row-css-copy').addEventListener('click', async () => {
  if (!rowModalCurrentId) return;
  const u = utilityState.all.find(x => x.id === rowModalCurrentId);
  if (!u) return;
  await copyToClipboard(getClassCss(u));
  showToast(`CSS をコピーしました: ${u.className}`);
  const btn = document.getElementById('btn-row-css-copy');
  btn.classList.add('copied');
  btn.innerHTML = `
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path d="M3 8l4 4 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    コピー済み`;
  setTimeout(() => {
    btn.classList.remove('copied');
    btn.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
        <path d="M11 5V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      コピー`;
  }, 2000);
});

// 行CSSモーダル: ダウンロード
document.getElementById('btn-row-css-download').addEventListener('click', () => {
  if (!rowModalCurrentId) return;
  const u = utilityState.all.find(x => x.id === rowModalCurrentId);
  if (!u) return;
  const css = getClassCss(u);
  const safeName = u.className.replace(/[^\w-]/g, '_');
  const blob = new Blob([css], { type: 'text/css' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName}.css`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`${u.className} をダウンロードしました`);
});

// キーボードショートカット
document.addEventListener('keydown', e => {
  // / キーで検索にフォーカス
  if (e.key === '/') {
    const tag = e.target.tagName.toLowerCase();
    if (tag !== 'input' && tag !== 'textarea' && !e.target.isContentEditable) {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  }
  // ESC でモーダルを閉じる
  if (e.key === 'Escape') {
    closeCssModal();
    closeRowCssModal();
  }
});

/* ============================================================
   初期化
   ============================================================ */

// URL パラメータから状態を復元
(function initFromUrl() {
  const { tab, q } = getUrlParams();
  if (tab !== 'all') {
    utilityState.activeTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
      b.setAttribute('aria-selected', b.dataset.tab === tab ? 'true' : 'false');
    });
  }
  if (q) {
    utilityState.searchQuery = q;
    searchInput.value = q;
    searchClearBtn.hidden = false;
  }
})();

/* ============================================================
   意味テキスト省略ツールチップ
   ============================================================ */

function setupMeaningTooltip() {
  const tooltip = document.createElement('div');
  tooltip.className = 'meaning-tooltip';
  tooltip.hidden = true;
  document.body.appendChild(tooltip);

  const wrapper = document.getElementById('utility-list-wrapper');

  // capture モードで mouseenter/mouseleave をデリゲーション
  wrapper.addEventListener('mouseenter', e => {
    const el = e.target.closest('.card-meaning');
    if (!el || el.scrollWidth <= el.clientWidth) return;
    tooltip.textContent = el.dataset.meaning || '';
    tooltip.hidden = false;
    const rect = el.getBoundingClientRect();
    tooltip.style.top  = (rect.bottom + 6) + 'px';
    tooltip.style.left = rect.left + 'px';
    // 右端はみ出し補正（表示後の実幅で計算）
    requestAnimationFrame(() => {
      const tw = tooltip.getBoundingClientRect().width;
      const over = rect.left + tw - (window.innerWidth - 8);
      if (over > 0) tooltip.style.left = Math.max(8, rect.left - over) + 'px';
    });
  }, true);

  wrapper.addEventListener('mouseleave', e => {
    if (e.target.closest('.card-meaning')) tooltip.hidden = true;
  }, true);
}

loadData();
setupMeaningTooltip();
