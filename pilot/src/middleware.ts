import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// La vérification fine (session + appartenance organisation) est faite côté serveur
// dans chaque page via requireOrgContext() — ce middleware ne fait qu'une redirection
// rapide basée sur le cookie de session pour éviter un flash de contenu protégé.
const PUBLIC_PATHS = ["/", "/login", "/signup", "/api/auth"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (isPublic || pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const sessionCookie =
    request.cookies.get("authjs.session-token") ?? request.cookies.get("__Secure-authjs.session-token");

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
