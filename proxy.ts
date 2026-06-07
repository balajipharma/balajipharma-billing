import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect AdminPanel and print routes
  if (pathname.startsWith("/AdminPanel") || pathname.startsWith("/print")) {
    const session = request.cookies.get("pharma_session")?.value;

    // Valid session looks like "admin_1", "admin_2", etc.
    if (!session || !session.startsWith("admin_")) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    return NextResponse.next();
  }

  // Redirect root to login or admin
  if (pathname === "/") {
    const session = request.cookies.get("pharma_session")?.value;
    if (session && session.startsWith("admin_")) {
      return NextResponse.redirect(new URL("/AdminPanel", request.url));
    }
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/AdminPanel/:path*", "/print/:path*"],
};
