import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/serverClient";

type RecruitmentApplicationRow = {
  id: string;
  status: string;
  pdf_path: string | null;
  form_data: any;
  createdAt?: string;
};

export async function GET() {
  try {
    const canUseSupabase =
      !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!canUseSupabase) {
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
          // form_data contient des clés comme firstNames/lastName/school/primaryPosition
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

