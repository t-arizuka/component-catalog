/**
 * admin.js
 * 管理画面（admin.html）の処理
 * データフロー: fetch components.json → localStorage 一時保存 → JSON エクスポート
 */

'use strict';

const STORAGE_KEY = 'componentCatalogData';

/* ============================================================
   状態管理
   ============================================================ */
const adminState = {
  /** 全データ（categories + components） */
  data: { categories: [], components: [] },
  /** 編集中のコンポーネント ID（null = 新規） */
  editingId: null,
  /** 削除確認中の ID */
  deletingId: null,
};

/* ============================================================
   データ読み込み・保存
   ============================================================ */

/**
 * データを読み込む
 * - file:// プロトコル: components-data.js のインラインデータを使用
 * - HTTP (Live Server等): components.json を fetch → JSON更新が即反映される
 *   （localStorage はキャッシュとして使用）
 */
async function loadData() {
  // file:// のときだけインラインデータを使用（fetch が CORS でブロックされるため）
  if (location.protocol === 'file:' && window.CATALOG_DATA) {
    await fetchData();
    return;
  }
  // HTTP の場合: localStorage → fetch の順（Live Server では常に fetch が成功する）
  if (location.protocol !== 'file:') {
    await fetchData();
    return;
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      adminState.data = JSON.parse(stored);
      return;
    } catch {
      // パース失敗時は fetch にフォールバック
    }
  }
  await fetchData();
}

/**
 * データを取得して state と localStorage にセット
 * - file:// プロトコル: components-data.js のインラインデータを使用
 * - HTTP: components.json を fetch
 */
async function fetchData() {
  // file:// のときだけインラインデータを使用
  if (location.protocol === 'file:' && window.CATALOG_DATA) {
    adminState.data = JSON.parse(JSON.stringify(window.CATALOG_DATA));
    saveToStorage();
    return;
  }
  try {
    const res = await fetch('data/components.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    adminState.data = await res.json();
    saveToStorage();
  } catch (e) {
    console.error('components.json の読み込みに失敗:', e);
    adminState.data = { categories: [], components: [] };
    showToast('データの読み込みに失敗しました', 'error');
  }
}

/**
 * 現在の state を localStorage に保存する
 */
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(adminState.data));
}

/* ============================================================
   一覧テーブル描画
   ============================================================ */

function renderTable() {
  const tbody = document.getElementById('component-tbody');
  if (!tbody) return;

  const components = adminState.data.components ?? [];

  if (components.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="5" class="table-empty">コンポーネントがまだ登録されていません</td></tr>
    `;
    return;
  }

  tbody.innerHTML = '';
  for (const comp of components) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="table-name">${escapeHtml(comp.name)}</td>
      <td><span class="table-category">${escapeHtml(comp.category)}</span></td>
      <td class="table-date">${escapeHtml(comp.createdAt ?? '—')}</td>
      <td class="table-date">${escapeHtml(comp.updatedAt ?? '—')}</td>
      <td>
        <div class="table-actions">
          <button class="btn-edit" data-id="${escapeHtml(comp.id)}">編集</button>
          <button class="btn-delete" data-id="${escapeHtml(comp.id)}">削除</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  }

  // 編集ボタン
  tbody.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => openEditForm(btn.dataset.id));
  });

  // 削除ボタン
  tbody.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => openDeleteDialog(btn.dataset.id));
  });
}

/* ============================================================
   フォーム操作
   ============================================================ */

/**
 * フォームを新規モードでリセットして表示する
 */
function openNewForm() {
  adminState.editingId = null;

  resetForm();

  // ID を自動生成
  const ids = (adminState.data.components ?? []).map(c => c.id);
  const catSelect = document.getElementById('f-category');
  const cat = catSelect?.value || (adminState.data.categories?.[0] ?? 'その他');
  document.getElementById('f-id').value = generateId(cat, ids);

  // フォームタイトル更新
  const titleEl = document.getElementById('form-panel-title');
  if (titleEl) titleEl.textContent = '新規コンポーネントを登録';

  updatePreview();
  scrollToForm();
}

/**
 * 指定 ID のコンポーネントを編集フォームに読み込む
 */
function openEditForm(id) {
  const comp = (adminState.data.components ?? []).find(c => c.id === id);
  if (!comp) return;

  adminState.editingId = id;

  // フォームに値をセット
  setValue('f-id', comp.id ?? '');
  setValue('f-name', comp.name ?? '');
  setValue('f-category', comp.category ?? '');
  setValue('f-tags', (comp.tags ?? []).join(', '));
  setValue('f-description', comp.description ?? '');
  setValue('f-html', comp.html ?? '');
  setValue('f-css', comp.css ?? '');
  setValue('f-author', comp.author ?? '');

  const titleEl = document.getElementById('form-panel-title');
  if (titleEl) titleEl.textContent = `「${comp.name}」を編集`;

  updatePreview();
  scrollToForm();
}

/**
 * フォームをリセットする
 */
function resetForm() {
  ['f-id', 'f-name', 'f-tags', 'f-description', 'f-html', 'f-css', 'f-author'].forEach(id => {
    setValue(id, '');
  });
  // カテゴリは先頭に戻す
  const catSelect = document.getElementById('f-category');
  if (catSelect && catSelect.options.length > 0) {
    catSelect.selectedIndex = 0;
  }
}

/**
 * フォームの値を取得してコンポーネントオブジェクトを返す
 * @returns {object|null} バリデーション失敗時は null
 */
function getFormValues() {
  const id = getValue('f-id').trim();
  const name = getValue('f-name').trim();
  const category = getValue('f-category');
  const tagsRaw = getValue('f-tags');
  const description = getValue('f-description').trim();
  const html = getValue('f-html');
  const css = getValue('f-css');
  const author = getValue('f-author').trim();

  if (!id) { showToast('IDを入力してください', 'error'); return null; }
  if (!name) { showToast('コンポーネント名を入力してください', 'error'); return null; }
  if (!category) { showToast('カテゴリを選択してください', 'error'); return null; }

  // 新規登録時にIDが重複していないか確認
  if (!adminState.editingId) {
    const exists = (adminState.data.components ?? []).some(c => c.id === id);
    if (exists) { showToast(`ID「${id}」はすでに使用されています`, 'error'); return null; }
  }

  const tags = tagsRaw
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  const now = formatDate();

  return {
    id,
    name,
    category,
    tags,
    description,
    html,
    css,
    author,
    createdAt: adminState.editingId
      ? ((adminState.data.components ?? []).find(c => c.id === adminState.editingId)?.createdAt ?? now)
      : now,
    updatedAt: now,
  };
}

/**
 * フォームの値を保存する（新規 or 更新）
 */
function saveComponent() {
  const comp = getFormValues();
  if (!comp) return;

  const components = adminState.data.components ?? [];

  if (adminState.editingId) {
    // 更新
    const idx = components.findIndex(c => c.id === adminState.editingId);
    if (idx !== -1) {
      components[idx] = comp;
    }
    showToast(`「${comp.name}」を更新しました`);
  } else {
    // 新規追加
    components.push(comp);
    showToast(`「${comp.name}」を登録しました`);
  }

  adminState.data.components = components;
  saveToStorage();
  renderTable();
  resetForm();
  adminState.editingId = null;

  const titleEl = document.getElementById('form-panel-title');
  if (titleEl) titleEl.textContent = '新規コンポーネントを登録';

  updatePreview();
}

/**
 * フォームをキャンセルしてリセットする
 */
function cancelForm() {
  adminState.editingId = null;
  resetForm();

  // ID を新規用に再生成
  const ids = (adminState.data.components ?? []).map(c => c.id);
  const catSelect = document.getElementById('f-category');
  const cat = catSelect?.value || (adminState.data.categories?.[0] ?? 'その他');
  document.getElementById('f-id').value = generateId(cat, ids);

  const titleEl = document.getElementById('form-panel-title');
  if (titleEl) titleEl.textContent = '新規コンポーネントを登録';

  updatePreview();
}

/* ============================================================
   削除確認ダイアログ
   ============================================================ */

function openDeleteDialog(id) {
  const comp = (adminState.data.components ?? []).find(c => c.id === id);
  if (!comp) return;

  adminState.deletingId = id;

  const msg = document.getElementById('dialog-message');
  if (msg) msg.textContent = `「${comp.name}」を削除しますか？この操作は元に戻せません。`;

  document.getElementById('dialog-overlay')?.classList.add('visible');
}

function closeDeleteDialog() {
  adminState.deletingId = null;
  document.getElementById('dialog-overlay')?.classList.remove('visible');
}

function confirmDelete() {
  const id = adminState.deletingId;
  if (!id) return;

  const idx = (adminState.data.components ?? []).findIndex(c => c.id === id);
  if (idx !== -1) {
    const name = adminState.data.components[idx].name;
    adminState.data.components.splice(idx, 1);
    saveToStorage();
    renderTable();
    showToast(`「${name}」を削除しました`);

    // 編集中だった場合はフォームもリセット
    if (adminState.editingId === id) {
      cancelForm();
    }
  }

  closeDeleteDialog();
}

/* ============================================================
   リアルタイムプレビュー
   ============================================================ */

function updatePreview() {
  const html = getValue('f-html');
  const css = getValue('f-css');
  const name = getValue('f-name') || '（未入力）';
  const desc = getValue('f-description') || '';
  const tagsRaw = getValue('f-tags');

  // iframe プレビュー更新
  const iframe = document.getElementById('preview-iframe');
  if (iframe) {
    iframe.srcdoc = buildSrcdoc(html, css);
  }

  // メタ情報更新
  const nameEl = document.getElementById('preview-name');
  if (nameEl) nameEl.textContent = name;

  const descEl = document.getElementById('preview-description');
  if (descEl) descEl.textContent = desc;

  const tagsEl = document.getElementById('preview-tags');
  if (tagsEl) {
    const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);
    tagsEl.innerHTML = tags
      .map(t => `<span class="preview-tag">${escapeHtml(t)}</span>`)
      .join('');
  }
}

/* ============================================================
   JSON エクスポート・インポート
   ============================================================ */

function exportJson() {
  downloadJson(adminState.data, 'components.json');
  showToast('JSONをダウンロードしました');
}

function importJson() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      // 最低限のスキーマ確認
      if (!Array.isArray(parsed.components)) {
        throw new Error('components フィールドが見つかりません');
      }

      adminState.data = parsed;
      saveToStorage();
      renderTable();
      renderCategoryOptions();
      renderCategoryManager();
      showToast('JSONをインポートしました');
    } catch (err) {
      console.error('インポートエラー:', err);
      showToast('JSONの読み込みに失敗しました', 'error');
    }
  });
  input.click();
}

/**
 * localStorage のデータを削除して components.json を再取得する
 */
async function resetData() {
  localStorage.removeItem(STORAGE_KEY);
  await fetchData();
  renderTable();
  renderCategoryOptions();
  renderCategoryManager();
  cancelForm();
  showToast('データをリセットしました');
}

/* ============================================================
   カテゴリ管理
   ============================================================ */

function renderCategoryManager() {
  const container = document.getElementById('category-chips');
  if (!container) return;

  const cats = adminState.data.categories ?? [];
  if (cats.length === 0) {
    container.innerHTML = '<span class="no-categories">カテゴリがまだありません</span>';
    return;
  }

  container.innerHTML = cats.map(c => `
    <span class="category-chip-admin">
      ${escapeHtml(c)}
      <button class="btn-remove-cat" data-cat="${escapeHtml(c)}" aria-label="${escapeHtml(c)}を削除">✕</button>
    </span>
  `).join('');

  container.querySelectorAll('.btn-remove-cat').forEach(btn => {
    btn.addEventListener('click', () => deleteCategory(btn.dataset.cat));
  });
}

function addCategory() {
  const input = document.getElementById('new-category-input');
  const name = input?.value.trim();
  if (!name) { showToast('カテゴリ名を入力してください', 'error'); return; }

  const cats = adminState.data.categories ?? [];
  if (cats.includes(name)) { showToast(`「${name}」はすでに存在します`, 'error'); return; }

  cats.push(name);
  adminState.data.categories = cats;
  saveToStorage();
  renderCategoryManager();
  renderCategoryOptions();
  if (input) input.value = '';
  showToast(`「${name}」を追加しました`);
}

function deleteCategory(name) {
  // 使用中のカテゴリは削除不可
  const inUse = (adminState.data.components ?? []).some(c => c.category === name);
  if (inUse) {
    showToast(`「${name}」は使用中のため削除できません`, 'error');
    return;
  }

  const cats = adminState.data.categories ?? [];
  const idx = cats.indexOf(name);
  if (idx === -1) return;

  cats.splice(idx, 1);
  adminState.data.categories = cats;
  saveToStorage();
  renderCategoryManager();
  renderCategoryOptions();
  showToast(`「${name}」を削除しました`);
}

/* ============================================================
   カテゴリ select オプション生成
   ============================================================ */

function renderCategoryOptions() {
  const select = document.getElementById('f-category');
  if (!select) return;

  const cats = adminState.data.categories ?? [];
  select.innerHTML = cats
    .map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`)
    .join('');
}

/* ============================================================
   ドラッグ&ドロップ（HTML / CSS テキストエリア）
   ============================================================ */

function setupDragDrop() {
  ['f-html', 'f-css'].forEach(fieldId => {
    const el = document.getElementById(fieldId);
    if (!el) return;

    el.addEventListener('dragover', (e) => {
      e.preventDefault();
      el.classList.add('drag-over');
    });

    el.addEventListener('dragleave', () => el.classList.remove('drag-over'));

    el.addEventListener('drop', async (e) => {
      e.preventDefault();
      el.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (!file) return;
      el.value = await file.text();
      updatePreview();
    });
  });
}

/* ============================================================
   ヘルパー
   ============================================================ */

function getValue(id) {
  return document.getElementById(id)?.value ?? '';
}

function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function scrollToForm() {
  document.getElementById('form-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ============================================================
   初期化
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  // データ読み込み
  await loadData();

  // カテゴリ select 生成 + カテゴリ管理UI描画
  renderCategoryOptions();
  renderCategoryManager();

  // 一覧テーブル描画
  renderTable();

  // 初期 ID 生成
  const ids = (adminState.data.components ?? []).map(c => c.id);
  const catSelect = document.getElementById('f-category');
  const cat = catSelect?.value || (adminState.data.categories?.[0] ?? 'その他');
  setValue('f-id', generateId(cat, ids));

  // 初期プレビュー
  updatePreview();

  // ---- イベント登録 ----

  // 新規登録ボタン
  document.getElementById('btn-new')?.addEventListener('click', openNewForm);

  // カテゴリ変更時に ID 再生成（新規時のみ）
  catSelect?.addEventListener('change', () => {
    if (!adminState.editingId) {
      const currentIds = (adminState.data.components ?? []).map(c => c.id);
      setValue('f-id', generateId(catSelect.value, currentIds));
    }
    updatePreview();
  });

  // ID 自動生成ボタン
  document.getElementById('btn-gen-id')?.addEventListener('click', () => {
    const cat = getValue('f-category');
    const existingIds = (adminState.data.components ?? [])
      .filter(c => !adminState.editingId || c.id !== adminState.editingId)
      .map(c => c.id);
    setValue('f-id', generateId(cat, existingIds));
  });

  // リアルタイムプレビュー対象フィールド
  ['f-html', 'f-css', 'f-name', 'f-description', 'f-tags'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updatePreview);
  });

  // IDとコンポーネント名の同期チェックボックス
  const syncCheckbox = document.getElementById('sync-id-name');
  const idInput = document.getElementById('f-id');
  syncCheckbox?.addEventListener('change', () => {
    if (syncCheckbox.checked) {
      idInput.value = getValue('f-name');
      idInput.readOnly = true;
      idInput.classList.add('readonly');
    } else {
      idInput.readOnly = false;
      idInput.classList.remove('readonly');
    }
  });
  document.getElementById('f-name')?.addEventListener('input', () => {
    if (syncCheckbox?.checked) setValue('f-id', getValue('f-name'));
  });

  // カテゴリ管理
  document.getElementById('btn-add-category')?.addEventListener('click', addCategory);
  document.getElementById('new-category-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addCategory();
  });

  // ドラッグ&ドロップ
  setupDragDrop();

  // 保存ボタン
  document.getElementById('btn-save')?.addEventListener('click', saveComponent);

  // キャンセルボタン
  document.getElementById('btn-cancel')?.addEventListener('click', cancelForm);

  // JSON エクスポート
  document.getElementById('btn-export')?.addEventListener('click', exportJson);

  // JSON インポート
  document.getElementById('btn-import')?.addEventListener('click', importJson);

  // データリセット
  document.getElementById('btn-reset')?.addEventListener('click', () => {
    if (confirm('localStorage のデータを削除して components.json を再取得します。よろしいですか？')) {
      resetData();
    }
  });

  // 削除ダイアログのボタン
  document.getElementById('btn-delete-confirm')?.addEventListener('click', confirmDelete);
  document.getElementById('btn-delete-cancel')?.addEventListener('click', closeDeleteDialog);
  document.getElementById('dialog-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeDeleteDialog();
  });

  // ESC キーで削除ダイアログを閉じる
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDeleteDialog();
  });
});
