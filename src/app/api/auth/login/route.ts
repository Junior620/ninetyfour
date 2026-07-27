import { NextResponse } from "next/server";
import { isUserRole } from "@/lib/auth/session";
import { verifyCredentials } from "@/lib/auth/credentials";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const role = typeof body.role === "string" ? body.role : "";
    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!isUserRole(role) || !email.trim() || !password) {
      return NextResponse.json(
        { success: false, error: "invalid_payload" },
        { status: 400 }
      );
    }

    if (!verifyCredentials(role, email, password)) {
      return NextResponse.json(
        { success: false, error: "invalid_credentials" },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, role });
  } catch {
    return NextResponse.json(
      { success: false, error: "server_error" },
      { status: 500 }
    );
  }
}
