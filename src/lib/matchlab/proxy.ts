import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function matchlabProxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.MATCHLAB_SUPABASE_URL;
  const key = process.env.MATCHLAB_SUPABASE_ANON_KEY;
  if (
    url &&
    key &&
    request.cookies.getAll().some((c) => c.name.startsWith("n91-matchlab-auth"))
  ) {
    const db = createServerClient(url, key, {
      cookieOptions: {
        name: "n91-matchlab-auth",
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values) {
          for (const { name, value } of values)
            request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of values)
            response.cookies.set(name, value, options);
        },
      },
    });
    await db.auth.getUser();
  }
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}
