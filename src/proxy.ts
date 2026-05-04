import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from './lib/session';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  const isPublicPath = path === '/login' || path.startsWith('/api/auth');
  const isApiRoute = path.startsWith('/api/') && !path.startsWith('/api/auth');

  // Skip middleware for static files and Next.js internal paths
  if (path.startsWith('/_next') || path.includes('.')) {
    return NextResponse.next();
  }

  const session = await getSession();

  if (!session && !isPublicPath) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (session && path === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Check admin role for admin routes
  if (path.startsWith('/admin') && session?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
