import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Routes that don't require authentication
const publicRoutes = ['/login', '/reset-password', '/verify-pin', '/auth/error']

// Routes that require admin permissions
const adminRoutes = ['/Admin_Home']

// Routes that require staff admin permissions
const staffAdminRoutes = ['/StaffAdmin']

// Routes that require at least staff permissions
const staffRoutes = ['/Staff_Home', '/Staff_Communications', '/Staff_Forms', '/Staff_Events']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow API routes and static files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico')
  ) {
    return NextResponse.next()
  }

  // Check if route is public
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  try {
    // Get NextAuth session token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    // If no token, redirect to login
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Check admin routes
    if (adminRoutes.some(route => pathname.startsWith(route))) {
      if (!['ADMIN', 'CHIEF_COUNCIL'].includes(token.role as string)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }

    // Check staff admin routes
    if (staffAdminRoutes.some(route => pathname.startsWith(route))) {
      if (!['STAFF_ADMIN', 'ADMIN', 'CHIEF_COUNCIL'].includes(token.role as string)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }

    // Check staff routes (accessible by all authenticated staff and above)
    if (staffRoutes.some(route => pathname.startsWith(route))) {
      if (!['STAFF', 'STAFF_ADMIN', 'ADMIN', 'CHIEF_COUNCIL'].includes(token.role as string)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }

    // Add user info to headers for use in components
    const response = NextResponse.next()
    response.headers.set('x-user-id', token.id as string)
    response.headers.set('x-user-role', token.role as string)
    
    return response
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}