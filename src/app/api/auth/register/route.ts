import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/serverClient";
import {
  isPublicRole,
  readNameFromUser,
} from "@/lib/auth/credentials";
import { notifyAdminNewRegistration } from "@/lib/email/send";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const name =
      typeof body.name === "string" ? body.name.trim() : "";
    const role =
      typeof body.role === "string" && isPublicRole(body.role)
        ? body.role
        : null;

    // Never allow self-registration as admin
    if (typeof body.role === "string" && body.role === "admin") {
      return NextResponse.json(
        { success: false, error: "invalid_role" },
        { status: 403 }
      );
    }

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { success: false, error: "invalid_payload" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "weak_password" },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdminClient();
    const meta = { role, status: "pending" as const };

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: meta,
      user_metadata: { name, ...meta },
    });

    if (error) {
      const message = error.message?.toLowerCase() ?? "";
      if (
        message.includes("already") ||
        message.includes("registered") ||
        message.includes("exists")
      ) {
        return NextResponse.json(
          { success: false, error: "email_taken" },
          { status: 409 }
        );
      }
      console.error("[auth/register]", error);
      return NextResponse.json(
        { success: false, error: "server_error" },
        { status: 500 }
      );
    }

    const user = data.user;
    const displayName = user ? readNameFromUser(user) : name;

    void notifyAdminNewRegistration({
      locale: "fr",
      name: displayName,
      email,
      role,
      userId: user?.id ?? "unknown",
    }).catch((err) => console.error("[auth/register] notify", err));

    return NextResponse.json({
      success: true,
      pending: true,
      message: "pending_approval",
    });
  } catch (error) {
    console.error("[auth/register]", error);
    return NextResponse.json(
      { success: false, error: "server_error" },
      { status: 500 }
    );
  }
}
