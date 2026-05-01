import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth-custom";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("vision_learn_session")?.value;
  const pathname = request.nextUrl.pathname;

  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/api/auth");

  if (!token && !isAuthRoute) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (token) {
    const payload = await verifyToken(token);

    if (!payload && !isAuthRoute) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("vision_learn_session");
      return response;
    }

    if (payload && isAuthRoute && pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
