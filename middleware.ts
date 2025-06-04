import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get the pathname
  const pathname = request.nextUrl.pathname

  // If the request is for the root path and not coming from a redirect
  if (pathname === '/' && !request.nextUrl.searchParams.has('from')) {
    // Add a 'from' parameter to prevent redirect loops
    const url = new URL('/dashboard', request.url)
    url.searchParams.set('from', 'root')
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/',
} 