import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};

export function middleware(request: NextRequest) {
  // 開発環境ではスキップ
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  // Vercel環境変数から取得（Edge Runtime対応）
  const username = process.env.BASIC_AUTH_USER || 'admin';
  const password = process.env.BASIC_AUTH_PASSWORD || 'dropblox2024';
  
  // Basic認証チェック
  const authHeader = request.headers.get('authorization');
  
  // 認証ヘッダーがない、または不一致の場合
  if (!authHeader) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="dropblox"',
      },
    });
  }

  // Basic認証の検証
  const base64Credentials = authHeader.split(' ')[1];
  if (!base64Credentials) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="dropblox"',
      },
    });
  }

  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
  const [inputUser, inputPass] = credentials.split(':');

  if (inputUser !== username || inputPass !== password) {
    return new NextResponse('Invalid credentials', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="dropblox"',
      },
    });
  }

  return NextResponse.next();
}
