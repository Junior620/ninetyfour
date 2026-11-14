import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { describeCircumstances } from "@matchlab/circumstances";
import { FORMATIONS } from "@matchlab/formations";
import { displayScore, individualScore } from "@matchlab/scoring";
import type { Match } from "@matchlab/schema";
import { boardPlayers, toBoard } from "@/lib/boards";
import { canWrite, useLab, type LabData } from "@/lib/lab";
import { formatDateLong, matchStatusLabels } from "@/lib/labels";
import { matchdayLineup, preparation, scoreLine, teamScore } from "@/lib/matches";
import { useSync } from "@/lib/outbox";
import { Avatar, Badge, Body, Button, Card, H1, H2, LabGate, Label, Notice, Row, Screen } from "@/ui/kit";
import { Pitch } from "@/ui/Pitch";
import { space } from "@/ui/theme";

export default function MatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lab = useLab();
  const { jobs } = useSync();
  return (
    <LabGate query={lab}>
      {(data) => {
        const match = data.graph.matches.find((m) => m.id === id);
        if (!match)
          return (
            <Screen>
              {jobs.some((j) => j.payload.id === id) ? (
                <Notice text="Ce match est enregistré sur le téléphone et attend le réseau pour rejoindre MatchLab." />
              ) : (
                <Notice text="Ce match n’est pas (ou plus) dans votre périmètre." />
              )}
            </Screen>
          );
        return <Detail data={data} match={match} />;
      }}
    </LabGate>
  );
}

function Detail({ data, match }: { data: LabData; match: Match }) {
  const prep = preparation(data.graph, match);
  const lineup = matchdayLineup(data.graph, match.id);
  const writer = canWrite(data);
  const players = boardPlayers(data, match.season_id);
  const played = match.played_on <= new Date().toISOString().slice(0, 10);
  const called = lineup ? [...Object.entries(lineup.slots).filter(([, s]) => s.player_id).map(([slot, s]) => ({ id: s.player_id!, position: FORMATIONS[lineup.formation].find((f) => f.id === slot)?.position })), ...lineup.bench.map((id) => ({ id, position: undefined }))] : [];
  const evaluations = data.graph.evaluations.filter((e) => e.match_id === match.id);

  return (
    <Screen>
      <Label>{`${match.category_id}${match.competition ? ` · ${match.competition}` : ""}`}</Label>
      <H1>{scoreLine(match) ?? `N91 – ${match.opponent}`}</H1>
      <Body muted>{formatDateLong(match.played_on)}{match.venue ? ` · ${match.venue}` : ""}</Body>
      <Row>
        <Badge text={matchStatusLabels[match.status]} tone={match.status === "draft" ? "neutral" : "success"} />
        <Badge text={`Préparation ${prep.done}/${prep.total}`} tone={prep.done === prep.total ? "success" : "warning"} />
      </Row>

      {writer ? (
        <Row>
          <View style={{ flex: 1 }}><Button kind={played ? "secondary" : "primary"} title="Préparer" onPress={() => router.push({ pathname: "/match/prepare", params: { id: match.id } })} /></View>
          <View style={{ flex: 1 }}><Button kind={played ? "primary" : "secondary"} title="Fin de match" onPress={() => router.push({ pathname: "/match/result", params: { id: match.id } })} /></View>
        </Row>
      ) : null}
      <Button kind="secondary" title="Voir le rapport" onPress={() => router.push({ pathname: "/report/[id]", params: { id: match.id } })} />

      <Card>
        <H2>Préparation</H2>
        {prep.steps.map((s) => <Body key={s.key}>{`${s.done ? "✓" : "○"} ${s.label}`}</Body>)}
        {describeCircumstances(match.circumstances).map((c) => <Body muted key={c.key}>{`${c.label} : ${c.value}`}</Body>)}
        {match.context ? <Body muted>{match.context}</Body> : null}
      </Card>

      {lineup ? (
        <View style={{ gap: space.m }}>
          <H2>{`Plan de jeu · ${lineup.formation}`}</H2>
          <Pitch board={toBoard(lineup)} players={players} pool={[]} editable={false} />
        </View>
      ) : null}

      <Card>
        <H2>Évaluations individuelles</H2>
        <Body muted>{`${evaluations.length} évaluation(s) · questionnaire officiel 1.1 (40 % commun, 60 % poste).`}</Body>
        {(called.length ? called : evaluations.map((e) => ({ id: e.player_id, position: e.position }))).map(({ id, position }) => {
          const p = players.get(id);
          const done = evaluations.filter((e) => e.player_id === id);
          const score = done[0] ? individualScore(done[0].common, done[0].specific) : null;
          return (
            <Row key={id}>
              <Avatar name={p?.name ?? "?"} mediaId={p?.photo} jersey={p?.jersey} size={38} />
              <Body style={{ flex: 1 }}>{p?.name ?? "Joueur hors périmètre"}</Body>
              {done.length ? <Badge text={displayScore(score)} tone="success" /> : null}
              {writer ? (
                <Button kind={done.length ? "ghost" : "secondary"} title={done.length ? "Modifier" : "Évaluer"} onPress={() => router.push({ pathname: "/match/evaluate", params: { match: match.id, player: id, ...(position ? { position } : {}) } })} />
              ) : null}
            </Row>
          );
        })}
        {!called.length && !evaluations.length ? <Body muted>Aucun joueur convoqué : complétez la préparation.</Body> : null}
      </Card>

      <Card>
        <H2>Collectif</H2>
        <Body>{`Note collective : ${displayScore(teamScore(match))} / 10`}</Body>
        <Body muted>Indépendante des notes individuelles ; les circonstances ne modifient jamais les notes.</Body>
      </Card>
    </Screen>
  );
}
