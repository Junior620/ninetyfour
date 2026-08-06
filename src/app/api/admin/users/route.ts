import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/get-session";
import {
  readAccountStatus,
  readNameFromUser,
  readRoleFromUser,
} from "@/lib/auth/credentials";
import { getSupabaseAdminClient } from "@/lib/supabase/serverClient";

export async function GET() {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.listUsers({
      perPage: 1000,
    });
    if (error) throw error;

    const items = (data.users ?? [])
      .map((user) => {
        const role = readRoleFromUser(user);
        const status = readAccountStatus(user);
        return {
          id: user.id,
          email: user.email ?? "",
          name: readNameFromUser(user),
          role,
          status,
          createdAt: user.created_at ?? null,
        };
      })
      .filter((u) => u.role && u.role !== "admin")
      .sort((a, b) => {
        const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
        const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
        return tb - ta;
      });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[admin/users GET]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
