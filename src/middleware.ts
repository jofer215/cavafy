// Cavafy — free novel writing software
// Copyright (C) 2024  Joshua Ferris
// SPDX-License-Identifier: GPL-3.0-or-later
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const hasRefreshError = (req.auth as { error?: string } | null)?.error === "RefreshTokenError";
  const { pathname } = req.nextUrl;

  const publicPaths = ["/", "/login", "/privacy", "/terms", "/drive-open", "/api/auth"];
  const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));

  // Expired token: force re-login even if technically "authenticated"
  if (hasRefreshError && !isPublic) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("error", "session_expired");
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!isLoggedIn && !isPublic) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && !hasRefreshError && pathname === "/login") {
    return NextResponse.redirect(new URL("/projects", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest\\.json|.*\\.png$|.*\\.svg$).*)"],
};
