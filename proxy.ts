import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const method = request.method;
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';

  // Log page access
  if (pathname.startsWith('/api/')) {
    // API route access
    console.log(`🔌 API ${method} ${pathname}`, {
      ip,
      query: Object.fromEntries(searchParams),
      userAgent: userAgent.substring(0, 100), // Truncate for brevity
    });
  } else {
    // Page access
    console.log(`📄 Page access: ${pathname}`, {
      ip,
      query: Object.fromEntries(searchParams),
      userAgent: userAgent.substring(0, 100), // Truncate for brevity
    });
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
