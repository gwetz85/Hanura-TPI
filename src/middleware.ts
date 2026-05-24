import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/login");

    if (isAuthPage) {
      if (isAuth) {
        if (token.role === "DPC") {
          return NextResponse.redirect(new URL("/dpc", req.url));
        } else {
          return NextResponse.redirect(new URL("/pac", req.url));
        }
      }
      return null;
    }

    if (!isAuth) {
      let from = req.nextUrl.pathname;
      if (req.nextUrl.search) {
        from += req.nextUrl.search;
      }
      return NextResponse.redirect(
        new URL(`/login?from=${encodeURIComponent(from)}`, req.url)
      );
    }

    // Role based protection
    if (req.nextUrl.pathname.startsWith("/dpc") && token.role !== "DPC") {
      return NextResponse.redirect(new URL("/pac", req.url));
    }

    if (req.nextUrl.pathname.startsWith("/pac") && token.role === "DPC") {
      return NextResponse.redirect(new URL("/dpc", req.url));
    }

    return null;
  },
  {
    callbacks: {
      async authorized() {
        // This is a work-around for handling redirect on auth pages.
        // We return true here so that the middleware function above
        // is always called.
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/dpc/:path*", "/pac/:path*", "/login"],
};
