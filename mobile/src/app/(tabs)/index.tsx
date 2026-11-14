import { router } from "expo-router";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { displayScore } from "@matchlab/scoring";
import { canWrite, useLab } from "@/lib/lab";
import { Crest, Wordmark } from "@/ui/brand";
import { formatDate, t } from "@/lib/labels";
import { past, preparation, scoreLine, teamScore, upcoming } from "@/lib/matches";
import { Badge, Body, Button, Card, ErrorState, H2, Label, Loading, Notice, Row, SyncBadge } from "@/ui/kit";
import { space, usePalette } from "@/ui/theme";

export default function Home() {
  const c = usePalette();
  const lab = useLab();
  if (!lab.data) return lab.error ? <ErrorState message={(lab.error as Error).message} retry={() => lab.refetch()} /> : <Loading />;
  const { graph, member, alerts } = lab.data;
  const next = upcoming(graph)[0];
  const prep = next ? preparation(graph, next) : null;
  const unread = alerts.filter((a) => !a.ml_alert_reads.some((r) => r.user_id === member.user_id));
  const reports = past(graph).filter((m) => graph.evaluations.some((e) => e.match_id === m.id)).slice(0, 3);
  const writer = canWrite(lab.data);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: space.l, gap: space.l, paddingBottom: space.xxl * 2 }}
        refreshControl={<RefreshControl refreshing={lab.isRefetching} onRefresh={() => void lab.refetch()} />}
      >
        <Row>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: space.s }}>
            <Crest size={34} />
            <Wordmark height={16} />
          </View>
          <SyncBadge onPress={() => router.push("/sync")} />
        </Row>
        <Text style={{ fontSize: 30, fontWeight: "800", color: c.textStrong }}>Bonjour, Staff</Text>
        {lab.error ? <Notice text={`${(lab.error as Error).message} Données affichées : dernière synchronisation.`} /> : null}

        <Card tone="accent">
          <Text style={{ color: c.gold, fontWeight: "800", letterSpacing: 1.5, fontSize: 13 }}>PROCHAIN MATCH</Text>
          {next ? (
            <>
              <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800" }}>
                {next.category_id} · {next.opponent}
              </Text>
              <Text style={{ color: "#c5dbf1", fontSize: 16 }}>
                {formatDate(next.played_on)}
                {next.venue ? ` · ${next.venue}` : ""}
                {" · "}
                {prep!.done === prep!.total ? "Préparation complète" : `Préparation à compléter (${prep!.done}/${prep!.total})`}
              </Text>
              <Row>
                <Button kind="secondary" title="Ouvrir" onPress={() => router.push({ pathname: "/match/[id]", params: { id: next.id } })} />
                {writer && prep!.done < prep!.total ? (
                  <Button title="Continuer la préparation" onPress={() => router.push({ pathname: "/match/prepare", params: { id: next.id } })} />
                ) : null}
              </Row>
            </>
          ) : (
            <Text style={{ color: "#c5dbf1", fontSize: 16 }}>Aucun match à venir dans votre périmètre.</Text>
          )}
        </Card>

        {writer ? (
          <View style={{ gap: space.s }}>
            <Row>
              <View style={{ flex: 1 }}>
                <Button title="Créer un match" onPress={() => router.push("/match/prepare")} />
              </View>
              <View style={{ flex: 1 }}>
                <Button kind="secondary" title="Effectif" onPress={() => router.push("/effectif")} />
              </View>
            </Row>
            <Row>
              <View style={{ flex: 1 }}>
                <Button kind="secondary" title={t.players.add} onPress={() => router.push("/player/new")} />
              </View>
              <View style={{ flex: 1 }}>
                <Button kind="secondary" title="Terrain tactique" onPress={() => router.push("/terrain")} />
              </View>
            </Row>
          </View>
        ) : (
          <Notice tone="info" text="Compte lecteur : consultation des matchs et joueurs partagés avec vous, sans modification." />
        )}

        <H2>À faire</H2>
        {unread.length ? (
          unread.slice(0, 5).map((a) => {
            const m = graph.matches.find((x) => x.id === a.match_id);
            return (
              <Card key={a.id} onPress={m ? () => router.push({ pathname: "/match/[id]", params: { id: m.id } }) : undefined}>
                <Row>
                  <Badge text="Alerte" tone="warning" />
                  <Body>{m ? `${m.category_id} · ${m.opponent} — ${m.home_score === null ? "score à saisir" : "à revoir"}` : "Match hors périmètre"}</Body>
                </Row>
              </Card>
            );
          })
        ) : (
          <Body muted>Rien en attente.</Body>
        )}

        <H2>Derniers rapports</H2>
        {reports.length ? (
          reports.map((m) => (
            <Card key={m.id} onPress={() => router.push({ pathname: "/report/[id]", params: { id: m.id } })}>
              <Label>{`${formatDate(m.played_on)} · ${m.category_id}`}</Label>
              <Body>{scoreLine(m) ?? `N91 – ${m.opponent} (score à saisir)`}</Body>
              <Body muted>Note collective : {displayScore(teamScore(m))} / 10</Body>
            </Card>
          ))
        ) : (
          <Body muted>Aucun match évalué pour l’instant.</Body>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
