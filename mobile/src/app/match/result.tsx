import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { EVENTS } from "@matchlab/circumstances";
import { collectiveQuestions } from "@matchlab/questionnaire";
import { collectiveScore, displayScore, type Answers } from "@matchlab/scoring";
import type { Match } from "@matchlab/schema";
import { ApiError } from "@/lib/api";
import { useLab } from "@/lib/lab";
import { t } from "@/lib/labels";
import { editable, save } from "@/lib/outbox";
import { Body, Button, Card, Choice, Field, H2, LabGate, Label, Notice, Row, Screen } from "@/ui/kit";
import { radius, space, usePalette } from "@/ui/theme";

/** After the final whistle: score, collective questionnaire, what weighed on the game. */
export default function Result() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lab = useLab();
  return (
    <LabGate query={lab}>
      {(data) => {
        const match = data.graph.matches.find((m) => m.id === id);
        return match ? <Form match={match} /> : <Screen><Notice text="Match hors de votre périmètre." /></Screen>;
      }}
    </LabGate>
  );
}

function Form({ match }: { match: Match }) {
  const c = usePalette();
  const [home, setHome] = useState(match.home_score === null ? "" : String(match.home_score));
  const [away, setAway] = useState(match.away_score === null ? "" : String(match.away_score));
  const [collective, setCollective] = useState<Answers>(match.collective ?? {});
  const [scenario, setScenario] = useState(match.circumstances?.scenario);
  const [events, setEvents] = useState<(typeof EVENTS)[number][]>(match.circumstances?.events ?? []);
  const [incidents, setIncidents] = useState(match.circumstances?.incidents ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const scoreField = (v: string) => v.replace(/[^0-9]/g, "").slice(0, 2);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      await save({
        label: `Fin de match : ${match.opponent}`,
        kind: "matches",
        version: match.version,
        payload: {
          ...editable("matches", match),
          home_score: home === "" ? null : Number(home),
          away_score: away === "" ? null : Number(away),
          collective,
          status: match.status === "reviewed" ? "reviewed" : "evaluated",
          circumstances: { ...match.circumstances, scenario, events, incidents: incidents.trim() },
        },
      });
      router.back();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Résultat non enregistré.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Card>
        <H2>Score</H2>
        <Row>
          <View style={{ flex: 1 }}><Field label={t.match.homeScore} value={home} onChangeText={(v) => setHome(scoreField(v))} keyboardType="number-pad" /></View>
          <View style={{ flex: 1 }}><Field label={t.match.awayScore} value={away} onChangeText={(v) => setAway(scoreField(v))} keyboardType="number-pad" /></View>
        </Row>
      </Card>
      <Card>
        <Row>
          <View style={{ flex: 1 }}><H2>Évaluation collective</H2></View>
          <Body style={{ fontWeight: "800" }}>{`${displayScore(collectiveScore(collective))} / 10`}</Body>
        </Row>
        {collectiveQuestions.map((q) => (
          <View key={q.id} style={{ gap: 6 }}>
            <Text style={{ color: c.textStrong, fontWeight: "700", fontSize: 16 }}>{q.label}</Text>
            <Text style={{ color: c.textSecondary }}>{q.text}</Text>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {[1, 2, 3, 4, 5, null].map((v) => {
                const on = q.id in collective && collective[q.id] === v;
                return (
                  <Pressable
                    key={String(v)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={v === null ? "Non observé" : `${v} sur 5`}
                    onPress={() => {
                      const copy = { ...collective };
                      if (on) delete copy[q.id];
                      else copy[q.id] = v;
                      setCollective(copy);
                    }}
                    style={{ flex: 1, minHeight: 46, borderRadius: radius.m, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: on ? c.accent : c.border, backgroundColor: on ? c.accent : c.surface }}
                  >
                    <Text style={{ color: on ? c.onAccent : c.text, fontWeight: "800" }}>{v ?? "N.O."}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </Card>
      <Card>
        <H2>Ce qui a pesé sur le match</H2>
        <Body muted>{t.match.circumstanceHint}</Body>
        <Choice label={t.match.circumstanceKeys.scenario} options={t.match.choices.scenario.map((v) => ({ value: v, label: v }))} value={scenario} onChange={setScenario} />
        <Label>{t.match.circumstanceKeys.events}</Label>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.s }}>
          {EVENTS.map((e) => {
            const on = events.includes(e);
            return (
              <Pressable
                key={e}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                onPress={() => setEvents(on ? events.filter((x) => x !== e) : [...events, e])}
                style={{ minHeight: 44, paddingHorizontal: space.l, borderRadius: radius.pill, borderWidth: 1, justifyContent: "center", borderColor: on ? c.accent : c.border, backgroundColor: on ? c.accent : c.surface }}
              >
                <Text style={{ color: on ? c.onAccent : c.text, fontWeight: "600" }}>{t.match.events[e]}</Text>
              </Pressable>
            );
          })}
        </View>
        <Field label={t.match.circumstanceKeys.incidents} value={incidents} onChangeText={setIncidents} multiline />
      </Card>
      {error ? <Notice tone="danger" text={error} /> : null}
      <Button title="Enregistrer la fin de match" onPress={submit} busy={busy} />
    </Screen>
  );
}
