"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  User,
  Users,
} from "lucide-react";
import { useRouter } from "@/lib/i18n/navigation";
import { images } from "@/lib/data";
import { cn } from "@/lib/utils";
import { PUBLIC_ROLES } from "@/lib/auth/credentials";
import { getRoleClient, ROLE_PATHS, setRoleClient } from "@/lib/auth/session";
import type { UserRole } from "@/types";

type AuthMode = "login" | "register";

const publicRoles: {
  role: Exclude<UserRole, "admin">;
  icon: typeof User;
  iconBg: string;
  accentBorder: string;
  accentGlow: string;
}[] = [
  {
    role: "player",
    icon: User,
    iconBg: "bg-royal",
    accentBorder: "hover:border-royal/50 focus-visible:ring-royal/40",
    accentGlow: "group-hover:shadow-[0_0_0_1px_rgba(10,79,163,0.35),0_20px_50px_rgba(0,0,0,0.35)]",
  },
  {
    role: "parent",
    icon: Users,
    iconBg: "bg-gold",
    accentBorder: "hover:border-gold/55 focus-visible:ring-gold/40",
    accentGlow: "group-hover:shadow-[0_0_0_1px_rgba(201,154,46,0.4),0_20px_50px_rgba(0,0,0,0.35)]",
  },
  {
    role: "coach",
    icon: ClipboardList,
    iconBg: "bg-[#1a3558]",
    accentBorder: "hover:border-white/30 focus-visible:ring-white/30",
    accentGlow: "group-hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_20px_50px_rgba(0,0,0,0.35)]",
  },
];

const inputClass =
  "w-full rounded-xl border border-white/15 bg-navy/55 px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/35 transition-[border-color,box-shadow] focus:border-gold/55 focus:ring-2 focus:ring-gold/25";

export default function LoginPage() {
  const t = useTranslations("login");
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isStaff = selectedRole === "admin";
  const canRegister =
    selectedRole !== null &&
    PUBLIC_ROLES.includes(selectedRole as Exclude<UserRole, "admin">);

  useEffect(() => {
    const existing = getRoleClient();
    if (existing) {
      router.replace(ROLE_PATHS[existing]);
    }
  }, [router]);

  function selectRole(role: UserRole) {
    setSelectedRole(role);
    setMode("login");
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccess(null);
  }

  function backToRoles() {
    setSelectedRole(null);
    setMode("login");
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccess(null);
  }

  function switchMode(next: AuthMode) {
    setMode(next);
    setError(null);
    setSuccess(null);
    setPassword("");
    setConfirmPassword("");
  }

  function mapError(code: string | undefined): string {
    switch (code) {
      case "invalid_credentials":
        return t("errorCredentials");
      case "pending_approval":
        return t("errorPending");
      case "account_disabled":
        return t("errorDisabled");
      case "email_taken":
        return t("errorEmailTaken");
      case "weak_password":
        return t("errorWeakPassword");
      case "password_mismatch":
        return t("errorPasswordMismatch");
      default:
        return mode === "register" ? t("errorRegister") : t("errorGeneric");
    }
  }

  async function handleLogin() {
    if (!selectedRole) return;

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        role: selectedRole,
        email,
        password,
      }),
    });

    const data = (await res.json()) as {
      success?: boolean;
      error?: string;
      role?: UserRole;
    };

    if (!res.ok || !data.success || !data.role) {
      setError(mapError(data.error));
      return;
    }

    setRoleClient(data.role);
    router.push(ROLE_PATHS[data.role]);
  }

  async function handleRegister() {
    if (!selectedRole || !canRegister) return;

    if (password !== confirmPassword) {
      setError(mapError("password_mismatch"));
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: selectedRole,
        name,
        email,
        password,
      }),
    });

    const data = (await res.json()) as {
      success?: boolean;
      error?: string;
      pending?: boolean;
    };

    if (!res.ok || !data.success) {
      setError(mapError(data.error));
      return;
    }

    setSuccess(t("registerSuccess"));
    setMode("login");
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedRole || submitting) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === "register") {
        await handleRegister();
      } else {
        await handleLogin();
      }
    } catch {
      setError(mapError(undefined));
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
        className="object-cover object-[center_30%] scale-105"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(165deg,rgba(5,14,28,0.92)_0%,rgba(7,20,38,0.82)_42%,rgba(4,8,14,0.94)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(201,154,46,0.14), transparent 55%), radial-gradient(ellipse 50% 40% at 90% 80%, rgba(10,79,163,0.18), transparent 50%)",
        }}
        aria-hidden
      />

      <div className="container-narrow relative z-10 w-full py-12 sm:py-16 md:py-20">
        <motion.div
          className="mb-10 text-center md:mb-14"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="mx-auto mb-6 flex h-[4.5rem] w-[4.5rem] items-center justify-center sm:mb-7 sm:h-24 sm:w-24"
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src="/logo-crest.png"
              alt="Ninety One Foot Academy"
              width={96}
              height={96}
              className="h-full w-full object-contain drop-shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
              priority
            />
          </motion.div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-gold">
            {t("eyebrow")}
          </p>
          <h1 className="font-heading text-[1.85rem] font-bold uppercase tracking-[0.1em] text-white sm:text-4xl md:text-[2.75rem] md:tracking-[0.12em]">
            {selectedRole
              ? mode === "register"
                ? t("registerTitle")
                : t("signInTitle")
              : t("title")}
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-white/65 sm:text-base">
            {selectedRole
              ? `${t(`roles.${selectedRole}`)} — ${
                  mode === "register"
                    ? t("registerSubtitle")
                    : t("signInSubtitle")
                }`
              : t("subtitle")}
          </p>
        </motion.div>

        {!selectedRole ? (
          <>
            <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3 sm:gap-5">
              {publicRoles.map(
                ({ role, icon: Icon, iconBg, accentBorder, accentGlow }, index) => (
                  <motion.div
                    key={role}
                    initial={
                      prefersReducedMotion ? false : { opacity: 0, y: 28 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: prefersReducedMotion ? 0 : 0.14 + index * 0.09,
                      duration: 0.5,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => selectRole(role)}
                      className={cn(
                        "group flex h-full w-full flex-col items-start rounded-2xl border border-white/[0.1] bg-white/[0.045] p-5 text-left backdrop-blur-md transition-all duration-300",
                        "hover:-translate-y-1 hover:bg-white/[0.08]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071426]",
                        "sm:min-h-[15.5rem] sm:p-6",
                        accentBorder,
                        accentGlow
                      )}
                    >
                      <div
                        className={cn(
                          "mb-5 flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:scale-105 sm:h-14 sm:w-14",
                          iconBg
                        )}
                      >
                        <Icon className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden />
                      </div>
                      <h2 className="font-heading text-lg font-bold tracking-wide text-white sm:text-xl">
                        {t(`roles.${role}`)}
                      </h2>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-white/55">
                        {t(`descriptions.${role}`)}
                      </p>
                      <span className="mt-5 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold/75 transition-colors duration-300 group-hover:text-gold">
                        {t("cta")}
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                    </button>
                  </motion.div>
                )
              )}
            </div>

            <motion.p
              className="mt-10 text-center sm:mt-12"
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                delay: prefersReducedMotion ? 0 : 0.45,
                duration: 0.4,
              }}
            >
              <button
                type="button"
                onClick={() => selectRole("admin")}
                className="text-[11px] tracking-wide text-white/30 transition-colors hover:text-white/55"
              >
                {t("staffAccess")}
              </button>
            </motion.p>
          </>
        ) : (
          <motion.form
            onSubmit={handleSubmit}
            className="mx-auto w-full max-w-md rounded-2xl border border-white/[0.1] bg-white/[0.05] p-6 backdrop-blur-md sm:p-8"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              onClick={backToRoles}
              className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-gold"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("back")}
            </button>

            {canRegister ? (
              <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-black/25 p-1">
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors",
                    mode === "login"
                      ? "bg-gold text-navy"
                      : "text-white/55 hover:text-white"
                  )}
                >
                  {t("tabLogin")}
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors",
                    mode === "register"
                      ? "bg-gold text-navy"
                      : "text-white/55 hover:text-white"
                  )}
                >
                  {t("tabRegister")}
                </button>
              </div>
            ) : null}

            {mode === "register" && canRegister ? (
              <label className="mb-4 block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
                  {t("name")}
                </span>
                <input
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </label>
            ) : null}

            <label className="mb-4 block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
                {t("email")}
              </span>
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="mb-4 block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
                {t("password")}
              </span>
              <input
                type="password"
                autoComplete={
                  mode === "register" ? "new-password" : "current-password"
                }
                required
                minLength={mode === "register" ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </label>

            {mode === "register" && canRegister ? (
              <label className="mb-5 block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
                  {t("confirmPassword")}
                </span>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                />
              </label>
            ) : (
              <div className="mb-2" />
            )}

            {error ? (
              <p
                className="mb-4 rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-200"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            {success ? (
              <p
                className="mb-4 rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-200"
                role="status"
              >
                {success}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 flex w-full min-h-12 items-center justify-center rounded-xl bg-gold px-4 text-sm font-bold uppercase tracking-[0.12em] text-navy transition-[opacity,transform] hover:opacity-95 active:scale-[0.99] disabled:opacity-60"
            >
              {submitting
                ? mode === "register"
                  ? t("registering")
                  : t("submitting")
                : mode === "register"
                  ? t("registerSubmit")
                  : t("submit")}
            </button>

            {isStaff ? (
              <p className="mt-5 text-center text-xs leading-relaxed text-white/35">
                {t("staffHint")}
              </p>
            ) : null}
          </motion.form>
        )}
      </div>
    </section>
  );
}
