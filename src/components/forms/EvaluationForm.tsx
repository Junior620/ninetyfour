"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import {
  evaluationSchema,
  type EvaluationFormData,
} from "@/lib/validations/schemas";
import { mockPlayers } from "@/lib/data";
import { cn } from "@/lib/utils";

interface EvaluationFormProps {
  playerId?: string;
  onPublished?: () => void;
}

function ratingLabel(value: number, t: (k: string) => string) {
  if (value < 50) return t("ratingWeak");
  if (value < 65) return t("ratingImprove");
  if (value < 75) return t("ratingOk");
  if (value < 85) return t("ratingGood");
  return t("ratingExcellent");
}

function ScoreField({
  name,
  label,
  value,
  onChange,
  t,
}: {
  name: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  t: (k: string) => string;
}) {
  return (
    <div className="rounded-xl border border-[#E5E2D9] bg-[#F7F6F2] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <Label htmlFor={name}>{label}</Label>
        <span className="text-sm font-bold text-navy">
          {value}/100 · {ratingLabel(value, t)}
        </span>
      </div>
      <input
        id={name}
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-royal"
      />
      <Input
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-9 bg-white"
      />
    </div>
  );
}

export function EvaluationForm({
  playerId = "p1",
  onPublished,
}: EvaluationFormProps) {
  const t = useTranslations("dashboard.coach");
  const locale = useLocale();
  const [scores, setScores] = useState({
    technical: 78,
    tactical: 82,
    physical: 75,
    mental: 80,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<EvaluationFormData>({
    resolver: zodResolver(evaluationSchema),
    defaultValues: {
      playerId,
      date: new Date().toISOString().slice(0, 10),
      evalType: "monthly",
      session: "",
      evaluator: "Coach Martin",
      technical: 78,
      tactical: 82,
      physical: 75,
      mental: 80,
      positives: "",
      axes: "",
      nextObjective: "",
      commentInternal: "",
      commentVisible: "",
    },
  });

  const selectedId = watch("playerId");

  useEffect(() => {
    setValue("playerId", playerId);
  }, [playerId, setValue]);

  useEffect(() => {
    setValue("technical", scores.technical);
    setValue("tactical", scores.tactical);
    setValue("physical", scores.physical);
    setValue("mental", scores.mental);
  }, [scores, setValue]);

  const selectedPlayer = useMemo(
    () => mockPlayers.find((p) => p.id === selectedId) ?? mockPlayers[0],
    [selectedId]
  );

  function save(mode: "draft" | "publish") {
    return handleSubmit(() => {
      toast(
        mode === "draft"
          ? locale === "fr"
            ? "Brouillon enregistré (démo)"
            : "Draft saved (demo)"
          : t("toast")
      );
      onPublished?.();
    })();
  }

  return (
    <div className="rounded-2xl border border-[#E5E2D9] bg-white p-5 shadow-[0_8px_24px_rgba(7,20,38,0.04)]">
      <h2 className="text-lg font-bold text-navy">{t("newEvaluation")}</h2>
      <p className="mt-1 text-xs text-text-muted">{t("scaleHint")}</p>

      <form className="mt-5 space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>{t("playerConcerned")}</Label>
            <select
              {...register("playerId")}
              className="mt-1 h-10 w-full rounded-xl border border-[#E5E2D9] bg-[#F7F6F2] px-3 text-sm"
            >
              {mockPlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-text-muted">
              {selectedPlayer.firstName} {selectedPlayer.lastName}
            </p>
          </div>
          <div>
            <Label htmlFor="date">{t("evalDate")}</Label>
            <Input id="date" type="date" className="mt-1" {...register("date")} />
          </div>
          <div>
            <Label>{t("evalType")}</Label>
            <select
              {...register("evalType")}
              className="mt-1 h-10 w-full rounded-xl border border-[#E5E2D9] bg-[#F7F6F2] px-3 text-sm"
            >
              <option value="monthly">{t("typeMonthly")}</option>
              <option value="quarterly">{t("typeQuarterly")}</option>
              <option value="match">{t("typeMatch")}</option>
            </select>
          </div>
          <div>
            <Label htmlFor="session">{t("sessionOrComp")}</Label>
            <Input id="session" className="mt-1" {...register("session")} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="evaluator">{t("evaluator")}</Label>
            <Input id="evaluator" className="mt-1" {...register("evaluator")} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["technical", t("technical")],
              ["tactical", t("tactical")],
              ["physical", t("physical")],
              ["mental", t("mental")],
            ] as const
          ).map(([key, label]) => (
            <ScoreField
              key={key}
              name={key}
              label={label}
              value={scores[key]}
              onChange={(v) =>
                setScores((s) => ({ ...s, [key]: Math.min(100, Math.max(0, v)) }))
              }
              t={t}
            />
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="positives">{t("positives")}</Label>
            <Textarea id="positives" rows={2} className="mt-1" {...register("positives")} />
          </div>
          <div>
            <Label htmlFor="axes">{t("axes")}</Label>
            <Textarea id="axes" rows={2} className="mt-1" {...register("axes")} />
          </div>
          <div>
            <Label htmlFor="nextObjective">{t("nextObjective")}</Label>
            <Textarea
              id="nextObjective"
              rows={2}
              className="mt-1"
              {...register("nextObjective")}
            />
          </div>
          <div>
            <Label htmlFor="commentInternal">{t("commentInternal")}</Label>
            <Textarea
              id="commentInternal"
              rows={2}
              className="mt-1"
              {...register("commentInternal")}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="commentVisible">{t("commentVisible")}</Label>
          <Textarea
            id="commentVisible"
            rows={3}
            className="mt-1"
            {...register("commentVisible")}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={isSubmitting}
            variant="outline"
            onClick={() => save("draft")}
            className={cn("border-[#E5E2D9]")}
          >
            {t("saveDraft")}
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={() => save("publish")}
            className="bg-gold text-navy hover:bg-gold/90"
          >
            {t("publish")}
          </Button>
        </div>
      </form>
    </div>
  );
}
