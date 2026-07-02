"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/i18n/navigation";
import { motion } from "framer-motion";
import { User, Users, ClipboardList, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { UserRole } from "@/types";

const roles: { role: UserRole; icon: typeof User; color: string }[] = [
  { role: "player", icon: User, color: "bg-royal" },
  { role: "parent", icon: Users, color: "bg-gold" },
  { role: "coach", icon: ClipboardList, color: "bg-navy-light" },
  { role: "admin", icon: Shield, color: "bg-navy" },
];

const rolePaths: Record<UserRole, string> = {
  player: "/dashboard/joueur",
  parent: "/dashboard/parent",
  coach: "/dashboard/coach",
  admin: "/dashboard/admin",
};

export default function LoginPage() {
  const t = useTranslations("login");
  const router = useRouter();

  function selectRole(role: UserRole) {
    localStorage.setItem("nofa_role", role);
    router.push(rolePaths[role]);
  }

  return (
    <section className="flex min-h-[80vh] items-center section-padding bg-cream">
      <div className="container-narrow w-full">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold uppercase tracking-wide text-black-premium md:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-4 text-text-muted">{t("subtitle")}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {roles.map(({ role, icon: Icon, color }, index) => (
            <motion.div
              key={role}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <button
                onClick={() => selectRole(role)}
                className="w-full min-h-[4.5rem] text-left"
              >
                <Card className="h-full border-0 bg-white shadow-sm transition-all hover:shadow-md hover:ring-2 hover:ring-gold/50">
                  <CardContent className="flex items-center gap-4 p-5 sm:gap-5 sm:p-6">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-xl ${color} text-white`}
                    >
                      <Icon className="h-7 w-7" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-black-premium">
                        {t(`roles.${role}`)}
                      </h2>
                      <p className="mt-1 text-sm text-text-muted">
                        {t(`descriptions.${role}`)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
