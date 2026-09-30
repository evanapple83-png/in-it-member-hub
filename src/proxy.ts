import { NextResponse, type NextRequest } from "next/server";

// Passes the requested path to the layouts, so the waiting screen can say which page a
// not-yet-approved member tried to open ("Je probeerde /members te openen").
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-in-it-path", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/vandaag/:path*", "/members/:path*", "/communities/:path*", "/agenda/:path*", "/blog/:path*", "/profile/:path*", "/admin/:path*"],
};
