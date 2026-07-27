import { NextResponse } from "next/server";
import {
  ROLE_COOKIE,
  SESSION_COOKIE,
  roleCookieOptions,
  sessionCookieOptions,
} from "@/lib/auth/session-token";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
  response.cookies.set(ROLE_COOKIE, "", { ...roleCookieOptions(0), maxAge: 0 });
  return response;
}
