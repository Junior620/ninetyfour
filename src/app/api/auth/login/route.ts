import { NextResponse } from "next/server";
import { getSupabaseAuthClient } from "@/lib/supabase/serverClient";
import { isUserRole } from "@/lib/auth/session";
import {
  ROLE_COOKIE,
  SESSION_COOKIE,
  createSessionToken,
  roleCookieOptions,
  sessionCookieOptions,
} from "@/lib/auth/session-token";
import type { UserRole } from "@/types";

function readRole(user: {
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}): UserRole | null {
  const fromApp = user.app_metadata?.role;
  const fromUser = user.user_metadata?.role;
  if (typeof fromApp === "string" && isUserRole(fromApp)) return fromApp;
  if (typeof fromUser === "string" && isUserRole(fromUser)) return fromUser;
  return null;
}

function readName(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): string {
  const name = user.user_metadata?.name;
  if (typeof name === "string" && name.trim()) return name.trim();
  return user.email?.split("@")[0] ?? "User";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const requestedRole =
      typeof body.role === "string" && isUserRole(body.role) ? body.role : null;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "invalid_payload" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAuthClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return NextResponse.json(
        { success: false, error: "invalid_credentials" },
        { status: 401 }
      );
    }

    const role = readRole(data.user);
    if (!role) {
      console.error("[auth/login] missing role metadata for", email);
      return NextResponse.json(
        { success: false, error: "invalid_credentials" },
        { status: 401 }
      );
    }

    if (requestedRole && requestedRole !== role) {
      return NextResponse.json(
        { success: false, error: "invalid_credentials" },
        { status: 401 }
      );
    }

    const name = readName(data.user);
    const token = await createSessionToken({
      sub: data.user.id,
      email: data.user.email ?? email,
      name,
      role,
    });

    // On utilise notre cookie de session ; pas besoin de garder la session Supabase JS
    await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);

    const response = NextResponse.json({
      success: true,
      role,
      user: {
        id: data.user.id,
        email: data.user.email ?? email,
        name,
        role,
      },
    });

    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    response.cookies.set(ROLE_COOKIE, role, roleCookieOptions());

    return response;
  } catch (error) {
    console.error("[auth/login]", error);
    return NextResponse.json(
      { success: false, error: "server_error" },
      { status: 500 }
    );
  }
}
