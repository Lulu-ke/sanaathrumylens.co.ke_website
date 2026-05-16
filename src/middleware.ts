import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Edge-compatible constants (do NOT import from auth-helpers — uses Node.js modules)
const DASHBOARD_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR", "MODERATOR"];

const ROLE_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 6,
  ADMIN: 5,
  EDITOR: 4,
  AUTHOR: 3,
  MODERATOR: 2,
  READER: 1,
};

// API routes that are public for GET requests
const publicGetApiRoutes = [
  "/api/auth",
  "/api/posts",
  "/api/categories",
  "/api/tags",
  "/api/events",
  "/api/settings",
  "/api/ads",
];

// Role requirements for specific API route prefixes
const apiRoleRequirements: Record<string, string> = {
  "/api/users": "ADMIN",
  "/api/dashboard": "MODERATOR",
  "/api/media": "AUTHOR",
  "/api/bookmarks": "READER",
  "/api/comments": "READER",
};

/**
 * Parse JWT payload from the session token cookie (without verifying signature).
 * This is used for quick role checks in middleware; full verification happens in API routes.
 */
function parseJWTPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    // Base64url decode
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if it's an API route
  const isApiRoute = pathname.startsWith("/api/");

  if (isApiRoute) {
    // Allow auth routes fully
    if (pathname.startsWith("/api/auth")) {
      return NextResponse.next();
    }

    // Allow public API routes (GET requests only)
    const isPublicApi = publicGetApiRoutes.some((route) =>
      pathname.startsWith(route)
    );
    if (isPublicApi && request.method === "GET") {
      return NextResponse.next();
    }

    // Allow newsletter subscribe (POST) without auth
    if (
      pathname.startsWith("/api/newsletter") &&
      request.method === "POST"
    ) {
      return NextResponse.next();
    }

    // For protected API routes, check authentication via session cookie
    const sessionToken =
      request.cookies.get("next-auth.session-token")?.value ||
      request.cookies.get("__Secure-next-auth.session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse JWT for role check (lightweight, no crypto needed for middleware)
    const payload = parseJWTPayload(sessionToken);
    const userRole = (payload?.role as string) || "READER";

    // Check role-based access for specific API routes
    for (const [routePrefix, requiredRole] of Object.entries(
      apiRoleRequirements
    )) {
      if (pathname.startsWith(routePrefix)) {
        const userPermLevel = ROLE_HIERARCHY[userRole] ?? 0;
        const requiredPermLevel = ROLE_HIERARCHY[requiredRole] ?? 0;

        if (userPermLevel < requiredPermLevel) {
          return NextResponse.json(
            { error: "Insufficient permissions" },
            { status: 403 }
          );
        }
        break;
      }
    }

    return NextResponse.next();
  }

  // Check dashboard route access
  if (pathname.startsWith("/dashboard")) {
    const sessionToken =
      request.cookies.get("next-auth.session-token")?.value ||
      request.cookies.get("__Secure-next-auth.session-token")?.value;

    if (!sessionToken) {
      const signInUrl = new URL("/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    const payload = parseJWTPayload(sessionToken);
    const userRole = (payload?.role as string) || "READER";

    if (!DASHBOARD_ROLES.includes(userRole)) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
