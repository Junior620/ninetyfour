"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { contactSchema, type ContactFormData } from "@/lib/validations/schemas";
import {
  FormSubmissionResult,
  FormSubmitLabel,
  type FormSubmissionStatus,
} from "@/components/forms/FormSubmissionResult";

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `k-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

type ResultState = {
  status: FormSubmissionStatus;
  reference?: string;
  maskedEmail?: string;
  emailSent?: boolean;
};

export function ContactForm() {
  const t = useTranslations("form");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const prefersReducedMotion = useReducedMotion();
  const idempotencyKey = useRef(createIdempotencyKey());
  const [result, setResult] = useState<ResultState | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      locale: locale === "en" ? "en" : "fr",
      website: "",
    },
  });

  async function onSubmit(data: ContactFormData) {
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          locale: locale === "en" ? "en" : "fr",
          website: data.website || "",
          idempotencyKey: idempotencyKey.current,
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        reference?: string;
        maskedEmail?: string;
        emailSent?: boolean;
        error?: string;
      };

      if (!res.ok || !json.success) {
        setResult({ status: "error" });
        return;
      }

      const emailSent = Boolean(json.emailSent);
      setResult({
        status: emailSent ? "success" : "received",
        reference: json.reference,
        maskedEmail: json.maskedEmail,
        emailSent,
      });
    } catch {
      setResult({ status: "error" });
    }
  }

  function handleReset() {
    idempotencyKey.current = createIdempotencyKey();
    reset({
      name: "",
      email: "",
      subject: "",
      message: "",
      website: "",
      locale: locale === "en" ? "en" : "fr",
    });
    setResult(null);
  }

  return (
    <AnimatePresence mode="wait">
      {result ? (
        <motion.div
          key="result"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
        >
          <FormSubmissionResult
            status={result.status}
            reference={result.reference}
            maskedEmail={result.maskedEmail}
            emailSent={result.emailSent}
            allowReset={result.status !== "error"}
            onReset={handleReset}
          />
        </motion.div>
      ) : (
        <motion.form
          key="form"
          onSubmit={handleSubmit(onSubmit)}
          className="relative space-y-5"
          initial={false}
          exit={
            prefersReducedMotion
              ? undefined
              : { opacity: 0, y: -8, transition: { duration: 0.25 } }
          }
        >
          <div
            className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden"
            aria-hidden
          >
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              tabIndex={-1}
              autoComplete="off"
              {...register("website")}
            />
          </div>
          <div>
            <Label htmlFor="name">{t("name")}</Label>
            <Input
              id="name"
              {...register("name")}
              className="mt-1"
              maxLength={120}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              className="mt-1"
              maxLength={200}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="subject">{t("subject")}</Label>
            <Input
              id="subject"
              {...register("subject")}
              className="mt-1"
              maxLength={200}
              disabled={isSubmitting}
            />
            {errors.subject && (
              <p className="mt-1 text-xs text-destructive">
                {errors.subject.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="message">{t("message")}</Label>
            <Textarea
              id="message"
              {...register("message")}
              className="mt-1"
              rows={5}
              maxLength={5000}
              disabled={isSubmitting}
            />
            {errors.message && (
              <p className="mt-1 text-xs text-destructive">
                {errors.message.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="min-h-11 w-full bg-gold text-navy hover:bg-gold/90 sm:w-auto"
          >
            <FormSubmitLabel
              loading={isSubmitting}
              idleLabel={tCommon("submit")}
            />
          </Button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
