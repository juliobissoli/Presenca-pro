import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-at-least-32-chars-long"
);

export async function middleware(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const isPublicRoute = pathname === "/login" || pathname === "/signup";

  if (!session) {
    if (!isPublicRoute) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  try {
    await jwtVerify(session, JWT_SECRET);

    if (isPublicRoute) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    if (!isPublicRoute) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.set("session", "", {
        maxAge: -1,
        sameSite: "none",
        secure: true,
        path: "/",
      });
      return response;
    }
    return NextResponse.next();
  }
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
