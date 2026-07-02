"use client";

import { useEffect } from "react";
import { useRouter } from "@/lib/i18n/navigation";
import type { UserRole } from "@/types";

const rolePaths: Record<UserRole, string> = {
  player: "/dashboard/joueur",
  parent: "/dashboard/parent",
  coach: "/dashboard/coach",
  admin: "/dashboard/admin",
};

export default function DashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("nofa_role") as UserRole | null;
    if (role && rolePaths[role]) {
      router.replace(rolePaths[role]);
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
