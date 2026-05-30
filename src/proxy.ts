import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const isAuth = !!token;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith("/login");

  // Jika sudah login dan membuka halaman login, redirect ke dashboard
  if (isAuthPage && isAuth) {
    if (["DPC", "ADMIN"].includes(token?.role as string)) {
      return NextResponse.redirect(new URL("/dpc", request.url));
    } else {
      return NextResponse.redirect(new URL("/pac", request.url));
    }
  }

  // Jika belum login dan membuka halaman yang dilindungi, redirect ke login
  if (!isAuth && !isAuthPage) {
    const from = pathname + (request.nextUrl.search || "");
    return NextResponse.redirect(
      new URL(`/login?from=${encodeURIComponent(from)}`, request.url)
    );
  }

  // Proteksi berbasis role
  if (pathname.startsWith("/dpc") && !["DPC", "ADMIN"].includes(token?.role as string)) {
    return NextResponse.redirect(new URL("/pac", request.url));
  }

  if (pathname.startsWith("/pac") && ["DPC", "ADMIN"].includes(token?.role as string)) {
    return NextResponse.redirect(new URL("/dpc", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dpc/:path*", "/pac/:path*", "/login"],
};
