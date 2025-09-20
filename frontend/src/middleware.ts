import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 1. Get the 'auth_token' cookie
  const token = request.cookies.get('auth_token')

  // 2. Get the path the user is trying to access
  const { pathname } = request.nextUrl

  // 3. If the user has NO token AND is trying to access a protected route...
  //    ...redirect them to the /auth page.
  if (!token && pathname !== '/auth') {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  // 4. If the user HAS a token AND is trying to access the /auth page...
  //    ...redirect them to the home page (or dashboard).
  if (token && pathname === '/auth') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 5. If none of the above, let the request continue.
  return NextResponse.next()
}

// 6. The 'matcher' config tells the middleware WHICH routes to run on.
export const config = {
  /*
   * Match all request paths except for the ones starting with:
   * - api (API routes)
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   */
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}