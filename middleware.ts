import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

export default auth((request) => {
  const { nextUrl } = request;
  const isAuthenticated = Boolean(request.auth);
  const isLoginRoute = nextUrl.pathname === "/login";
  const isAuthRoute = nextUrl.pathname.startsWith("/api/auth/");

  if (!isAuthenticated && !isLoginRoute && !isAuthRoute) {
    const loginUrl = new URL("/login", nextUrl);

    if (nextUrl.pathname !== "/") {
      loginUrl.searchParams.set(
        "callbackUrl",
        `${nextUrl.pathname}${nextUrl.search}`
      );
    }

    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isLoginRoute) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
