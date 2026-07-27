"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Shield,
  User,
  Users,
} from "lucide-react";
import { useRouter } from "@/lib/i18n/navigation";
import { images } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  DEFAULT_DEMO_PASSWORD,
  DEMO_ACCOUNTS,
} from "@/lib/auth/credentials";
import { getRoleClient, ROLE_PATHS, setRoleClient } from "@/lib/auth/session";
import type { UserRole } from "@/types";

const roles: {
  role: UserRole;
  icon: typeof User;
  accent: string;
  iconBg: string;
}[] = [
  {
    role: "player",
    icon: User,
    accent: "group-hover:border-royal/60 group-focus-visible:ring-royal/50",
    iconBg: "bg-royal",
  },
  {
    role: "parent",
    icon: Users,
    accent: "group-hover:border-gold/70 group-focus-visible:ring-gold/50",
    iconBg: "bg-gold",
  },
  {
    role: "coach",
    icon: ClipboardList,
    accent: "group-hover:border-royal/40 group-focus-visible:ring-royal/40",
    iconBg: "bg-navy-light",
  },
  {
    role: "admin",
    icon: Shield,
    accent: "group-hover:border-gold/50 group-focus-visible:ring-gold/40",
    iconBg: "bg-navy",
  },
];

export default function LoginPage() {
  const t = useTranslations("login");
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const existing = getRoleClient();
    if (existing) {
      router.replace(ROLE_PATHS[existing]);
    }
  }, [router]);

  function selectRole(role: UserRole) {
    setSelectedRole(role);
    setEmail(DEMO_ACCOUNTS[role].email);
    setPassword("");
    setError(null);
  }

  function backToRoles() {
    setSelectedRole(null);
    setEmail("");
    setPassword("");
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedRole || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole,
          email,
          password,
        }),
      });

      const data = (await res.json()) as { success?: boolean; error?: string };

      if (!res.ok || !data.success) {
        setError(
          data.error === "invalid_credentials"
            ? t("errorCredentials")
            : t("errorGeneric")
        );
        return;
      }

      setRoleClient(selectedRole);
      router.push(ROLE_PATHS[selectedRole]);
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="relative flex min-h-[calc(100vh-4.5rem)] items-center overflow-hidden">
      <Image
        src={images.hero}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(160deg,rgba(7,20,38,0.94)_0%,rgba(8,26,51,0.88)_45%,rgba(5,7,10,0.92)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #C99A2E 0%, transparent 40%), radial-gradient(circle at 80% 70%, #0A4FA3 0%, transparent 35%)",
        }}
        aria-hidden
      />

      <div className="container-narrow relative z-10 w-full py-14 sm:py-16 md:py-20">
        <motion.div
          className="mb-10 text-center md:mb-12"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center sm:h-20 sm:w-20">
            <Image
              src="/logo-crest.png"
              alt="Ninety One Foot Academy"
              width={80}
              height={80}
              className="h-full w-full object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
              priority
            />
          </div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
            {t("eyebrow")}
          </p>
          <h1 className="font-heading text-3xl font-bold uppercase tracking-[0.08em] text-white sm:text-4xl md:text-5xl">
            {selectedRole ? t("signInTitle") : t("title")}
          </h1>
          <div className="mx-auto mt-4 h-px w-16 bg-gold/70" aria-hidden />
          <p className="mx-auto mt-4 max-w-md text-sm text-white/70 sm:text-base">
            {selectedRole
              ? `${t(`roles.${selectedRole}`)} — ${t("signInSubtitle")}`
              : t("subtitle")}
          </p>
        </motion.div>

        {!selectedRole ? (
          <div className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-2 sm:gap-4">
            {roles.map(({ role, icon: Icon, accent, iconBg }, index) => (
              <motion.div
                key={role}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: prefersReducedMotion ? 0 : 0.12 + index * 0.07,
                  duration: 0.4,
                  ease: "easeOut",
                }}
              >
                <button
                  type="button"
                  onClick={() => selectRole(role)}
                  className={cn(
                    "group flex w-full min-h-[5.25rem] items-center gap-4 rounded-2xl border border-white/12 bg-white/[0.06] p-4 text-left backdrop-blur-md transition-all duration-300",
                    "hover:bg-white/[0.11] hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-navy",
                    "sm:min-h-[5.75rem] sm:gap-5 sm:p-5",
                    accent
                  )}
                >
                  <div
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-lg sm:h-14 sm:w-14",
                      iconBg
                    )}
                  >
                    <Icon className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-heading text-base font-bold text-white sm:text-lg">
                      {t(`roles.${role}`)}
                    </h2>
                    <p className="mt-1 text-sm leading-snug text-white/60">
                      {t(`descriptions.${role}`)}
                    </p>
                  </div>
                  <span
                    className="inline-flex shrink-0 items-center gap-1.5 text-gold/80 transition-all duration-300 group-hover:text-gold group-focus-visible:text-gold"
                    aria-hidden
                  >
                    <span className="hidden text-xs font-semibold uppercase tracking-wider opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 sm:inline">
                      {t("cta")}
                    </span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 sm:h-3.5 sm:w-3.5" />
                  </span>
                  <span className="sr-only">{t("cta")}</span>
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.form
            onSubmit={handleSubmit}
            className="mx-auto w-full max-w-md rounded-2xl border border-white/12 bg-white/[0.06] p-6 backdrop-blur-md sm:p-8"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <button
              type="button"
              onClick={backToRoles}
              className="mb-5 inline-flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-gold"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("back")}
            </button>

            <label className="mb-4 block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/60">
                {t("email")}
              </span>
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-navy/50 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-gold/60 focus:ring-2 focus:ring-gold/30"
              />
            </label>

            <label className="mb-5 block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/60">
                {t("password")}
              </span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-navy/50 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-gold/60 focus:ring-2 focus:ring-gold/30"
              />
            </label>

            {error ? (
              <p className="mb-4 text-sm text-red-300" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full min-h-12 items-center justify-center rounded-xl bg-gold px-4 text-sm font-bold uppercase tracking-wide text-navy transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? t("submitting") : t("submit")}
            </button>

            <p className="mt-4 text-center text-xs text-white/45">
              {t("demoHint", {
                email: DEMO_ACCOUNTS[selectedRole].email,
                password: DEFAULT_DEMO_PASSWORD,
              })}
            </p>
          </motion.form>
        )}
      </div>
    </section>
  );
}
