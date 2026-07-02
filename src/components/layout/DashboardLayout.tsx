"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/lib/i18n/navigation";
import { Sidebar } from "./Sidebar";
import { DashboardMobileNav } from "./DashboardMobileNav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { UserRole } from "@/types";

const roleNames: Record<UserRole, string> = {
  player: "Kofi Mensah",
  parent: "M. Mensah",
  coach: "Coach Martin",
  admin: "Admin NOFA",
};

const rolePaths: Record<UserRole, string> = {
  player: "/dashboard/joueur",
  parent: "/dashboard/parent",
  coach: "/dashboard/coach",
  admin: "/dashboard/admin",
};

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole: UserRole;
}

export function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
  const router = useRouter();
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("nofa_role") as UserRole | null;
    if (!stored) {
      router.push("/login");
      return;
    }
    if (stored !== requiredRole) {
      router.push(rolePaths[stored]);
      return;
    }
    setRole(stored);
  }, [requiredRole, router]);

  if (!role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy border-t-gold" />
      </div>
    );
  }

  const initials = roleNames[role]
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <div className="flex min-h-screen bg-cream">
      <div className="hidden md:block">
        <Sidebar role={role} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b bg-white px-4 md:px-6">
          <DashboardMobileNav role={role} />
          <h1 className="truncate text-sm font-bold uppercase tracking-wider text-navy md:hidden">
            Dashboard
          </h1>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-text-muted sm:block">
              {roleNames[role]}
            </span>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-navy text-xs text-gold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
