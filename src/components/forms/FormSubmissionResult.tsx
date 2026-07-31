"use client";

import { useEffect, useId, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FormSubmissionStatus = "success" | "received" | "error";

export type FormSubmissionResultProps = {
  status: FormSubmissionStatus;
  reference?: string | null;
  maskedEmail?: string | null;
  emailSent?: boolean;
  /** Show "submit another request" */
  allowReset?: boolean;
  onReset?: () => void;
  /** Extra content (e.g. PDF download link) */
  children?: React.ReactNode;
  className?: string;
};

function GoldParticles({ reduced }: { reduced: boolean }) {
  if (reduced) return null;
  const dots = [
    { x: -28, y: -18, delay: 0.15 },
    { x: 32, y: -22, delay: 0.22 },
    { x: -18, y: 26, delay: 0.28 },
    { x: 24, y: 20, delay: 0.18 },
    { x: 0, y: -34, delay: 0.32 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {dots.map((d, i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-gold"
          initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
          animate={{
            opacity: [0, 0.9, 0],
            x: d.x,
            y: d.y,
            scale: [0.4, 1, 0.2],
          }}
          transition={{
            duration: 0.85,
            delay: d.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

function SuccessIcon({ reduced }: { reduced: boolean }) {
  return (
    <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
      {!reduced ? (
        <motion.div
          className="absolute inset-0 rounded-full bg-gold/25 blur-md"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: [0, 0.7, 0.35], scale: [0.6, 1.15, 1] }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          aria-hidden
        />
      ) : (
        <div
          className="absolute inset-0 rounded-full bg-gold/20 blur-md"
          aria-hidden
        />
      )}
      <GoldParticles reduced={reduced} />
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-gold/40 bg-cream shadow-[0_8px_24px_rgba(7,20,38,0.08)]">
        <svg
          viewBox="0 0 48 48"
          className="h-9 w-9"
          fill="none"
          aria-hidden
        >
          <motion.circle
            cx="24"
            cy="24"
            r="20"
            stroke="#C99A2E"
            strokeWidth="2"
            strokeLinecap="round"
            initial={reduced ? false : { pathLength: 0, opacity: 0.4 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: reduced ? 0 : 0.55, ease: "easeInOut" }}
          />
          <motion.path
            d="M14 24.5 L21 31.5 L34 17"
            stroke="#071426"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduced ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: reduced ? 0 : 0.45,
              delay: reduced ? 0 : 0.35,
              ease: "easeOut",
            }}
          />
        </svg>
      </div>
    </div>
  );
}

export function FormSubmissionResult({
  status,
  reference,
  maskedEmail,
  emailSent = false,
  allowReset = false,
  onReset,
  children,
  className,
}: FormSubmissionResultProps) {
  const t = useTranslations("forms.result");
  const prefersReducedMotion = useReducedMotion();
  const reduced = !!prefersReducedMotion;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();

  useEffect(() => {
    headingRef.current?.focus();
  }, [status]);

  const isError = status === "error";
  const isReceivedOnly = status === "received";

  const stagger = reduced
    ? { delayChildren: 0, staggerChildren: 0 }
    : { delayChildren: 0.18, staggerChildren: 0.08 };

  const item = {
    hidden: reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0 : 0.35, ease: "easeOut" as const },
    },
  };

  if (isError) {
    return (
      <div
        role="alert"
        className={cn(
          "rounded-2xl border border-red-200/80 bg-white p-8 text-center shadow-sm sm:p-10",
          className
        )}
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertCircle className="h-7 w-7" aria-hidden />
        </div>
        <h2
          ref={headingRef}
          id={titleId}
          tabIndex={-1}
          className="font-heading text-xl font-bold text-navy outline-none sm:text-2xl"
        >
          {t("errorTitle")}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-text-muted sm:text-base">
          {t("errorBody")}
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
          {onReset ? (
            <button
              type="button"
              onClick={onReset}
              className={cn(
                buttonVariants(),
                "min-h-11 bg-gold text-navy hover:bg-gold/90"
              )}
            >
              {t("retry")}
            </button>
          ) : null}
          <Link
            href="/contact"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "min-h-11 border-navy/20 text-navy"
            )}
          >
            {t("contactOther")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-labelledby={titleId}
      className={cn(
        "rounded-2xl border border-[#E5E2D9] bg-white p-8 text-center shadow-[0_12px_40px_rgba(7,20,38,0.06)] sm:p-10",
        className
      )}
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.4, ease: "easeOut" }}
    >
      <SuccessIcon reduced={reduced} />

      <motion.div
        variants={{ show: { transition: stagger } }}
        initial="hidden"
        animate="show"
      >
        <motion.h2
          ref={headingRef}
          id={titleId}
          tabIndex={-1}
          variants={item}
          className="font-heading text-xl font-bold text-navy outline-none sm:text-2xl"
        >
          {isReceivedOnly ? t("receivedTitle") : t("successTitle")}
        </motion.h2>

        <motion.p
          variants={item}
          className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-text-muted sm:text-base"
        >
          {isReceivedOnly ? t("receivedBody") : t("successBody")}
        </motion.p>

        {emailSent && maskedEmail ? (
          <motion.p
            variants={item}
            className="mx-auto mt-3 max-w-md text-sm font-medium text-navy"
          >
            {t("emailSent", { email: maskedEmail })}
          </motion.p>
        ) : null}

        {!emailSent && isReceivedOnly ? (
          <motion.p
            variants={item}
            className="mx-auto mt-3 max-w-md text-sm text-text-muted"
          >
            {t("emailFailed")}
          </motion.p>
        ) : null}

        {reference ? (
          <motion.p
            variants={item}
            className="mt-4 text-sm font-semibold text-navy"
          >
            {t("reference")}{" "}
            <span className="font-mono text-royal">{reference}</span>
          </motion.p>
        ) : null}

        <motion.p
          variants={item}
          className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-text-muted"
        >
          {t("followUp")}
        </motion.p>

        {emailSent ? (
          <motion.p
            variants={item}
            className="mt-2 text-xs text-text-muted"
          >
            {t("spamHint")}
          </motion.p>
        ) : null}

        {children ? (
          <motion.div variants={item} className="mt-6">
            {children}
          </motion.div>
        ) : null}

        <motion.div
          variants={item}
          className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center"
        >
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "min-h-11 border-navy/20 text-navy"
            )}
          >
            {t("home")}
          </Link>
          <Link
            href="/academie"
            className={cn(
              buttonVariants(),
              "min-h-11 bg-gold text-navy hover:bg-gold/90"
            )}
          >
            {t("academy")}
          </Link>
          {allowReset && onReset ? (
            <button
              type="button"
              onClick={onReset}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "min-h-11 text-navy"
              )}
            >
              {t("newRequest")}
            </button>
          ) : null}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/** Submit button label helper for loading state */
export function FormSubmitLabel({
  loading,
  idleLabel,
}: {
  loading: boolean;
  idleLabel: string;
}) {
  const t = useTranslations("forms.result");
  if (!loading) return <>{idleLabel}</>;
  return (
    <span className="inline-flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      {t("sending")}
    </span>
  );
}
