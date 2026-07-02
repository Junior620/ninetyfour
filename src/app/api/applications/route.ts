import { NextResponse } from "next/server";
import { applicationSchema } from "@/lib/validations/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = applicationSchema.parse(body);

    // MVP: log to console. Future: save to Supabase via Prisma.
    console.log("[Application received]", {
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      position: data.position,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Application error]", error);
    return NextResponse.json(
      { success: false, error: "Validation failed" },
      { status: 400 }
    );
  }
}
