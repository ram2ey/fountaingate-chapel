import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const headers=new Headers(request.headers);
  // Replace any inbound value. Page authorization never relies on this header.
  headers.set('x-fgc-path',request.nextUrl.pathname);
  return NextResponse.next({request:{headers}});
}
export const config={matcher:['/((?!api|health|_next/static|_next/image|favicon.ico).*)']};
