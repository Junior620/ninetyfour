import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/get-session";
import { getSupabaseAdminClient } from "@/lib/supabase/serverClient";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    const body = await request.json();
    const status =
      body.status === "active" || body.status === "rejected"
        ? body.status
        : null;

    if (!status) {
      return NextResponse.json({ error: "invalid_status" }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();
    const { data: existing, error: getError } =
      await admin.auth.admin.getUserById(id);
    if (getError || !existing.user) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const role = existing.user.app_metadata?.role;
    if (role === "admin") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { error } = await admin.auth.admin.updateUserById(id, {
      app_metadata: {
        ...(existing.user.app_metadata ?? {}),
        status,
      },
      user_metadata: {
        ...(existing.user.user_metadata ?? {}),
        status,
      },
    });

    if (error) throw error;

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("[admin/users PATCH]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
