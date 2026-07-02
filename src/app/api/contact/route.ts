import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validations/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = contactSchema.parse(body);

    // MVP: log to console. Future: save to Supabase via Prisma.
    console.log("[Contact received]", {
      name: data.name,
      email: data.email,
      subject: data.subject,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Contact error]", error);
    return NextResponse.json(
      { success: false, error: "Validation failed" },
      { status: 400 }
    );
  }
}
