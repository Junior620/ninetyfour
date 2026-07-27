import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/serverClient";
import { normalizeAppStatus } from "@/lib/admin/labels";
import { requireSession } from "@/lib/auth/get-session";

type RecruitmentApplicationRow = {
  id: string;
  status: string;
  pdf_path: string | null;
  form_data: any;
  createdAt?: string;
};

function canUseSupabase() {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function requireAdmin() {
  return requireSession(["admin"]);
}

export async function GET() {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    if (!canUseSupabase()) {
      return NextResponse.json({ items: [] });
    }

    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("recruitment_applications")
      .select("id,status,pdf_path,form_data,createdAt")
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("[admin recruitments] list error", error);
      return NextResponse.json({ items: [] });
    }

    const rows = (data ?? []) as RecruitmentApplicationRow[];

    const items = await Promise.all(
      rows.map(async (row) => {
        let pdfSignedUrl: string | null = null;
        if (row.pdf_path) {
          const signed = await supabase.storage
            .from("recruitment-pdfs")
            .createSignedUrl(row.pdf_path, 60 * 60);
          pdfSignedUrl = signed.data?.signedUrl ?? null;
        }

        return {
          id: row.id,
          status: row.status,
          pdfSignedUrl,
          createdAt: row.createdAt ?? null,
          ...(row.form_data ?? {}),
        };
      })
    );

    return NextResponse.json({ items });
  } catch (e) {
    console.error("[admin recruitments] error", e);
    return NextResponse.json({ items: [] });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    const status = normalizeAppStatus(body.status);

    if (!id) {
      return NextResponse.json({ success: false, error: "missing_id" }, { status: 400 });
    }

    if (!canUseSupabase()) {
      return NextResponse.json({ success: true, id, status, persisted: false });
    }

    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from("recruitment_applications")
      .update({ status: status.toUpperCase() })
      .eq("id", id);

    if (error) {
      console.error("[admin recruitments] patch error", error);
      return NextResponse.json({ success: false, error: "update_failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id, status, persisted: true });
  } catch (e) {
    console.error("[admin recruitments] patch error", e);
    return NextResponse.json({ success: false, error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") ?? "";
    if (!id) {
      return NextResponse.json({ success: false, error: "missing_id" }, { status: 400 });
    }

    if (!canUseSupabase()) {
      return NextResponse.json({ success: true, id, persisted: false });
    }

    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("recruitment_applications").delete().eq("id", id);

    if (error) {
      console.error("[admin recruitments] delete error", error);
      return NextResponse.json({ success: false, error: "delete_failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id, persisted: true });
  } catch (e) {
    console.error("[admin recruitments] delete error", e);
    return NextResponse.json({ success: false, error: "server_error" }, { status: 500 });
  }
}
