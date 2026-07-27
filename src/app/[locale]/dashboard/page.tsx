"use client";

import { useEffect } from "react";
import { useRouter } from "@/lib/i18n/navigation";
import { getRoleClient, ROLE_PATHS } from "@/lib/auth/session";

export default function DashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const role = getRoleClient();
    if (role) {
      router.replace(ROLE_PATHS[role]);
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy border-t-gold" />
    </div>
  );
}
