"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  evaluationSchema,
  type EvaluationFormData,
} from "@/lib/validations/schemas";
import { useState } from "react";

interface EvaluationFormProps {
  playerId?: string;
}

export function EvaluationForm({ playerId = "p1" }: EvaluationFormProps) {
  const tCommon = useTranslations("common");
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EvaluationFormData>({
    resolver: zodResolver(evaluationSchema),
    defaultValues: { playerId },
  });

  function onSubmit(_data: EvaluationFormData) {
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  }

  return (
    <Card className="border-0 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-bold">
          {tCommon("submit")} — Evaluation
        </CardTitle>
      </CardHeader>
      <CardContent>
        {submitted ? (
          <p className="text-royal">{tCommon("success")}</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register("playerId")} />
            <div className="grid gap-4 sm:grid-cols-2">
              {(["technical", "tactical", "physical", "mental"] as const).map(
                (field) => (
                  <div key={field}>
                    <Label htmlFor={field} className="capitalize">
                      {field}
                    </Label>
                    <Input
                      id={field}
                      type="number"
                      min={0}
                      max={100}
                      {...register(field, { valueAsNumber: true })}
                      className="mt-1"
                    />
                    {errors[field] && (
                      <p className="mt-1 text-xs text-destructive">
                        {errors[field]?.message}
                      </p>
                    )}
                  </div>
                )
              )}
            </div>
            <div>
              <Label htmlFor="comment">Comment</Label>
              <Textarea id="comment" {...register("comment")} className="mt-1" rows={3} />
              {errors.comment && (
                <p className="mt-1 text-xs text-destructive">{errors.comment.message}</p>
              )}
            </div>
            <Button type="submit" disabled={isSubmitting} className="bg-gold text-navy hover:bg-gold/90">
              {tCommon("submit")}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
