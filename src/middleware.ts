import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes that require authentication
const protectedRoutes = ['/dashboard'];

// Routes that are only accessible when not authenticated
const authRoutes = ['/login'];

// Admin-only routes
const adminRoutes = ['/dashboard/settings'];

// Director+ routes (Admin and Director roles)
const directorRoutes = [
  '/dashboard/ledger',
  '/dashboard/reconcile',
  '/dashboard/settings'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to auth routes and API routes
  if (pathname.startsWith('/api/auth/') || pathname.startsWith('/_next/')) {
    return NextResponse.next();
  }

  // Get token with proper error handling
  let token;
  try {
    token = await getToken({ 
      req: request, 
      secret: process.env.AUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production',
      cookieName: process.env.NODE_ENV === 'production' 
        ? '__Secure-authjs.session-token' 
        : 'authjs.session-token'
    });
  } catch (error) {
    console.error('Token validation error:', error);
    token = null;
  }

  // Handle auth routes (login) - redirect to dashboard if already authenticated
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Check if route requires authentication
  const requiresAuth = protectedRoutes.some(route => pathname.startsWith(route));
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`Middleware: ${pathname}, requiresAuth: ${requiresAuth}, hasToken: ${!!token}`);
  }
  
  if (requiresAuth && !token) {
    // Redirect to login if not authenticated
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated, check role-based permissions
  if (token) {
    const userRole = token.role as string;

    // Ensure user has a valid role
    if (!userRole) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'invalid-session');
      return NextResponse.redirect(loginUrl);
    }

    // Check admin-only routes
    if (adminRoutes.some(route => pathname.startsWith(route))) {
      if (userRole !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard?error=insufficient-permissions', request.url));
      }
    }

    // Check director+ routes
    if (directorRoutes.some(route => pathname.startsWith(route))) {
      if (!['admin', 'director'].includes(userRole)) {
        return NextResponse.redirect(new URL('/dashboard?error=insufficient-permissions', request.url));
      }
    }

    // Additional permission-based checks can be added here
    if (pathname.startsWith('/api/') && pathname !== '/api/auth/signin' && pathname !== '/api/auth/signout') {
      // API routes should have their own permission checks
      if (!userRole) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     * Only match specific protected routes
     */
    '/dashboard/:path*',
    '/login',
    '/api/((?!auth).*)'
  ],
};
