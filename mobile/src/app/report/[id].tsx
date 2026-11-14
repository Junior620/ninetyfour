import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { describeCircumstances } from "@matchlab/circumstances";
import { answerHighlights, positionNames, type Position } from "@matchlab/questionnaire";
import { displayScore, rankings } from "@matchlab/scoring";
import type { Match } from "@matchlab/schema";
import { ApiError, request } from "@/lib/api";
import { boardPlayers } from "@/lib/boards";
import { canWrite, LAB_KEY, queryClient, useLab, type LabData } from "@/lib/lab";
import { formatDateLong } from "@/lib/labels";
import { called, matchdayLineup, matchScores, scoreLine, teamScore } from "@/lib/matches";
import { Avatar, Badge, Body, Button, Card, H1, H2, LabGate, Label, Notice, Row, Screen } from "@/ui/kit";

export default function ReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lab = useLab();
  return (
    <LabGate query={lab}>
      {(data) => {
        const match = data.graph.matches.find((m) => m.id === id);
        return match ? <Report data={data} match={match} /> : <Screen><Notice text="Match hors de votre périmètre." /></Screen>;
      }}
    </LabGate>
  );
}

/** Simple post-match report (cahier §07, MVP): context, scores, follow-up list, missing data. */
function Report({ data, match }: { data: LabData; match: Match }) {
  const players = boardPlayers(data, match.season_id);
  const scores = matchScores(data.graph, match.id);
  const ranking = rankings(scores.map((s) => s.evaluation));
  const lineup = matchdayLineup(data.graph, match.id);
  const squad = lineup ? [...Object.values(lineup.slots).map((s) => s.player_id).filter((p): p is string => !!p), ...lineup.bench] : [];
  const unevaluated = squad.filter((p) => !scores.some((s) => s.evaluation.player_id === p));
  const scored = scores.filter((s) => s.score !== null);
  const toSupport = scored.filter((s) => s.score! < 5).slice(-3).reverse();
  const revisions = data.graph.reports.filter((r) => r.match_id === match.id).sort((a, b) => b.revision - a.revision);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  async function generate() {
    setBusy(true);
    setMessage(null);
    try {
      await request("/api/matchlab/reports", { json: { match: match.id, version: match.version, correction: "", validate: false } });
      await queryClient.invalidateQueries({ queryKey: LAB_KEY });
      setMessage({ tone: "success", text: "Révision du rapport créée : elle est consultable et exportable sur MatchLab web." });
    } catch (e) {
      setMessage({ tone: "danger", text: e instanceof ApiError ? e.message : "Rapport non créé." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Label>{`${match.category_id} · ${formatDateLong(match.played_on)}`}</Label>
      <H1>{scoreLine(match) ?? `N91 – ${match.opponent} (score à saisir)`}</H1>
      <Body muted>{describeCircumstances(match.circumstances).map((c) => c.value).join(" · ")}</Body>

      <Card tone="gold">
        <Row>
          <Badge text={`Collectif ${displayScore(teamScore(match))} / 10`} tone="gold" />
          <Badge text={`${ranking.playerCount} joueur(s) noté(s)`} tone="neutral" />
          <Badge text={`${called(lineup)} convoqué(s)`} tone="neutral" />
        </Row>
        {!scored.length ? <Body>Données insuffisantes : aucune note individuelle calculable pour ce match.</Body> : null}
      </Card>

      {ranking.best.length ? (
        <Card>
          <H2>Joueur(s) à valoriser</H2>
          {ranking.best.map((b) => {
            const p = players.get(b.player_id);
            const h = answerHighlights(b.position as Position, b.common, b.specific);
            return (
              <Row key={`${b.player_id}${b.position}`}>
                <Avatar name={p?.name ?? "?"} mediaId={p?.photo} jersey={p?.jersey} size={44} />
                <Body style={{ flex: 1 }}>{`${p?.name ?? "Joueur"} · ${displayScore(b.score)} · ${h.support.slice(0, 3).join(", ") || positionNames[b.position as Position]}`}</Body>
              </Row>
            );
          })}
        </Card>
      ) : null}

      {scored.length ? (
        <Card>
          <H2>Notes par joueur</H2>
          {scores.map((s) => (
            <Row key={s.evaluation.id}>
              <Body style={{ flex: 1 }}>{`${s.player?.full_name ?? "Joueur"} · ${s.evaluation.position}`}</Body>
              <Badge text={displayScore(s.score)} tone={s.score === null ? "neutral" : s.score >= 7 ? "success" : s.score < 5 ? "warning" : "neutral"} />
            </Row>
          ))}
          {ranking.positions.filter((p) => p.smallSample).length ? (
            <Body muted style={{ fontSize: 13 }}>Moins de 5 joueurs à un poste : comparaison par poste à lire avec prudence.</Body>
          ) : null}
        </Card>
      ) : null}

      {toSupport.length ? (
        <Card>
          <H2>À accompagner / travailler</H2>
          {toSupport.map((s) => {
            const h = answerHighlights(s.evaluation.position, s.evaluation.common, s.evaluation.specific);
            return <Body key={s.evaluation.id}>{`${s.player?.full_name ?? "Joueur"} · ${h.work.join(", ") || "voir l’observation"}`}</Body>;
          })}
        </Card>
      ) : null}

      {unevaluated.length ? (
        <Card>
          <H2>Informations manquantes</H2>
          {unevaluated.map((p) => (
            <Row key={p}>
              <Body style={{ flex: 1 }}>{players.get(p)?.name ?? "Joueur"}</Body>
              {canWrite(data) ? <Button kind="ghost" title="Évaluer" onPress={() => router.push({ pathname: "/match/evaluate", params: { match: match.id, player: p } })} /> : null}
            </Row>
          ))}
        </Card>
      ) : null}

      <Card>
        <H2>Rapport officiel</H2>
        <Body muted>{revisions.length ? `Révision ${revisions[0].revision} du ${new Date(revisions[0].created_at).toLocaleDateString("fr-FR")}${revisions[0].validated_at ? " · validée" : " · non validée"}` : "Aucune révision enregistrée."}</Body>
        {canWrite(data) ? <Button title={revisions.length ? "Créer une nouvelle révision" : "Créer le rapport"} onPress={generate} busy={busy} disabled={!scores.length} /> : null}
        {message ? <Notice tone={message.tone} text={message.text} /> : null}
        <Body muted style={{ fontSize: 13 }}>Ces notes résument les questionnaires saisis. Elles ne remplacent ni l’analyse vidéo complète ni le jugement du staff.</Body>
      </Card>
    </Screen>
  );
}
