import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Nombres típicos de cookie de sesión (ajusta si tu backend usa otro)
const COOKIE_NAMES = ["JSESSIONID", "SESSION", "auth_session"];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const hasSession = COOKIE_NAMES.some((n) => !!req.cookies.get(n)?.value);

  // Si vas al login y ya tienes sesión -> a dashboard
  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Si vas a una ruta protegida sin sesión -> a login
  if (pathname.startsWith("/dashboard") && !hasSession) {
    const url = new URL("/login", req.url);
    url.search = search;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/dashboard/:path*"],
};
