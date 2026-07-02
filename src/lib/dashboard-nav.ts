import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  Image,
  Handshake,
  BarChart3,
} from "lucide-react";
import type { UserRole } from "@/types";

export const dashboardRoleNav: Record<
  UserRole,
  { href: string; icon: typeof LayoutDashboard; label: string }[]
> = {
  player: [
    { href: "/dashboard/joueur", icon: LayoutDashboard, label: "player.title" },
  ],
  parent: [
    { href: "/dashboard/parent", icon: LayoutDashboard, label: "parent.title" },
  ],
  coach: [
    { href: "/dashboard/coach", icon: LayoutDashboard, label: "coach.title" },
    { href: "/dashboard/coach#players", icon: Users, label: "coach.players" },
    { href: "/dashboard/coach#evaluation", icon: ClipboardList, label: "coach.addEvaluation" },
    { href: "/dashboard/coach#stats", icon: BarChart3, label: "coach.statistics" },
  ],
  admin: [
    { href: "/dashboard/admin", icon: LayoutDashboard, label: "admin.title" },
    { href: "/dashboard/admin#players", icon: Users, label: "admin.players" },
    { href: "/dashboard/admin#applications", icon: ClipboardList, label: "admin.applications" },
    { href: "/dashboard/admin#articles", icon: FileText, label: "admin.articles" },
    { href: "/dashboard/admin#media", icon: Image, label: "admin.media" },
    { href: "/dashboard/admin#partners", icon: Handshake, label: "admin.partners" },
  ],
};
