import { NextResponse } from "next/server";
/** Legacy demo endpoint: applications are processed by the recruitment workflow. */
export async function POST() {
  return NextResponse.json({ success: false, error: "use_recruitment_form", path: "/rejoindre" }, { status: 410 });
}
