import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(request) {
    const token = request.nextauth.token;
    const pathname = request.nextUrl.pathname;

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (pathname !== "/change-password" && token.mustChangePassword) {
      return NextResponse.redirect(new URL("/change-password", request.url));
    }

    if (pathname === "/change-password" && !token.mustChangePassword) {
      return NextResponse.redirect(new URL("/stores", request.url));
    }

    if (token.role === "MANAGER" && ["/users", "/payroll"].includes(pathname)) {
      return NextResponse.redirect(new URL("/stores", request.url));
    }

    if (token.role === "CO_OWNER" && pathname === "/users") {
      return NextResponse.redirect(new URL("/stores", request.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
);

export const config = {
  matcher: ["/stores", "/employees", "/attendance", "/users", "/payroll", "/settings", "/change-password"],
};
