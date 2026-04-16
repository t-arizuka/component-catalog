/**
 * admin.js
 * 管理画面（admin.html）の処理
 * データフロー: fetch components.json → localStorage 一時保存 → JSON エクスポート
 */

'use strict';

const STORAGE_KEY = 'componentCatalogData';
const ADMIN_PASSWORD_STORAGE_KEY = 'componentCatalogAdminPassword';
const REMOTE_SAVE_PATH = '/api/save-components';

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
  /** File System Access API のファイルハンドル（null = 未接続） */
  fileHandle: null,
  remoteMode: false,
  /** バリアント管理: -1 = デフォルトタブ、0+ = variants 配列のインデックス */
  variantIndex: -1,
  /** デフォルトタブの HTML（f-html から同期） */
  defaultHtml: '',
  /** バリアント一覧 { label: string, html: string }[] */
  variantData: [],
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

function isRemoteSaveMode() {
  return location.protocol.startsWith('http') && /\.vercel\.app$/i.test(location.hostname);
}

function updateSaveModeUi(tone = 'default', text = '') {
  const statusEl = document.getElementById('save-mode-status');
  const hintEl = document.getElementById('save-mode-hint');
  const fieldsEl = document.getElementById('remote-save-fields');

  if (!statusEl || !hintEl || !fieldsEl) return;

  fieldsEl.hidden = !adminState.remoteMode;

  if (adminState.remoteMode) {
    statusEl.textContent = text || '公開保存モード（GitHub を更新）';
    hintEl.textContent = '保存すると Vercel Function が GitHub の data/components.json を更新します。GitHub Pages への反映には少し時間がかかる場合があります。';
  } else {
    statusEl.textContent = text || 'ローカル編集モード';
    hintEl.textContent = 'この画面ではブラウザ内の一時保存と JSON エクスポートを行います。公開反映したい場合は Vercel 上の admin.html を利用してください。';
  }

  statusEl.className = tone === 'default'
    ? 'save-mode-status'
    : `save-mode-status ${tone}`;
}

function getRemoteAdminPassword() {
  return getValue('remote-admin-password').trim();
}

function persistRemoteAdminPassword() {
  const password = getRemoteAdminPassword();
  if (password) {
    sessionStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, password);
  } else {
    sessionStorage.removeItem(ADMIN_PASSWORD_STORAGE_KEY);
  }
}

function ensureSaveReady() {
  if (!adminState.remoteMode) return true;

  const passwordInput = document.getElementById('remote-admin-password');
  if (!getRemoteAdminPassword()) {
    updateSaveModeUi('error', '管理用パスワードを入力してください');
    passwordInput?.focus();
    showToast('公開保存には管理用パスワードが必要です', 'error');
    return false;
  }

  return true;
}

async function syncCurrentData() {
  if (adminState.remoteMode) {
    await saveToRemote();
    return;
  }
  await saveToFile();
}

async function commitDataMutation(mutator) {
  if (!ensureSaveReady()) return false;

  const prevData = JSON.parse(JSON.stringify(adminState.data));
  mutator(adminState.data);
  saveToStorage();

  try {
    await syncCurrentData();
    return true;
  } catch (error) {
    adminState.data = prevData;
    saveToStorage();
    throw error;
  }
}

async function saveToRemote() {
  persistRemoteAdminPassword();

  const res = await fetch(REMOTE_SAVE_PATH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    body: JSON.stringify({
      password: getRemoteAdminPassword(),
      data: adminState.data,
    }),
  });

  const result = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = result.error || '公開保存に失敗しました';
    updateSaveModeUi('error', '公開保存に失敗しました');
    throw new Error(message);
  }

  const time = new Date().toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });
  updateSaveModeUi('success', `GitHub に保存済み（${time}）`);
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
  setValue('f-css', comp.css ?? '');
  setValue('f-author', comp.author ?? '');

  // AI メタデータ
  setValue('f-use-cases', (comp.useCases ?? []).join(', '));
  setValue('f-layout', comp.layout ?? '');
  setValue('f-columns', (comp.columns ?? []).join(', '));

  // バリアントデータをロード（デフォルトタブの HTML を f-html にセット）
  adminState.defaultHtml = comp.html ?? '';
  adminState.variantData = JSON.parse(JSON.stringify(comp.variants ?? []));
  adminState.variantIndex = -1;
  setValue('f-html', adminState.defaultHtml);
  renderVariantTabs();

  const titleEl = document.getElementById('form-panel-title');
  if (titleEl) titleEl.textContent = `「${comp.name}」を編集`;

  updatePreview();
  scrollToForm();
}

/* ============================================================
   バリアント管理
   ============================================================ */

/**
 * バリアントタブバーを描画する
 */
function renderVariantTabs() {
  const bar = document.getElementById('variant-tab-bar');
  if (!bar) return;

  bar.innerHTML = '';

  // デフォルトタブ
  const defaultTab = document.createElement('button');
  defaultTab.type = 'button';
  defaultTab.className = `variant-tab${adminState.variantIndex === -1 ? ' active' : ''}`;
  defaultTab.textContent = 'デフォルト';
  defaultTab.dataset.index = '-1';
  defaultTab.addEventListener('click', () => switchVariantTab(-1));
  bar.appendChild(defaultTab);

  // バリアントタブ
  adminState.variantData.forEach((v, i) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = `variant-tab${adminState.variantIndex === i ? ' active' : ''}`;
    tab.textContent = v.label || `バリアント${i + 1}`;
    tab.dataset.index = String(i);
    tab.addEventListener('click', () => switchVariantTab(i));
    bar.appendChild(tab);
  });

  // 追加ボタン
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'btn-add-variant';
  addBtn.textContent = '+ バリアントを追加';
  addBtn.addEventListener('click', addVariant);
  bar.appendChild(addBtn);

  // バリアントラベル行の表示切替
  const labelRow = document.getElementById('variant-label-row');
  if (labelRow) {
    labelRow.hidden = adminState.variantIndex === -1;
    if (adminState.variantIndex >= 0) {
      setValue('f-variant-label', adminState.variantData[adminState.variantIndex]?.label ?? '');
    }
  }
}

/**
 * 現在のタブの編集内容を adminState に同期する
 */
function syncCurrentVariantHtml() {
  const html = getValue('f-html');
  if (adminState.variantIndex === -1) {
    adminState.defaultHtml = html;
  } else if (adminState.variantData[adminState.variantIndex]) {
    adminState.variantData[adminState.variantIndex].html = html;
  }
}

/**
 * バリアントタブを切り替える
 * @param {number} index - -1: デフォルト, 0+: バリアント
 */
function switchVariantTab(index) {
  // 現在の内容を保存
  syncCurrentVariantHtml();
  if (adminState.variantIndex >= 0 && adminState.variantData[adminState.variantIndex]) {
    adminState.variantData[adminState.variantIndex].label =
      getValue('f-variant-label').trim() || adminState.variantData[adminState.variantIndex].label;
  }

  adminState.variantIndex = index;

  // 新しいタブの HTML を f-html にロード
  if (index === -1) {
    setValue('f-html', adminState.defaultHtml);
  } else {
    setValue('f-html', adminState.variantData[index]?.html ?? '');
  }

  renderVariantTabs();
  updatePreview();
}

/**
 * 新しいバリアントを追加する
 */
function addVariant() {
  syncCurrentVariantHtml();
  if (adminState.variantIndex >= 0 && adminState.variantData[adminState.variantIndex]) {
    adminState.variantData[adminState.variantIndex].label =
      getValue('f-variant-label').trim() || adminState.variantData[adminState.variantIndex].label;
  }
  const newIndex = adminState.variantData.length;
  adminState.variantData.push({ label: `バリアント${newIndex + 1}`, html: '' });
  switchVariantTab(newIndex);
}

/**
 * 現在のバリアントを削除する
 */
function deleteCurrentVariant() {
  if (adminState.variantIndex < 0) return;
  adminState.variantData.splice(adminState.variantIndex, 1);
  switchVariantTab(-1);
}

/**
 * フォームをリセットする
 */
function resetForm() {
  ['f-id', 'f-name', 'f-tags', 'f-description', 'f-html', 'f-css', 'f-author',
   'f-use-cases', 'f-layout', 'f-columns'].forEach(id => {
    setValue(id, '');
  });
  // カテゴリは先頭に戻す
  const catSelect = document.getElementById('f-category');
  if (catSelect && catSelect.options.length > 0) {
    catSelect.selectedIndex = 0;
  }
  // バリアント状態をリセット
  adminState.defaultHtml = '';
  adminState.variantData = [];
  adminState.variantIndex = -1;
  renderVariantTabs();
}

/**
 * フォームの値を取得してコンポーネントオブジェクトを返す
 * @returns {object|null} バリデーション失敗時は null
 */
function getFormValues() {
  // 現在のタブの内容を state に同期してから収集する
  syncCurrentVariantHtml();
  if (adminState.variantIndex >= 0 && adminState.variantData[adminState.variantIndex]) {
    adminState.variantData[adminState.variantIndex].label =
      getValue('f-variant-label').trim() || adminState.variantData[adminState.variantIndex].label;
  }

  const id = getValue('f-id').trim();
  const name = getValue('f-name').trim();
  const category = getValue('f-category');
  const tagsRaw = getValue('f-tags');
  const description = getValue('f-description').trim();
  // html はデフォルトタブの内容（syncCurrentVariantHtml で同期済み）
  const html = adminState.defaultHtml;
  const css = getValue('f-css');
  const author = getValue('f-author').trim();

  // AI メタデータ（任意）
  const useCases = getValue('f-use-cases').split(',').map(t => t.trim()).filter(Boolean);
  const layout = getValue('f-layout').trim();
  const columnsRaw = getValue('f-columns');
  const columns = columnsRaw.split(',').map(t => parseInt(t.trim(), 10)).filter(n => !isNaN(n));

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

  // バリアントデータ（空なら variants フィールドを省略）
  const variantsField = adminState.variantData.length > 0
    ? adminState.variantData.map(v => ({ label: v.label, html: v.html }))
    : undefined;

  const result = {
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

  // AI メタデータ：値があるときのみフィールドを追加
  if (useCases.length > 0) result.useCases = useCases;
  if (layout) result.layout = layout;
  if (columns.length > 0) result.columns = columns;
  if (variantsField) result.variants = variantsField;

  return result;
}

/**
 * フォームの値を保存する（新規 or 更新）
 */
async function saveComponent() {
  const comp = getFormValues();
  if (!comp) return;

  const isEditing = Boolean(adminState.editingId);

  try {
    await commitDataMutation((draft) => {
      const components = draft.components ?? [];

      if (adminState.editingId) {
        const idx = components.findIndex(c => c.id === adminState.editingId);
        if (idx !== -1) {
          components[idx] = comp;
        }
      } else {
        components.push(comp);
      }

      draft.components = components;
    });
  } catch (error) {
    console.error('保存エラー:', error);
    showToast(error.message || '保存に失敗しました', 'error');
    return;
  }

  renderTable();
  resetForm();
  adminState.editingId = null;

  const titleEl = document.getElementById('form-panel-title');
  if (titleEl) titleEl.textContent = '新規コンポーネントを登録';

  updatePreview();

  if (adminState.remoteMode) {
    showToast(`「${comp.name}」を公開保存しました`);
  } else if (isEditing) {
    showToast(`「${comp.name}」を更新しました`);
  } else {
    showToast(`「${comp.name}」を登録しました`);
  }
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

async function confirmDelete() {
  const id = adminState.deletingId;
  if (!id) return;

  const comp = (adminState.data.components ?? []).find(c => c.id === id);
  if (!comp) return;

  try {
    await commitDataMutation((draft) => {
      const idx = (draft.components ?? []).findIndex(c => c.id === id);
      if (idx === -1) return;

      if (!Array.isArray(draft.deletedComponents)) {
        draft.deletedComponents = [];
      }
      draft.deletedComponents.push({ ...draft.components[idx], deletedAt: formatDate() });
      draft.components.splice(idx, 1);
    });
  } catch (error) {
    console.error('削除エラー:', error);
    showToast(error.message || '削除に失敗しました', 'error');
    closeDeleteDialog();
    return;
  }

  renderTable();
  renderDeletedTable();
  showToast(`「${comp.name}」を削除済みエリアに移動しました`);

  if (adminState.editingId === id) {
    cancelForm();
  }

  closeDeleteDialog();
}

/**
 * 削除済みコンポーネントをアクティブ一覧に戻す
 */
async function restoreComponent(id) {
  const deleted = adminState.data.deletedComponents ?? [];
  const idx = deleted.findIndex(c => c.id === id);
  if (idx === -1) return;

  const comp = { ...deleted[idx] };
  delete comp.deletedAt;

  try {
    await commitDataMutation((draft) => {
      const items = draft.deletedComponents ?? [];
      const deletedIndex = items.findIndex(c => c.id === id);
      if (deletedIndex === -1) return;

      const restored = { ...items[deletedIndex] };
      delete restored.deletedAt;

      items.splice(deletedIndex, 1);
      draft.deletedComponents = items;
      draft.components.push(restored);
    });
  } catch (error) {
    console.error('復元エラー:', error);
    showToast(error.message || '復元に失敗しました', 'error');
    return;
  }

  renderTable();
  renderDeletedTable();
  showToast(`「${comp.name}」を復元しました`);
}

/**
 * 削除済みコンポーネントを完全削除する
 */
async function permanentlyDelete(id, name) {
  const deleted = adminState.data.deletedComponents ?? [];
  const idx = deleted.findIndex(c => c.id === id);
  if (idx === -1) return;

  try {
    await commitDataMutation((draft) => {
      const items = draft.deletedComponents ?? [];
      const deletedIndex = items.findIndex(c => c.id === id);
      if (deletedIndex === -1) return;

      items.splice(deletedIndex, 1);
      draft.deletedComponents = items;
    });
  } catch (error) {
    console.error('完全削除エラー:', error);
    showToast(error.message || '完全削除に失敗しました', 'error');
    return;
  }

  renderDeletedTable();
  showToast(`「${name}」を完全に削除しました`);
}

/**
 * 削除済みコンポーネント一覧を描画する
 */
function renderDeletedTable() {
  const tbody = document.getElementById('deleted-tbody');
  const section = document.getElementById('deleted-section');
  if (!tbody || !section) return;

  const deleted = adminState.data.deletedComponents ?? [];
  section.style.display = deleted.length === 0 ? 'none' : '';

  if (deleted.length === 0) return;

  tbody.innerHTML = '';
  for (const comp of deleted) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="table-name deleted-name">${escapeHtml(comp.name)}</td>
      <td><span class="table-category">${escapeHtml(comp.category)}</span></td>
      <td class="table-date">${escapeHtml(comp.deletedAt ?? '—')}</td>
      <td>
        <div class="table-actions">
          <button class="btn-restore" data-id="${escapeHtml(comp.id)}">元に戻す</button>
          <button class="btn-perm-delete" data-id="${escapeHtml(comp.id)}" data-name="${escapeHtml(comp.name)}">完全削除</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  }

  tbody.querySelectorAll('.btn-restore').forEach(btn => {
    btn.addEventListener('click', () => restoreComponent(btn.dataset.id));
  });

  tbody.querySelectorAll('.btn-perm-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm(`「${btn.dataset.name}」を完全に削除しますか？この操作は元に戻せません。`)) {
        permanentlyDelete(btn.dataset.id, btn.dataset.name);
      }
    });
  });
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
   File System Access API（ローカルファイルへの直接書き込み）
   ============================================================ */

/**
 * components.json をファイルピッカーで開き、ファイルハンドルを取得する
 * 以降の保存・削除・カテゴリ操作で自動的にファイルに書き込まれる
 */
async function openJsonFile() {
  if (!window.showOpenFilePicker) {
    showToast('このブラウザはFile System Access APIに対応していません（Chrome推奨）', 'error');
    return;
  }
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
    });
    // ファイルを開いた直後（ユーザー操作中）に書き込み権限を取得
    const permission = await handle.requestPermission({ mode: 'readwrite' });
    if (permission !== 'granted') {
      showToast('書き込み権限が拒否されました', 'error');
      return;
    }
    adminState.fileHandle = handle;
    updateFileStatus();
    showToast(`「${handle.name}」を開きました。以降の変更は自動で上書き保存されます`);
  } catch (e) {
    // キャンセル時は何もしない
    if (e.name !== 'AbortError') {
      showToast('ファイルを開けませんでした', 'error');
    }
  }
}

/**
 * ファイルハンドルが取得済みの場合、現在のデータを components.json に書き込む
 */
async function saveToFile() {
  if (!adminState.fileHandle) return;
  try {
    const writable = await adminState.fileHandle.createWritable();
    await writable.write(JSON.stringify(adminState.data, null, 2));
    await writable.close();
  } catch (e) {
    console.error('ファイルへの書き込みに失敗:', e);
    if (e.name === 'NotFoundError') {
      adminState.fileHandle = null;
      updateFileStatus();
      showToast('ファイルが見つかりません。再度「JSONファイルを開く」を実行してください', 'error');
    } else {
      showToast(`書き込みエラー（${e.name}）`, 'error');
    }
  }
}

/**
 * ファイル接続状態のラベルを更新する
 */
function updateFileStatus() {
  const statusEl = document.getElementById('file-status');
  if (!statusEl) return;
  if (adminState.fileHandle) {
    statusEl.textContent = `✓ ${adminState.fileHandle.name} に接続中`;
    statusEl.className = 'file-status connected';
  } else {
    statusEl.textContent = '未接続';
    statusEl.className = 'file-status';
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
    const prevData = JSON.parse(JSON.stringify(adminState.data));
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      // 最低限のスキーマ確認
      if (!Array.isArray(parsed.components)) {
        throw new Error('components フィールドが見つかりません');
      }

      adminState.data = parsed;
      saveToStorage();

      if (adminState.remoteMode) {
        if (!ensureSaveReady()) {
          adminState.data = prevData;
          saveToStorage();
          return;
        }
        await syncCurrentData();
      }

      renderTable();
      renderDeletedTable();
      renderCategoryOptions();
      renderCategoryManager();
      showToast(adminState.remoteMode ? 'JSON をインポートして公開保存しました' : 'JSONをインポートしました');
    } catch (err) {
      console.error('インポートエラー:', err);
      adminState.data = prevData;
      saveToStorage();
      showToast(err.message || 'JSONの読み込みに失敗しました', 'error');
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

async function addCategory() {
  const input = document.getElementById('new-category-input');
  const name = input?.value.trim();
  if (!name) { showToast('カテゴリ名を入力してください', 'error'); return; }

  const cats = adminState.data.categories ?? [];
  if (cats.includes(name)) { showToast(`「${name}」はすでに存在します`, 'error'); return; }

  try {
    await commitDataMutation((draft) => {
      const nextCats = draft.categories ?? [];
      nextCats.push(name);
      draft.categories = nextCats;
    });
  } catch (error) {
    console.error('カテゴリ追加エラー:', error);
    showToast(error.message || 'カテゴリ追加に失敗しました', 'error');
    return;
  }

  renderCategoryManager();
  renderCategoryOptions();
  if (input) input.value = '';
  showToast(`「${name}」を追加しました`);
}

async function deleteCategory(name) {
  // 使用中のカテゴリは削除不可
  const inUse = (adminState.data.components ?? []).some(c => c.category === name);
  if (inUse) {
    showToast(`「${name}」は使用中のため削除できません`, 'error');
    return;
  }

  try {
    await commitDataMutation((draft) => {
      const cats = draft.categories ?? [];
      const idx = cats.indexOf(name);
      if (idx === -1) return;

      cats.splice(idx, 1);
      draft.categories = cats;
    });
  } catch (error) {
    console.error('カテゴリ削除エラー:', error);
    showToast(error.message || 'カテゴリ削除に失敗しました', 'error');
    return;
  }

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
  adminState.remoteMode = isRemoteSaveMode();

  // データ読み込み
  await loadData();

  // カテゴリ select 生成 + カテゴリ管理UI描画
  renderCategoryOptions();
  renderCategoryManager();

  // 一覧テーブル描画
  renderTable();
  renderDeletedTable();

  // 初期 ID 生成
  const ids = (adminState.data.components ?? []).map(c => c.id);
  const catSelect = document.getElementById('f-category');
  const cat = catSelect?.value || (adminState.data.categories?.[0] ?? 'その他');
  setValue('f-id', generateId(cat, ids));

  // 初期プレビュー
  updatePreview();

  const passwordInput = document.getElementById('remote-admin-password');
  const storedPassword = sessionStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY);
  if (storedPassword && passwordInput) {
    passwordInput.value = storedPassword;
  }
  passwordInput?.addEventListener('input', () => {
    persistRemoteAdminPassword();
    if (adminState.remoteMode && getRemoteAdminPassword()) {
      updateSaveModeUi('info', '公開保存モード（GitHub を更新）');
    }
  });
  updateSaveModeUi();

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

  // バリアントラベル入力: リアルタイムでタブ名を更新
  document.getElementById('f-variant-label')?.addEventListener('input', () => {
    const label = getValue('f-variant-label').trim();
    if (adminState.variantIndex >= 0 && adminState.variantData[adminState.variantIndex]) {
      adminState.variantData[adminState.variantIndex].label = label;
      // タブボタンのテキストを即時更新
      const bar = document.getElementById('variant-tab-bar');
      const activeTab = bar?.querySelector(`.variant-tab[data-index="${adminState.variantIndex}"]`);
      if (activeTab) activeTab.textContent = label || `バリアント${adminState.variantIndex + 1}`;
    }
  });

  // バリアント削除ボタン
  document.getElementById('btn-delete-variant')?.addEventListener('click', deleteCurrentVariant);

  // 初期バリアントタブ描画
  renderVariantTabs();

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

  // JSONファイルを開く（File System Access API）
  document.getElementById('btn-open-file')?.addEventListener('click', openJsonFile);

  // ファイル接続状態の初期表示
  updateFileStatus();

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
