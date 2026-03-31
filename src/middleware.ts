import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const session = req.auth;
  const { pathname } = req.nextUrl;

  // Забанений або pending юзер з JWT — виганяємо
  if (session && session.user.status !== "active") {
    if (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/api/saved") ||
      pathname.startsWith("/api/user") ||
      pathname.startsWith("/api/upload") ||
      pathname.startsWith("/api/files")
    ) {
      return pathname.startsWith("/api/")
        ? NextResponse.json({ error: "Forbidden" }, { status: 403 })
        : NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Admin API — захист на рівні middleware
  if (pathname.startsWith("/api/admin")) {
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "admin" || session.user.status !== "active") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (pathname.startsWith("/dashboard/admin")) {
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
    if (session.user.role !== "admin") return NextResponse.redirect(new URL("/403", req.url));
  }

  if (!session && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (session && session.user.status === "active" && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/api/saved/:path*",
    "/api/user/:path*",
    "/api/user/storage",
    "/api/upload",
    "/api/files/:path*",
    "/api/admin/:path*"
  ]
};
