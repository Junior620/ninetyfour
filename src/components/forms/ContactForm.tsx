"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { contactSchema, type ContactFormData } from "@/lib/validations/schemas";
import { useState } from "react";

export function ContactForm() {
  const t = useTranslations("form");
  const tCommon = useTranslations("common");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  async function onSubmit(data: ContactFormData) {
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
    } catch {
      setError(tCommon("error"));
    }
  }

  if (submitted) {
    return (
      <Card className="border-0 bg-white shadow-sm">
        <CardContent className="p-8 text-center">
          <p className="text-lg font-medium text-royal">{tCommon("success")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <Label htmlFor="name">{t("name")}</Label>
        <Input id="name" {...register("name")} className="mt-1" />
        {errors.name && (
          <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" type="email" {...register("email")} className="mt-1" />
        {errors.email && (
          <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="subject">{t("subject")}</Label>
        <Input id="subject" {...register("subject")} className="mt-1" />
        {errors.subject && (
          <p className="mt-1 text-xs text-destructive">{errors.subject.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="message">{t("message")}</Label>
        <Textarea id="message" {...register("message")} className="mt-1" rows={5} />
        {errors.message && (
          <p className="mt-1 text-xs text-destructive">{errors.message.message}</p>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gold text-navy hover:bg-gold/90 sm:w-auto"
      >
        {isSubmitting ? tCommon("loading") : tCommon("submit")}
      </Button>
    </form>
  );
}
