// Vercel Edge Middleware - Basic認証
// パスワードは Vercel の環境変数 BASIC_AUTH_PASSWORD で管理
// ユーザー名は環境変数 BASIC_AUTH_USER で管理（未設定時は "catalog"）

export const config = {
  // Vercel内部リクエストとAPIルートは認証をスキップ
  matcher: ['/((?!_vercel|api/).*)'],
};

export default function middleware(request) {
  const expectedUser = process.env.BASIC_AUTH_USER || 'catalog';
  const expectedPassword = process.env.BASIC_AUTH_PASSWORD || 'vision1234';

  const authHeader = request.headers.get('authorization');

  if (authHeader && authHeader.startsWith('Basic ')) {
    const encoded = authHeader.slice('Basic '.length);
    const decoded = atob(encoded);
    const colonIndex = decoded.indexOf(':');
    const user = decoded.slice(0, colonIndex);
    const password = decoded.slice(colonIndex + 1);

    if (user === expectedUser && password === expectedPassword) {
      return; // 認証OK
    }
  }

  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Component Catalog"',
      'Content-Type': 'text/plain',
    },
  });
}
