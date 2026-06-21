 
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/notes",
  "/quiz",
  "/planner",
  "/doubt",
  "/revision",
];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token");
  const isProtected = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/notes/:path*",
    "/quiz/:path*",
    "/planner/:path*",
    "/doubt/:path*",
    "/revision/:path*",
  ],
};