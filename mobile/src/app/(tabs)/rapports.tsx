import { router } from "expo-router";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { displayScore } from "@matchlab/scoring";
import { useLab } from "@/lib/lab";
import { formatDate } from "@/lib/labels";
import { matchScores, past, scoreLine, teamScore } from "@/lib/matches";
import { Badge, Body, Card, H1, LabGate, Label, Row, SyncBadge } from "@/ui/kit";
import { space, usePalette } from "@/ui/theme";

export default function Rapports() {
  const c = usePalette();
  const lab = useLab();
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: c.bg }}>
      <LabGate query={lab}>
        {(data) => {
          const matches = past(data.graph);
          return (
            <ScrollView contentContainerStyle={{ padding: space.l, gap: space.m, paddingBottom: space.xxl * 2 }}>
              <Row>
                <View style={{ flex: 1 }}><H1>Rapports</H1></View>
                <SyncBadge onPress={() => router.push("/sync")} />
              </Row>
              {matches.length ? (
                matches.map((m) => {
                  const scores = matchScores(data.graph, m.id).filter((s) => s.score !== null);
                  const revisions = data.graph.reports.filter((r) => r.match_id === m.id).length;
                  return (
                    <Card key={m.id} onPress={() => router.push({ pathname: "/report/[id]", params: { id: m.id } })}>
                      <Label>{`${formatDate(m.played_on)} · ${m.category_id}`}</Label>
                      <Body style={{ fontWeight: "700" }}>{scoreLine(m) ?? `N91 – ${m.opponent}`}</Body>
                      <Row>
                        <Badge text={`Collectif ${displayScore(teamScore(m))}`} tone="gold" />
                        <Badge text={`${scores.length} note(s)`} tone={scores.length ? "success" : "warning"} />
                        {revisions ? <Badge text={`${revisions} révision(s)`} tone="neutral" /> : null}
                      </Row>
                    </Card>
                  );
                })
              ) : (
                <Body muted>Aucun match joué pour l’instant.</Body>
              )}
            </ScrollView>
          );
        }}
      </LabGate>
    </SafeAreaView>
  );
}
