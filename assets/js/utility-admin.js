/**
 * utility-admin.js
 * ユーティリティクラス管理画面（utility-admin.html）の処理
 * データフロー: fetch utilities.json → localStorage 一時保存 → JSON エクスポート / GitHub保存
 */

'use strict';

const UTILITY_STORAGE_KEY = 'utilityClassData';
const UTILITY_REMOTE_SAVE_PATH = '/api/save-utilities';

/* ============================================================
   状態管理
   ============================================================ */
const utilityAdminState = {
  data: { utilities: [] },
  editingId: null,
  deletingId: null,
  fileHandle: null,
  remoteMode: false,
  searchQuery: '',
  categoryFilter: '',
};

/* ============================================================
   データ読み込み・保存
   ============================================================ */

async function loadData() {
  // file:// プロトコルではインラインデータを使用
  if (location.protocol === 'file:' && window.UTILITY_DATA) {
    utilityAdminState.data = JSON.parse(JSON.stringify(window.UTILITY_DATA));
    saveToStorage();
    return;
  }
  // HTTP の場合: 常に fetch（Live Server では変更がすぐ反映される）
  if (location.protocol !== 'file:') {
    await fetchData();
    return;
  }
  // file:// でインラインデータがない場合: localStorage → fetch
  const stored = localStorage.getItem(UTILITY_STORAGE_KEY);
  if (stored) {
    try {
      utilityAdminState.data = JSON.parse(stored);
      return;
    } catch {
      // パース失敗時は fetch にフォールバック
    }
  }
  await fetchData();
}

async function fetchData() {
  if (location.protocol === 'file:' && window.UTILITY_DATA) {
    utilityAdminState.data = JSON.parse(JSON.stringify(window.UTILITY_DATA));
    saveToStorage();
    return;
  }
  try {
    const res = await fetch('data/utilities.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    utilityAdminState.data = await res.json();
    saveToStorage();
  } catch (e) {
    console.error('utilities.json の読み込みに失敗:', e);
    utilityAdminState.data = { utilities: [] };
    showToast('データの読み込みに失敗しました', 'error');
  }
}

function saveToStorage() {
  try {
    localStorage.setItem(UTILITY_STORAGE_KEY, JSON.stringify(utilityAdminState.data));
  } catch {
    // localStorage が使えない環境では無視
  }
}

/* ============================================================
   保存モード判定
   ============================================================ */

function isRemoteSaveMode() {
  return location.protocol.startsWith('http') && /\.vercel\.app$/i.test(location.hostname);
}

function updateSaveModeUi() {
  const bar = document.getElementById('save-mode-bar');
  const statusEl = document.getElementById('save-mode-status');
  const hintEl = document.getElementById('save-mode-hint');
  const fieldsEl = document.getElementById('remote-save-fields');

  if (!bar) return;

  if (utilityAdminState.remoteMode) {
    bar.hidden = false;
    fieldsEl.hidden = false;
    statusEl.textContent = '公開保存モード';
    hintEl.textContent = 'パスワードを入力して「保存」を押すと GitHub の data/utilities.json も自動更新されます。';
  } else {
    bar.hidden = true;
  }
}

/* ============================================================
   File System Access API
   ============================================================ */

async function openFile() {
  if (!('showOpenFilePicker' in window)) {
    showToast('このブラウザはファイルアクセスに対応していません', 'error');
    return;
  }
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
    });
    utilityAdminState.fileHandle = handle;

    const file = await handle.getFile();
    const text = await file.text();
    utilityAdminState.data = JSON.parse(text);
    saveToStorage();

    document.getElementById('file-status').textContent = `接続済: ${handle.name}`;
    document.getElementById('file-status').classList.add('connected');

    renderList();
    showToast('ファイルを読み込みました');
  } catch (e) {
    if (e.name !== 'AbortError') {
      showToast('ファイルの読み込みに失敗しました', 'error');
    }
  }
}

async function saveToFile() {
  if (!utilityAdminState.fileHandle) return;
  try {
    const writable = await utilityAdminState.fileHandle.createWritable();
    await writable.write(JSON.stringify(utilityAdminState.data, null, 2) + '\n');
    await writable.close();
    showToast('ファイルに保存しました');
  } catch (e) {
    showToast('ファイルの保存に失敗しました', 'error');
  }
}

/* ============================================================
   リモート保存（Vercel → GitHub）
   ============================================================ */

async function saveRemote() {
  const password = document.getElementById('remote-admin-password')?.value.trim() || '';
  if (!password) {
    showToast('管理用パスワードを入力してください', 'error');
    return;
  }

  const statusEl = document.getElementById('save-mode-status');
  if (statusEl) {
    statusEl.textContent = '保存中...';
    statusEl.className = 'save-mode-status';
  }

  try {
    const res = await fetch(UTILITY_REMOTE_SAVE_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, data: utilityAdminState.data }),
    });
    const result = await res.json();

    if (result.ok) {
      showToast('GitHub に保存しました');
      if (statusEl) {
        statusEl.textContent = '保存完了';
        statusEl.className = 'save-mode-status success';
      }
    } else {
      showToast(result.error || '保存に失敗しました', 'error');
      if (statusEl) {
        statusEl.textContent = result.error || '保存に失敗しました';
        statusEl.className = 'save-mode-status error';
      }
    }
  } catch (e) {
    showToast('ネットワークエラーが発生しました', 'error');
    if (statusEl) {
      statusEl.textContent = 'ネットワークエラー';
      statusEl.className = 'save-mode-status error';
    }
  }
}

/* ============================================================
   JSONエクスポート
   ============================================================ */

function exportJson() {
  downloadJson(utilityAdminState.data, 'utilities.json');
  showToast('utilities.json をダウンロードしました');
}

/* ============================================================
   CSS セレクタエスケープ
   ============================================================ */

function escapeCssSelector(className) {
  return className.replace(/[/:]/g, ch => '\\' + ch);
}

/* ============================================================
   リスト描画
   ============================================================ */

function renderList() {
  const tbody = document.getElementById('admin-tbody');
  const countEl = document.getElementById('admin-result-count');
  const q = utilityAdminState.searchQuery.toLowerCase().trim();

  const catFilter = utilityAdminState.categoryFilter;
  const items = (utilityAdminState.data.utilities || []).filter(u => {
    if (catFilter && u.category !== catFilter) return false;
    if (!q) return true;
    return (
      u.className.toLowerCase().includes(q) ||
      u.meaning.toLowerCase().includes(q) ||
      (u.category || '').toLowerCase().includes(q) ||
      (u.keywords || []).some(k => k.toLowerCase().includes(q))
    );
  });

  countEl.textContent = `${items.length} 件 / 合計 ${utilityAdminState.data.utilities.length} 件`;

  if (items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-cell">
          ${q ? '該当するクラスが見つかりません' : 'クラスが登録されていません。「新規追加」から登録してください。'}
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = items.map(u => `
    <tr
      class="${utilityAdminState.editingId === u.id ? 'is-selected' : ''}"
      data-id="${escapeHtml(u.id)}"
    >
      <td>
        <span class="badge badge-${escapeHtml(u.type)}">
          ${u.type === 'utility' ? 'utility' : 'designcode'}
        </span>
      </td>
      <td class="col-class">
        <code class="class-name">${escapeHtml(u.className)}</code>
        ${u.category ? `<small class="item-category">${escapeHtml(u.category)}</small>` : ''}
      </td>
      <td class="col-meaning">${escapeHtml(u.meaning)}</td>
      <td>
        <div class="row-actions">
          <button
            class="btn-row"
            title="編集"
            onclick="startEdit('${escapeHtml(u.id)}')"
            aria-label="${escapeHtml(u.className)} を編集"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M11.5 2.5l2 2-8.5 8.5H3v-2l8.5-8.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button
            class="btn-row delete"
            title="削除"
            onclick="confirmDelete('${escapeHtml(u.id)}')"
            aria-label="${escapeHtml(u.className)} を削除"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M3 4h10M5 4V3h6v1M6 7v5M10 7v5M4 4l1 9h6l1-9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

/* ============================================================
   フォーム操作
   ============================================================ */

function resetForm() {
  utilityAdminState.editingId = null;
  document.getElementById('f-type').value = 'utility';
  document.getElementById('f-category').value = '';
  document.getElementById('f-class-name').value = '';
  document.getElementById('f-meaning').value = '';
  document.getElementById('f-css-raw').value = '';
  document.getElementById('f-keywords').value = '';
  document.getElementById('btn-delete-form').hidden = true;
  updateCategoryDatalist();
  updateFormTitle();
  renderList();
}

function updateCategoryDatalist() {
  const cats = [...new Set(
    (utilityAdminState.data.utilities || []).map(u => u.category).filter(Boolean)
  )].sort();
  const dl = document.getElementById('category-datalist');
  if (dl) {
    dl.innerHTML = cats.map(c => `<option value="${escapeHtml(c)}">`).join('');
  }
  // カテゴリフィルター select を更新
  const sel = document.getElementById('admin-cat-filter');
  if (sel) {
    const current = sel.value;
    sel.innerHTML = '<option value="">すべてのカテゴリ</option>' +
      cats.map(c => `<option value="${escapeHtml(c)}"${c === current ? ' selected' : ''}>${escapeHtml(c)}</option>`).join('');
  }
}

function updateFormTitle() {
  const titleEl = document.getElementById('form-panel-title');
  if (!titleEl) return;

  if (utilityAdminState.editingId) {
    const u = utilityAdminState.data.utilities.find(x => x.id === utilityAdminState.editingId);
    titleEl.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M11.5 2.5l2 2-8.5 8.5H3v-2l8.5-8.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      編集中: <span>${u ? escapeHtml(u.className) : ''}</span>`;
  } else {
    titleEl.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1v14M1 8h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      新規追加`;
  }
}

function startEdit(id) {
  const u = utilityAdminState.data.utilities.find(x => x.id === id);
  if (!u) return;

  utilityAdminState.editingId = id;

  document.getElementById('f-type').value = u.type || 'utility';
  document.getElementById('f-category').value = u.category || '';
  document.getElementById('f-class-name').value = u.className || '';
  document.getElementById('f-meaning').value = u.meaning || '';

  // cssRaw が存在すればそのまま使用、旧フォーマット（cssOutput + mediaQuery）からは自動生成
  if (u.cssRaw) {
    document.getElementById('f-css-raw').value = u.cssRaw;
  } else {
    const sel = `.${escapeCssSelector(u.className || '')}`;
    const decl = u.cssOutput || '';
    if (u.mediaQuery) {
      document.getElementById('f-css-raw').value = `${u.mediaQuery} {\n  ${sel} { ${decl} }\n}`;
    } else {
      document.getElementById('f-css-raw').value = `${sel} { ${decl} }`;
    }
  }

  document.getElementById('f-keywords').value = (u.keywords || []).join(', ');
  document.getElementById('btn-delete-form').hidden = false;

  updateFormTitle();
  renderList();

  // フォームにスクロール（モバイル対応）
  document.querySelector('.admin-right-col')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function getFormValues() {
  return {
    type: document.getElementById('f-type').value,
    category: document.getElementById('f-category').value.trim(),
    className: document.getElementById('f-class-name').value.trim(),
    meaning: document.getElementById('f-meaning').value.trim(),
    cssRaw: document.getElementById('f-css-raw').value.trim(),
    keywords: document.getElementById('f-keywords').value
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0),
  };
}

function validateForm(values) {
  if (!values.type) {
    showToast('種類を選択してください', 'error');
    return false;
  }
  if (!values.category) {
    showToast('カテゴリを入力してください', 'error');
    document.getElementById('f-category').focus();
    return false;
  }
  if (!values.className) {
    showToast('クラス名を入力してください', 'error');
    document.getElementById('f-class-name').focus();
    return false;
  }
  if (!values.meaning) {
    showToast('意味を入力してください', 'error');
    document.getElementById('f-meaning').focus();
    return false;
  }
  if (!values.cssRaw) {
    showToast('CSS を入力してください', 'error');
    document.getElementById('f-css-raw').focus();
    return false;
  }
  return true;
}

function generateId() {
  return 'u-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

async function submitForm() {
  const values = getFormValues();
  if (!validateForm(values)) return;

  const today = getTodayStr();

  if (utilityAdminState.editingId) {
    // 編集
    const idx = utilityAdminState.data.utilities.findIndex(x => x.id === utilityAdminState.editingId);
    if (idx === -1) return;

    utilityAdminState.data.utilities[idx] = {
      ...utilityAdminState.data.utilities[idx],
      type: values.type,
      category: values.category,
      className: values.className,
      meaning: values.meaning,
      cssRaw: values.cssRaw,
      keywords: values.keywords,
      updatedAt: today,
    };
    showToast(`${values.className} を更新しました`);
  } else {
    // 新規
    const newItem = {
      id: generateId(),
      type: values.type,
      category: values.category,
      className: values.className,
      meaning: values.meaning,
      cssRaw: values.cssRaw,
      keywords: values.keywords,
      createdAt: today,
      updatedAt: today,
    };
    utilityAdminState.data.utilities.push(newItem);
    showToast(`${values.className} を追加しました`);
  }

  saveToStorage();

  if (utilityAdminState.fileHandle) {
    saveToFile();
  }

  if (utilityAdminState.remoteMode) {
    await saveRemote();
  }

  resetForm();
}

/* ============================================================
   削除
   ============================================================ */

function confirmDelete(id) {
  const u = utilityAdminState.data.utilities.find(x => x.id === id);
  if (!u) return;

  utilityAdminState.deletingId = id;

  document.getElementById('dialog-message').innerHTML =
    `<code style="font-family:monospace; background:#f1f5f9; padding:0.1em 0.4em; border-radius:3px">${escapeHtml(u.className)}</code> を削除します。この操作は元に戻せません。`;

  document.getElementById('delete-dialog').classList.add('open');
}

function executeDelete() {
  const id = utilityAdminState.deletingId;
  if (!id) return;

  const u = utilityAdminState.data.utilities.find(x => x.id === id);
  utilityAdminState.data.utilities = utilityAdminState.data.utilities.filter(x => x.id !== id);

  saveToStorage();

  if (utilityAdminState.fileHandle) {
    saveToFile();
  }

  if (utilityAdminState.editingId === id) {
    resetForm();
  } else {
    renderList();
  }

  closeDialog();
  showToast(`${u ? u.className : 'クラス'} を削除しました`);
}

function closeDialog() {
  utilityAdminState.deletingId = null;
  document.getElementById('delete-dialog').classList.remove('open');
}

/* ============================================================
   イベントハンドラ
   ============================================================ */

function bindEvents() {
  // 新規追加ボタン
  document.getElementById('btn-new').addEventListener('click', () => {
    resetForm();
    document.getElementById('f-class-name').focus();
  });

  // 保存ボタン
  document.getElementById('btn-submit').addEventListener('click', submitForm);

  // キャンセルボタン
  document.getElementById('btn-cancel').addEventListener('click', resetForm);

  // フォームからの削除ボタン
  document.getElementById('btn-delete-form').addEventListener('click', () => {
    if (utilityAdminState.editingId) {
      confirmDelete(utilityAdminState.editingId);
    }
  });

  // ファイルを開く
  document.getElementById('btn-open-file').addEventListener('click', openFile);

  // JSONエクスポート
  document.getElementById('btn-export').addEventListener('click', exportJson);

  // 検索
  const adminSearch = document.getElementById('admin-search');
  adminSearch.addEventListener('input', e => {
    utilityAdminState.searchQuery = e.target.value;
    renderList();
  });

  // カテゴリフィルター
  document.getElementById('admin-cat-filter')?.addEventListener('change', e => {
    utilityAdminState.categoryFilter = e.target.value;
    renderList();
  });

  // / キーで検索フォーカス
  document.addEventListener('keydown', e => {
    if (e.key === '/') {
      const tag = e.target.tagName.toLowerCase();
      if (tag !== 'input' && tag !== 'textarea' && !e.target.isContentEditable) {
        e.preventDefault();
        adminSearch.focus();
        adminSearch.select();
      }
    }
  });

  // 削除ダイアログ: キャンセル
  document.getElementById('dialog-cancel').addEventListener('click', closeDialog);

  // 削除ダイアログ: 確認
  document.getElementById('dialog-confirm').addEventListener('click', executeDelete);

  // 削除ダイアログ: オーバーレイクリックで閉じる
  document.getElementById('delete-dialog').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeDialog();
  });

  // ESCキーでダイアログを閉じる
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDialog();
  });
}

/* ============================================================
   初期化
   ============================================================ */

async function init() {
  utilityAdminState.remoteMode = isRemoteSaveMode();
  updateSaveModeUi();

  await loadData();
  updateCategoryDatalist();
  renderList();
  bindEvents();
}

init();
