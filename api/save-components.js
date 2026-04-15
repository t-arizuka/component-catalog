'use strict';

const crypto = require('node:crypto');

const GITHUB_API_BASE = 'https://api.github.com';
const TARGET_PATH = 'data/components.json';
const DEFAULT_BRANCH = 'main';

/**
 * 管理画面から受け取ったデータを GitHub の components.json に保存する
 */
module.exports = async (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method === 'GET') {
    res.status(200).json({
      ok: true,
      path: TARGET_PATH,
      branch: process.env.GITHUB_BRANCH || DEFAULT_BRANCH,
    });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const password = typeof body.password === 'string' ? body.password : '';
    const data = body.data;

    if (!process.env.ADMIN_PASSWORD) {
      res.status(500).json({ error: 'ADMIN_PASSWORD が未設定です' });
      return;
    }

    if (!safeEqual(password, process.env.ADMIN_PASSWORD)) {
      res.status(401).json({ error: '管理用パスワードが正しくありません' });
      return;
    }

    validateCatalogData(data);

    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;
    const branch = process.env.GITHUB_BRANCH || DEFAULT_BRANCH;

    if (!owner || !repo || !token) {
      res.status(500).json({ error: 'GitHub 連携用の環境変数が不足しています' });
      return;
    }

    const currentFile = await githubRequest(
      `/repos/${owner}/${repo}/contents/${TARGET_PATH}?ref=${encodeURIComponent(branch)}`,
      {
        method: 'GET',
        token,
      }
    );

    const normalized = normalizeCatalogData(data);
    const jsonText = `${JSON.stringify(normalized, null, 2)}\n`;
    const content = Buffer.from(jsonText, 'utf8').toString('base64');

    const updateResult = await githubRequest(
      `/repos/${owner}/${repo}/contents/${TARGET_PATH}`,
      {
        method: 'PUT',
        token,
        body: {
          message: `chore: update ${TARGET_PATH}`,
          content,
          sha: currentFile.sha,
          branch,
        },
      }
    );

    res.status(200).json({
      ok: true,
      commitSha: updateResult.commit?.sha ?? null,
      commitUrl: updateResult.commit?.html_url ?? null,
    });
  } catch (error) {
    console.error('save-components error:', error);
    res.status(error.statusCode || 500).json({
      error: error.message || '保存に失敗しました',
    });
  }
};

/**
 * GitHub Pages とローカル確認からも呼べるように CORS を許可する
 */
function setCorsHeaders(req, res) {
  const origin = req.headers.origin || '';
  if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (/^https:\/\/.+\.vercel\.app$/i.test(origin)) return true;
  if (/^http:\/\/localhost:\d+$/i.test(origin)) return true;
  if (/^http:\/\/127\.0\.0\.1:\d+$/i.test(origin)) return true;
  return origin === 'https://t-arizuka.github.io';
}

async function readJsonBody(req) {
  if (typeof req.body === 'object' && req.body !== null) {
    return req.body;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function validateCatalogData(data) {
  if (!data || typeof data !== 'object') {
    throw createHttpError(400, '保存データの形式が正しくありません');
  }
  if (!Array.isArray(data.categories)) {
    throw createHttpError(400, 'categories は配列である必要があります');
  }
  if (!Array.isArray(data.components)) {
    throw createHttpError(400, 'components は配列である必要があります');
  }
  if (data.deletedComponents && !Array.isArray(data.deletedComponents)) {
    throw createHttpError(400, 'deletedComponents は配列である必要があります');
  }
}

function normalizeCatalogData(data) {
  return {
    categories: data.categories ?? [],
    components: data.components ?? [],
    deletedComponents: data.deletedComponents ?? [],
  };
}

async function githubRequest(path, { method, token, body }) {
  const response = await fetch(`${GITHUB_API_BASE}${path}`, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'component-catalog-vercel-function',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw createHttpError(response.status, payload?.message || 'GitHub API エラー');
  }

  return payload;
}

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  return a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
