import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/lib/i18n/routing";
import { ROLE_PATHS } from "@/lib/auth/session";
import {
  SESSION_COOKIE,
  verifySessionToken,
} from "@/lib/auth/session-token";
import type { UserRole } from "@/types";

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

function requiredRoleForPath(pathname: string): UserRole | null {
  if (/\/dashboard\/admin(\/|$)/.test(pathname)) return "admin";
  if (/\/dashboard\/coach(\/|$)/.test(pathname)) return "coach";
  if (/\/dashboard\/parent(\/|$)/.test(pathname)) return "parent";
  if (/\/dashboard\/joueur(\/|$)/.test(pathname)) return "player";
  return null;
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isDashboardPath(pathname)) {
    const session = await verifySessionToken(
      request.cookies.get(SESSION_COOKIE)?.value
    );

    if (!session || (session.status && session.status !== "active")) {
      const locale = getLocaleFromPath(pathname);
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }

    const required = requiredRoleForPath(pathname);
    if (required && session.role !== required) {
      const locale = getLocaleFromPath(pathname);
      return NextResponse.redirect(
        new URL(`/${locale}${ROLE_PATHS[session.role]}`, request.url)
      );
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/", "/(fr|en)/:path*"],
};
