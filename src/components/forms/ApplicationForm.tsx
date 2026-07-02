"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  applicationSchema,
  type ApplicationFormData,
} from "@/lib/validations/schemas";
import { useState } from "react";

export function ApplicationForm() {
  const t = useTranslations("form");
  const tCommon = useTranslations("common");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: { consent: undefined },
  });

  const consent = watch("consent");

  async function onSubmit(data: ApplicationFormData) {
    setError("");
    try {
      const res = await fetch("/api/applications", {
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
    <Card className="border-0 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-black-premium">
          {t("firstName")} & {t("lastName")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="firstName">{t("firstName")}</Label>
              <Input id="firstName" {...register("firstName")} className="mt-1" />
              {errors.firstName && (
                <p className="mt-1 text-xs text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="lastName">{t("lastName")}</Label>
              <Input id="lastName" {...register("lastName")} className="mt-1" />
              {errors.lastName && (
                <p className="mt-1 text-xs text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="birthDate">{t("birthDate")}</Label>
              <Input id="birthDate" type="date" {...register("birthDate")} className="mt-1" />
              {errors.birthDate && (
                <p className="mt-1 text-xs text-destructive">{errors.birthDate.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="city">{t("city")}</Label>
              <Input id="city" {...register("city")} className="mt-1" />
              {errors.city && (
                <p className="mt-1 text-xs text-destructive">{errors.city.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="position">{t("position")}</Label>
              <Input id="position" {...register("position")} className="mt-1" />
              {errors.position && (
                <p className="mt-1 text-xs text-destructive">{errors.position.message}</p>
              )}
            </div>
            <div>
              <Label>{t("strongFoot")}</Label>
              <Select onValueChange={(v) => setValue("strongFoot", v as ApplicationFormData["strongFoot"])}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">{t("leftFoot")}</SelectItem>
                  <SelectItem value="right">{t("rightFoot")}</SelectItem>
                  <SelectItem value="both">{t("bothFeet")}</SelectItem>
                </SelectContent>
              </Select>
              {errors.strongFoot && (
                <p className="mt-1 text-xs text-destructive">{errors.strongFoot.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="currentClub">{t("currentClub")}</Label>
              <Input id="currentClub" {...register("currentClub")} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="schoolLevel">{t("schoolLevel")}</Label>
              <Input id="schoolLevel" {...register("schoolLevel")} className="mt-1" />
              {errors.schoolLevel && (
                <p className="mt-1 text-xs text-destructive">{errors.schoolLevel.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="parentContact">{t("parentContact")}</Label>
              <Input id="parentContact" {...register("parentContact")} className="mt-1" />
              {errors.parentContact && (
                <p className="mt-1 text-xs text-destructive">{errors.parentContact.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="phone">{t("phone")}</Label>
              <Input id="phone" type="tel" {...register("phone")} className="mt-1" />
              {errors.phone && (
                <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" type="email" {...register("email")} className="mt-1" />
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="message">{t("message")}</Label>
            <Textarea id="message" {...register("message")} className="mt-1" rows={4} />
          </div>

          <div>
            <Label htmlFor="videoLink">{t("videoLink")}</Label>
            <Input id="videoLink" {...register("videoLink")} className="mt-1" placeholder="https://" />
            {errors.videoLink && (
              <p className="mt-1 text-xs text-destructive">{errors.videoLink.message}</p>
            )}
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="consent"
              checked={consent === true}
              onCheckedChange={(checked) => setValue("consent", checked === true ? true : undefined as unknown as true)}
            />
            <Label htmlFor="consent" className="text-sm leading-relaxed text-text-muted">
              {t("consent")}
            </Label>
          </div>
          {errors.consent && (
            <p className="text-xs text-destructive">{errors.consent.message}</p>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gold text-navy hover:bg-gold/90 sm:w-auto"
          >
            {isSubmitting ? tCommon("loading") : tCommon("submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
