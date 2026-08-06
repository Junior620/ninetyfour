import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  Image,
  Handshake,
  BarChart3,
  TrendingUp,
  CalendarDays,
  BookOpen,
  MessageSquare,
  CalendarCheck,
  UserCheck,
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
    { href: "/dashboard/parent", icon: LayoutDashboard, label: "parent.overview" },
    { href: "/dashboard/parent/progression", icon: TrendingUp, label: "parent.progressNav" },
    { href: "/dashboard/parent/presences", icon: CalendarCheck, label: "parent.attendance" },
    { href: "/dashboard/parent/scolaire", icon: BookOpen, label: "parent.academic" },
    { href: "/dashboard/parent/calendrier", icon: CalendarDays, label: "parent.calendar" },
    { href: "/dashboard/parent/messages", icon: MessageSquare, label: "parent.messagesNav" },
    { href: "/dashboard/parent/documents", icon: FileText, label: "parent.documents" },
  ],
  coach: [
    { href: "/dashboard/coach", icon: LayoutDashboard, label: "coach.overview" },
    { href: "/dashboard/coach/joueurs", icon: Users, label: "coach.players" },
    { href: "/dashboard/coach/evaluations", icon: ClipboardList, label: "coach.evaluations" },
    { href: "/dashboard/coach/statistiques", icon: BarChart3, label: "coach.statistics" },
  ],
  admin: [
    { href: "/dashboard/admin", icon: LayoutDashboard, label: "admin.overview" },
    { href: "/dashboard/admin/utilisateurs", icon: UserCheck, label: "admin.users" },
    { href: "/dashboard/admin/joueurs", icon: Users, label: "admin.players" },
    { href: "/dashboard/admin/candidatures", icon: ClipboardList, label: "admin.applications" },
    { href: "/dashboard/admin/articles", icon: FileText, label: "admin.articles" },
    { href: "/dashboard/admin/medias", icon: Image, label: "admin.media" },
    { href: "/dashboard/admin/partenaires", icon: Handshake, label: "admin.partners" },
  ],
};

export function isNavActive(pathname: string, href: string): boolean {
  const base = href.split("#")[0];
  if (
    base === "/dashboard/admin" ||
    base === "/dashboard/parent" ||
    base === "/dashboard/coach"
  ) {
    return pathname === base;
  }
  return pathname === base || pathname.startsWith(`${base}/`);
}
