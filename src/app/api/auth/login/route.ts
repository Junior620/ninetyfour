import { NextResponse } from "next/server";
import { getSupabaseAuthClient } from "@/lib/supabase/serverClient";
import {
  readAccountStatus,
  readNameFromUser,
  readRoleFromUser,
} from "@/lib/auth/credentials";
import { isUserRole } from "@/lib/auth/session";
import {
  ROLE_COOKIE,
  SESSION_COOKIE,
  createSessionToken,
  roleCookieOptions,
  sessionCookieOptions,
} from "@/lib/auth/session-token";

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

    const role = readRoleFromUser(data.user);
    if (!role) {
      console.error("[auth/login] missing role metadata for", email);
      await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
      return NextResponse.json(
        { success: false, error: "invalid_credentials" },
        { status: 401 }
      );
    }

    if (requestedRole && requestedRole !== role) {
      await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
      return NextResponse.json(
        { success: false, error: "invalid_credentials" },
        { status: 401 }
      );
    }

    const status = readAccountStatus(data.user);
    if (status === "pending") {
      await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
      return NextResponse.json(
        { success: false, error: "pending_approval" },
        { status: 403 }
      );
    }
    if (status === "rejected" || status === "disabled") {
      await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
      return NextResponse.json(
        { success: false, error: "account_disabled" },
        { status: 403 }
      );
    }

    const name = readNameFromUser(data.user);
    const token = await createSessionToken({
      sub: data.user.id,
      email: data.user.email ?? email,
      name,
      role,
      status: "active",
    });

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
