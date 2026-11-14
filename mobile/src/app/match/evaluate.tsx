import { randomUUID } from "expo-crypto";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { answerHighlights, commonQuestions, POSITIONS, specificQuestions, type Position, type Question } from "@matchlab/questionnaire";
import { displayScore, individualScore, type Answers } from "@matchlab/scoring";
import type { Evaluation, Match, Player } from "@matchlab/schema";
import { ApiError } from "@/lib/api";
import { useLab } from "@/lib/lab";
import { positionShortOptions, positionName } from "@/lib/labels";
import { editable, save } from "@/lib/outbox";
import { Body, Button, Card, Choice, Field, H2, LabGate, Label, Notice, Row, Screen } from "@/ui/kit";
import { radius, usePalette } from "@/ui/theme";

export default function Evaluate() {
  const params = useLocalSearchParams<{ match: string; player: string; position?: string }>();
  const lab = useLab();
  return (
    <LabGate query={lab}>
      {(data) => {
        const match = data.graph.matches.find((m) => m.id === params.match);
        const player = data.graph.players.find((p) => p.id === params.player);
        if (!match || !player) return <Screen><Notice text="Match ou joueur hors de votre périmètre." /></Screen>;
        const start = (POSITIONS as readonly string[]).includes(params.position ?? "") ? (params.position as Position) : player.usual_position;
        return <Form match={match} player={player} evaluations={data.graph.evaluations} initialPosition={start} />;
      }}
    </LabGate>
  );
}

function Form({ match, player, evaluations, initialPosition }: { match: Match; player: Player; evaluations: Evaluation[]; initialPosition: Position }) {
  const find = (p: Position) => evaluations.find((e) => e.match_id === match.id && e.player_id === player.id && e.position === p);
  const [position, setPosition] = useState<Position>(find(initialPosition) ? initialPosition : (evaluations.find((e) => e.match_id === match.id && e.player_id === player.id)?.position ?? initialPosition));
  const existing = find(position);
  const [common, setCommon] = useState<Answers>(existing?.common ?? {});
  const [specific, setSpecific] = useState<Answers>(existing?.specific ?? {});
  const [minutes, setMinutes] = useState(existing?.minutes != null ? String(existing.minutes) : "");
  const [observation, setObservation] = useState(existing?.observation ?? "");
  const [priorities, setPriorities] = useState(existing?.priorities ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const score = individualScore(common, specific);
  const highlights = answerHighlights(position, common, specific);

  function changePosition(p: Position) {
    const other = find(p);
    setPosition(p);
    setSpecific(other?.specific ?? {});
    if (other) {
      setCommon(other.common);
      setMinutes(other.minutes != null ? String(other.minutes) : "");
      setObservation(other.observation);
      setPriorities(other.priorities);
    }
  }
  async function submit() {
    setBusy(true);
    setError("");
    try {
      const m = minutes === "" ? null : Math.min(150, Number(minutes));
      await save({
        label: `Évaluation : ${player.full_name} (${position})`,
        kind: "evaluations",
        version: existing?.version ?? 0,
        payload: {
          ...(existing ? editable("evaluations", existing) : {}),
          id: existing?.id ?? randomUUID(),
          match_id: match.id,
          player_id: player.id,
          position,
          questionnaire_version: "pdf-1.1",
          common,
          specific,
          observation: observation.trim(),
          priorities: priorities.trim(),
          minutes: m,
        },
      });
      router.back();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Évaluation non enregistrée.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <H2>{`${player.full_name} · N91 – ${match.opponent}`}</H2>
      <Choice wrap={false} label="Poste observé" options={positionShortOptions} value={position} onChange={changePosition} />
      <Card tone="gold">
        <Row>
          <Body style={{ flex: 1, fontSize: 18, fontWeight: "800" }}>{`Note : ${displayScore(score)} / 10`}</Body>
          <Body muted>{positionName(position)}</Body>
        </Row>
        <Body muted style={{ fontSize: 13 }}>
          {score === null ? "Non calculable tant qu’un groupe (commun ou poste) n’a aucune réponse notée." : "(moyenne commune × 0,4 + moyenne poste × 0,6) × 2"}
        </Body>
        {highlights.support.length ? <Body>{`Appuis : ${highlights.support.join(", ")}`}</Body> : null}
        {highlights.work.length ? <Body>{`À travailler : ${highlights.work.join(", ")}`}</Body> : null}
      </Card>
      <Card>
        <Label>Questions communes</Label>
        {commonQuestions.map((q) => <QuestionRow key={q.id} q={q} value={common[q.id]} onChange={(v) => setCommon(next(common, q.id, v))} />)}
      </Card>
      <Card>
        <Label>{`Questions du poste · ${positionName(position)}`}</Label>
        {specificQuestions[position].map((q) => <QuestionRow key={q.id} q={q} value={specific[q.id]} onChange={(v) => setSpecific(next(specific, q.id, v))} />)}
      </Card>
      <Card>
        <Field label="Minutes jouées" value={minutes} onChangeText={(v) => setMinutes(v.replace(/[^0-9]/g, "").slice(0, 3))} keyboardType="number-pad" placeholder="Inconnu" />
        <Field label="Observation" value={observation} onChangeText={setObservation} multiline placeholder="Faits observés, avec la minute si possible" />
        <Field label="Priorités de travail" value={priorities} onChangeText={setPriorities} multiline />
      </Card>
      {error ? <Notice tone="danger" text={error} /> : null}
      <Button title={existing ? "Enregistrer les modifications" : "Enregistrer l’évaluation"} onPress={submit} busy={busy} />
    </Screen>
  );
}

/** undefined = not answered (omitted), null = "Non observé". Tapping the chosen answer clears it. */
function next(answers: Answers, id: string, value: number | null | undefined): Answers {
  const copy = { ...answers };
  if (value === undefined) delete copy[id];
  else copy[id] = value;
  return copy;
}

function QuestionRow({ q, value, onChange }: { q: Question; value: number | null | undefined; onChange: (v: number | null | undefined) => void }) {
  const c = usePalette();
  const options: { v: number | null; label: string }[] = [1, 2, 3, 4, 5].map((v) => ({ v, label: String(v) }));
  options.push({ v: null, label: "N.O." });
  return (
    <View style={{ gap: 6, paddingVertical: 6 }}>
      <Text style={{ color: c.textStrong, fontWeight: "700", fontSize: 16 }}>{q.label}</Text>
      <Text style={{ color: c.textSecondary, fontSize: 14 }}>{q.text}</Text>
      <View style={{ flexDirection: "row", gap: 6 }} accessibilityRole="radiogroup" accessibilityLabel={q.label}>
        {options.map((o) => {
          const on = value === o.v && value !== undefined;
          return (
            <Pressable
              key={o.label}
              onPress={() => onChange(on ? undefined : o.v)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={o.v === null ? "Non observé" : `${o.v} sur 5`}
              style={{ flex: 1, minHeight: 46, borderRadius: radius.m, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: on ? c.accent : c.border, backgroundColor: on ? c.accent : c.surface }}
            >
              <Text style={{ color: on ? c.onAccent : c.text, fontWeight: "800", fontSize: o.v === null ? 13 : 17 }}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
