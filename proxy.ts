import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Renamed from `middleware.ts` in Next.js 16 — see node_modules/next/dist/docs/
// .../file-conventions/proxy.md. Gated by MAINTENANCE_MODE rather than always
// running, since this intercepts every request and any bug here takes the
// whole site down with it.
export function proxy(request: NextRequest) {
  if (process.env.MAINTENANCE_MODE !== "true") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (pathname === "/maintenance") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { message: "NorzaMart is temporarily down for maintenance. Please check back shortly." },
      { status: 503 }
    );
  }

  return NextResponse.rewrite(new URL("/maintenance", request.url));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|opengraph-image|robots.txt|sitemap.xml).*)",
  ],
};
