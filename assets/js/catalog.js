/**
 * catalog.js
 * カタログ一覧ページ（index.html）の処理
 */

'use strict';

/* ============================================================
   状態管理
   ============================================================ */
const state = {
  /** 全コンポーネントデータ */
  all: [],
  /** カテゴリ一覧 */
  categories: [],
  /** 現在のフィルタ条件 */
  activeCategory: null,   // null = すべて
  activeTags: new Set(),
  searchQuery: '',
  /** モーダルで表示中のコンポーネント */
  modalComponent: null,
  /** モーダルのアクティブタブ */
  modalTab: 'html',
};

/* ============================================================
   データ取得
   ============================================================ */

/**
 * データを読み込んで state に格納する
 * - file:// プロトコル: components-data.js のインラインデータを使用
 * - HTTP (Live Server等): 毎回 components.json を fetch → JSON更新が即反映される
 */
async function fetchComponents() {
  // file:// のときだけインラインデータを使用（fetch が CORS でブロックされるため）
  if (location.protocol === 'file:' && window.CATALOG_DATA) {
    state.all = window.CATALOG_DATA.components ?? [];
    state.categories = window.CATALOG_DATA.categories ?? [];
    return;
  }
  try {
    const res = await fetch('data/components.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.all = data.components ?? [];
    state.categories = data.categories ?? [];
  } catch (e) {
    console.error('components.json の読み込みに失敗:', e);
    state.all = [];
    state.categories = [];
    showToast('データの読み込みに失敗しました', 'error');
  }
}

/* ============================================================
   フィルタ処理
   ============================================================ */

/**
 * 現在の state に基づいてフィルタ済みコンポーネント配列を返す
 * @returns {object[]}
 */
function getFiltered() {
  const q = state.searchQuery.trim().toLowerCase();

  return state.all.filter(c => {
    // カテゴリフィルタ
    if (state.activeCategory && c.category !== state.activeCategory) return false;

    // タグフィルタ（AND条件: 選択タグをすべて含む）
    if (state.activeTags.size > 0) {
      const cTags = (c.tags ?? []).map(t => t.toLowerCase());
      for (const tag of state.activeTags) {
        if (!cTags.includes(tag.toLowerCase())) return false;
      }
    }

    // テキスト検索（名前・説明・タグ）
    if (q) {
      const haystack = [
        c.name ?? '',
        c.description ?? '',
        ...(c.tags ?? []),
      ].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });
}

/* ============================================================
   サイドバー描画
   ============================================================ */

/**
 * カテゴリリストを描画する
 */
function renderCategories() {
  const list = document.getElementById('category-list');
  if (!list) return;

  // カテゴリごとの件数を計算
  const countMap = {};
  for (const c of state.all) {
    countMap[c.category] = (countMap[c.category] ?? 0) + 1;
  }
  const total = state.all.length;

  // 「すべて」アイテム
  const allItem = createCategoryItem('すべて', total, null);
  list.innerHTML = '';
  list.appendChild(allItem);

  // 各カテゴリ
  for (const cat of state.categories) {
    const count = countMap[cat] ?? 0;
    if (count === 0) continue;
    list.appendChild(createCategoryItem(cat, count, cat));
  }

  updateActiveCategoryUI();
}

/**
 * カテゴリ li 要素を生成する
 */
function createCategoryItem(label, count, value) {
  const li = document.createElement('li');
  li.className = 'category-item';
  li.dataset.category = value ?? '';
  li.innerHTML = `
    <span>${escapeHtml(label)}</span>
    <span class="category-count">${count}</span>
  `;
  li.addEventListener('click', () => {
    state.activeCategory = value;
    state.activeTags.clear();
    updateActiveCategoryUI();
    updateActiveTagUI();
    renderGrid();
    updateResultHeader();
  });
  return li;
}

/**
 * アクティブカテゴリの UI を更新する
 */
function updateActiveCategoryUI() {
  const items = document.querySelectorAll('.category-item');
  for (const item of items) {
    const val = item.dataset.category || null;
    item.classList.toggle('active', val === state.activeCategory);
  }
}

/**
 * タグクラウドを描画する
 */
function renderTagCloud() {
  const cloud = document.getElementById('tag-cloud');
  if (!cloud) return;

  // 全コンポーネントのタグを集計
  const tagSet = new Map();
  for (const c of state.all) {
    for (const tag of (c.tags ?? [])) {
      tagSet.set(tag, (tagSet.get(tag) ?? 0) + 1);
    }
  }

  cloud.innerHTML = '';
  // 件数降順でソート
  const sorted = [...tagSet.entries()].sort((a, b) => b[1] - a[1]);
  for (const [tag] of sorted) {
    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.textContent = tag;
    chip.dataset.tag = tag;
    chip.addEventListener('click', () => toggleTag(tag));
    cloud.appendChild(chip);
  }
}

/**
 * タグをトグルしてフィルタを更新する
 */
function toggleTag(tag) {
  if (state.activeTags.has(tag)) {
    state.activeTags.delete(tag);
  } else {
    state.activeTags.add(tag);
  }
  updateActiveTagUI();
  renderGrid();
  updateResultHeader();
}

/**
 * アクティブタグの UI を更新する
 */
function updateActiveTagUI() {
  const chips = document.querySelectorAll('.tag-chip');
  for (const chip of chips) {
    chip.classList.toggle('active', state.activeTags.has(chip.dataset.tag));
  }
}

/* ============================================================
   グリッド描画
   ============================================================ */

/**
 * フィルタ済みコンポーネントをグリッドに描画する
 */
function renderGrid() {
  const grid = document.getElementById('components-grid');
  if (!grid) return;

  const filtered = getFiltered();
  grid.innerHTML = '';

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h3>コンポーネントが見つかりません</h3>
        <p>検索条件を変えてみてください</p>
      </div>
    `;
    return;
  }

  for (const comp of filtered) {
    grid.appendChild(createCard(comp));
  }
}

/**
 * コンポーネントカード要素を生成する
 * @param {object} comp
 * @returns {HTMLElement}
 */
function createCard(comp) {
  const card = document.createElement('div');
  card.className = 'component-card';
  card.dataset.id = comp.id;

  // タグ表示（最大5個）
  const tagsHtml = (comp.tags ?? []).slice(0, 5)
    .map(t => `<span class="card-tag">${escapeHtml(t)}</span>`)
    .join('');

  card.innerHTML = `
    <div class="card-preview">
      <iframe
        title="${escapeHtml(comp.name)}"
        sandbox="allow-scripts allow-same-origin"
        loading="lazy"
      ></iframe>
      <button class="btn-expand-preview" data-action="expand-preview" title="拡大プレビュー">
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
          <path d="M10 2h4v4M6 14H2v-4M14 2l-5 5M2 14l5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        拡大
      </button>
    </div>
    <div class="card-info">
      <div class="card-meta">
        <span class="card-category">${escapeHtml(comp.category)}</span>
      </div>
      <div class="card-name">${escapeHtml(comp.name)}</div>
      <div class="card-description">${escapeHtml(comp.description ?? '')}</div>
      <div class="card-tags">${tagsHtml}</div>
    </div>
    <div class="card-actions">
      <button class="btn-code" data-action="view-code">コードを見る</button>
      <button class="btn-copy" data-action="copy-html">HTML</button>
      <button class="btn-copy" data-action="copy-css">CSS</button>
      <button class="btn-figma" data-action="copy-figma" title="コンポーネントJSONをコピー → Figmaプラグインに貼り付け">
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="2" width="5" height="5" rx="1.2" fill="currentColor" opacity=".7"/>
          <rect x="9" y="2" width="5" height="5" rx="1.2" fill="currentColor" opacity=".85"/>
          <rect x="2" y="9" width="5" height="5" rx="1.2" fill="currentColor" opacity=".7"/>
          <circle cx="11.5" cy="11.5" r="2.5" fill="currentColor"/>
        </svg>
        Figma
      </button>
    </div>
  `;

  // iframe の srcdoc を設定（XSS対策: 属性経由でなく property 経由で設定）
  const iframe = card.querySelector('iframe');
  iframe.srcdoc = buildSrcdoc(comp.html ?? '', comp.css ?? '', true);

  // ホイール操作を iframe の contentWindow に転送（pointer-events: none のままスクロール可能にする）
  card.querySelector('.card-preview').addEventListener('wheel', (e) => {
    e.preventDefault();
    iframe.contentWindow?.scrollBy(0, e.deltaY);
  }, { passive: false });

  // ボタンイベント
  card.querySelector('[data-action="view-code"]').addEventListener('click', () => openModal(comp));
  card.querySelector('[data-action="expand-preview"]').addEventListener('click', (e) => {
    e.stopPropagation();
    openPreviewModal(comp);
  });
  card.querySelector('[data-action="copy-html"]').addEventListener('click', async () => {
    const ok = await copyToClipboard(comp.html ?? '');
    showToast(ok ? 'HTMLをコピーしました' : 'コピーに失敗しました', ok ? 'success' : 'error');
  });
  card.querySelector('[data-action="copy-css"]').addEventListener('click', async () => {
    const ok = await copyToClipboard(comp.css ?? '');
    showToast(ok ? 'CSSをコピーしました' : 'コピーに失敗しました', ok ? 'success' : 'error');
  });
  card.querySelector('[data-action="copy-figma"]').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    btn.style.opacity = '0.5';
    const ok = await copyComponentForFigma(comp);
    btn.disabled = false;
    btn.style.opacity = '';
    showToast(
      ok ? 'Figmaプラグインにペーストしてください' : 'コピーに失敗しました',
      ok ? 'success' : 'error'
    );
  });

  return card;
}

/* ============================================================
   拡大プレビューモーダル
   ============================================================ */

/**
 * 拡大プレビューモーダルを開く
 * @param {object} comp
 */
function openPreviewModal(comp) {
  const overlay = document.getElementById('preview-overlay');
  const titleEl = document.getElementById('preview-dialog-title');
  const subtitleEl = document.getElementById('preview-dialog-subtitle');
  const iframe = document.getElementById('preview-dialog-iframe');

  if (titleEl) titleEl.textContent = comp.name;
  if (subtitleEl) subtitleEl.textContent = `${comp.category} • ${comp.id}`;
  if (iframe) iframe.srcdoc = buildSrcdoc(comp.html ?? '', comp.css ?? '', true);

  // ビューポートボタンをリセット（全幅を選択状態に）
  document.querySelectorAll('.btn-viewport').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.width === '100%');
  });
  applyViewportWidth('100%');

  overlay?.classList.add('visible');
  document.body.style.overflow = 'hidden';
}

/**
 * 拡大プレビューモーダルを閉じる
 */
function closePreviewModal() {
  document.getElementById('preview-overlay')?.classList.remove('visible');
  document.body.style.overflow = '';

  // 閉じるときに iframe の src をクリアしてメモリ解放
  const iframe = document.getElementById('preview-dialog-iframe');
  if (iframe) iframe.srcdoc = '';
}

/**
 * プレビューの幅を切り替える
 * @param {string} width - '100%' | '1440px' | '768px' | '375px'
 */
function applyViewportWidth(width) {
  const body = document.getElementById('preview-dialog-body');
  if (!body) return;
  if (width === '100%') {
    body.style.width = '';
    body.style.maxWidth = '';
    body.style.margin = '';
  } else {
    body.style.width = width;
    body.style.maxWidth = '100%';
    body.style.margin = '0 auto';
  }
}

/* ============================================================
   結果ヘッダー更新
   ============================================================ */
function updateResultHeader() {
  const countEl = document.getElementById('result-count');
  if (countEl) {
    const n = getFiltered().length;
    const total = state.all.length;
    countEl.innerHTML = `<strong>${n}</strong> / ${total} 件`;
  }
}

/* ============================================================
   コードモーダル
   ============================================================ */

/**
 * モーダルを開く
 * @param {object} comp
 */
function openModal(comp) {
  state.modalComponent = comp;
  state.modalTab = 'html';

  const overlay = document.getElementById('modal-overlay');
  const title = document.getElementById('modal-title');
  const subtitle = document.getElementById('modal-subtitle');

  if (title) title.textContent = comp.name;
  if (subtitle) subtitle.textContent = `${comp.category} • ${comp.id}`;

  // コードをシンタックスハイライト付きで表示
  setModalCode('html', comp.html ?? '');
  setModalCode('css', comp.css ?? '');
  switchTab('html');

  overlay?.classList.add('visible');
  document.body.style.overflow = 'hidden';
}

/**
 * モーダルを閉じる
 */
function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay?.classList.remove('visible');
  document.body.style.overflow = '';
  state.modalComponent = null;
}

/**
 * モーダルのコードブロックにハイライト済みコードをセットする
 */
function setModalCode(lang, code) {
  const codeEl = document.getElementById(`code-${lang}`);
  if (!codeEl) return;
  // highlight.js が読み込まれていれば使用
  if (window.hljs) {
    const result = hljs.highlight(code, { language: lang === 'html' ? 'xml' : 'css' });
    codeEl.innerHTML = result.value;
  } else {
    codeEl.textContent = code;
  }
}

/**
 * タブを切り替える
 */
function switchTab(tab) {
  state.modalTab = tab;
  // タブボタン
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  // ペイン
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.toggle('active', pane.dataset.tab === tab);
  });
}

/* ============================================================
   Figma用JSONコピー
   ============================================================ */

/**
 * Figmaプラグインに渡すコンポーネントJSONを生成する
 * @param {object} comp
 * @returns {string}
 */
function buildFigmaPayload(comp) {
  return JSON.stringify({
    name: typeof comp?.name === 'string' ? comp.name : '',
    html: typeof comp?.html === 'string' ? comp.html : '',
    css: typeof comp?.css === 'string' ? comp.css : '',
  }, null, 2);
}

/**
 * コンポーネントJSONをクリップボードにコピーする
 * @param {object} comp
 * @returns {Promise<boolean>} コピー成功なら true
 */
async function copyComponentForFigma(comp) {
  return copyToClipboard(buildFigmaPayload(comp));
}

/* ============================================================
   初期化
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  // データ取得
  await fetchComponents();

  // サイドバー描画
  renderCategories();
  renderTagCloud();

  // グリッド描画
  renderGrid();
  updateResultHeader();

  // ---- イベント登録 ----

  // 検索バー
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderGrid();
      updateResultHeader();
    });
  }

  // リセットボタン
  document.getElementById('reset-btn')?.addEventListener('click', () => {
    state.activeCategory = null;
    state.activeTags.clear();
    state.searchQuery = '';
    if (searchInput) searchInput.value = '';
    updateActiveCategoryUI();
    updateActiveTagUI();
    renderGrid();
    updateResultHeader();
  });

  // モーダル閉じるボタン
  document.getElementById('modal-close')?.addEventListener('click', closeModal);

  // モーダル外クリックで閉じる
  document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  // ESC キーで閉じる（コードモーダル・拡大プレビュー両対応）
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closePreviewModal();
    }
  });

  // 拡大プレビュー: 閉じるボタン
  document.getElementById('preview-dialog-close')?.addEventListener('click', closePreviewModal);

  // 拡大プレビュー: オーバーレイ外クリックで閉じる
  document.getElementById('preview-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closePreviewModal();
  });

  // 拡大プレビュー: ビューポート切替ボタン
  document.querySelectorAll('.btn-viewport').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-viewport').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyViewportWidth(btn.dataset.width);
    });
  });

  // モーダルタブボタン
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // モーダルコピーボタン
  document.getElementById('btn-copy-html')?.addEventListener('click', async () => {
    const ok = await copyToClipboard(state.modalComponent?.html ?? '');
    showToast(ok ? 'HTMLをコピーしました' : 'コピーに失敗しました', ok ? 'success' : 'error');
  });
  document.getElementById('btn-copy-css')?.addEventListener('click', async () => {
    const ok = await copyToClipboard(state.modalComponent?.css ?? '');
    showToast(ok ? 'CSSをコピーしました' : 'コピーに失敗しました', ok ? 'success' : 'error');
  });
  document.getElementById('btn-copy-figma')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    btn.style.opacity = '0.5';
    const ok = await copyComponentForFigma(state.modalComponent ?? {});
    btn.disabled = false;
    btn.style.opacity = '';
    showToast(
      ok ? 'Figmaプラグインにペーストしてください' : 'コピーに失敗しました',
      ok ? 'success' : 'error'
    );
  });

  // ハンバーガーメニュー（モバイル）
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');

  const closeSidebar = () => {
    sidebar?.classList.remove('open');
    sidebarOverlay?.classList.remove('visible');
  };

  hamburger?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
    sidebarOverlay?.classList.toggle('visible');
  });
  sidebarOverlay?.addEventListener('click', closeSidebar);
});
