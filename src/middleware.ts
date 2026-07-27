import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/lib/i18n/routing";
import { AUTH_COOKIE, parseRoleCookie } from "@/lib/auth/session";

const intlMiddleware = createMiddleware(routing);

function getLocaleFromPath(pathname: string): string {
  const segment = pathname.split("/")[1];
  if (routing.locales.includes(segment as "fr" | "en")) {
    return segment;
  }
  return routing.defaultLocale;
}

function isDashboardPath(pathname: string): boolean {
  return /^\/(fr|en)\/dashboard(\/|$)/.test(pathname);
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isDashboardPath(pathname)) {
    const role = parseRoleCookie(request.cookies.get(AUTH_COOKIE)?.value);
    if (!role) {
      const locale = getLocaleFromPath(pathname);
      const loginUrl = new URL(`/${locale}/login`, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/", "/(fr|en)/:path*"],
};
