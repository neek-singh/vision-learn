import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth-custom";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("vision_learn_session")?.value;
  const { pathname } = request.nextUrl;

  // 1. Define Public Paths
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/api/auth");
  const isPublicAsset = pathname.match(/\.(.*)$/); // Match any file extension
  const isRoot = pathname === "/";

  // 2. Handle Logout specially if needed (already handled by route, but just in case)
  if (pathname === "/api/logout") return NextResponse.next();

  // 3. If no token and trying to access protected route
  if (!token) {
    if (!isAuthRoute && !isPublicAsset && !isRoot) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // 4. If token exists, verify it
  const payload = await verifyToken(token);

  // 5. If token is invalid (expired/tampered)
  if (!payload) {
    if (!isAuthRoute && !isPublicAsset) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("vision_learn_session");
      return response;
    }
    return NextResponse.next();
  }

  // 6. If valid token and on login page, redirect to dashboard
  if (isAuthRoute && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
