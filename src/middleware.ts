import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 開発環境ではスキップ
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  console.log('Middleware running on:', request.url);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('BASIC_AUTH_USER exists:', !!process.env.BASIC_AUTH_USER);

  // Basic認証チェック
  const authHeader = request.headers.get('authorization');
  const username = process.env.BASIC_AUTH_USER || 'admin';
  const password = process.env.BASIC_AUTH_PASSWORD || 'dropblox2024';
  const expectedAuth = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');

  if (authHeader !== expectedAuth) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
