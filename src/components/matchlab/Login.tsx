"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { fr as t, errorMessage } from "@/lib/matchlab/messages";
import { LoginFootballAnimation } from "./LoginFootballAnimation";
export function Login({
  mode = "login",
  next,
}: {
  mode?: "login" | "recover" | "reset";
  next?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  return (
    <main className="ml-auth">
      <div className="ml-auth-story">
        <Link href="/fr" className="ml-auth-brand">
          N91 <span>MatchLab</span>
        </Link>
        <p className="ml-eyebrow">{t.subtitle}</p>
        <h1>{t.auth.title}</h1>
        <p>{t.auth.intro}</p>
        <LoginFootballAnimation />
        <span className="ml-auth-signature">{t.footer}</span>
      </div>
      <section className="ml-auth-form">
        <LockKeyhole size={24} />
        <h2>
          {mode === "login"
            ? t.auth.login
            : mode === "recover"
              ? t.auth.recover
              : t.auth.reset}
        </h2>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError("");
            try {
              const values = Object.fromEntries(
                new FormData(event.currentTarget),
              );
              const response = await fetch(`/api/matchlab/auth/${mode}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...values, next }),
              });
              const result = await response.json();
              if (!response.ok) throw new Error(result.code);
              if (result.next) window.location.assign(result.next);
              else setDone(true);
            } catch (e) {
              setError(
                errorMessage(e instanceof Error ? e.message : "INTERNAL_ERROR"),
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {mode !== "reset" && (
            <label>
              {t.auth.email}
              <input
                name="email"
                type="email"
                required
                autoComplete="username"
              />
            </label>
          )}
          {mode !== "recover" && (
            <label>
              {t.auth.password}
              <input
                name="password"
                type="password"
                required
                minLength={mode === "reset" ? 12 : 1}
                autoComplete={
                  mode === "reset" ? "new-password" : "current-password"
                }
              />
              {mode === "reset" && <small>{t.auth.passwordHint}</small>}
            </label>
          )}
          {error && (
            <p className="ml-error" role="alert">
              {error}
            </p>
          )}
          {done && (
            <p className="ml-success" role="status">
              {t.auth.recovery}
            </p>
          )}
          <button className="ml-button" disabled={busy}>
            {busy
              ? t.saving
              : mode === "login"
                ? t.auth.login
                : mode === "recover"
                  ? t.auth.recover
                  : t.auth.reset}
            <ArrowRight size={17} />
          </button>
        </form>
        <Link href={mode === "login" ? "/matchlab/recover" : "/matchlab/login"}>
          {mode === "login" ? t.auth.forgot : t.auth.loginAgain}
        </Link>
        <Link href="/fr/accueil">{t.backSite}</Link>
      </section>
    </main>
  );
}
