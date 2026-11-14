import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Match } from "@matchlab/schema";
import { canWrite, useLab, type LabData } from "@/lib/lab";
import { formatDate, matchStatusLabels, t } from "@/lib/labels";
import { past, preparation, scoreLine, upcoming } from "@/lib/matches";
import { Badge, Body, Button, Card, Choice, H1, LabGate, Label, Row, SyncBadge } from "@/ui/kit";
import { space, usePalette } from "@/ui/theme";

export default function Matchs() {
  const c = usePalette();
  const lab = useLab();
  const [view, setView] = useState<"next" | "past">("next");
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: c.bg }}>
      <LabGate query={lab}>
        {(data) => {
          const list = view === "next" ? upcoming(data.graph) : past(data.graph);
          return (
            <ScrollView contentContainerStyle={{ padding: space.l, gap: space.m, paddingBottom: space.xxl * 2 }}>
              <Row>
                <View style={{ flex: 1 }}><H1>Matchs</H1></View>
                <SyncBadge onPress={() => router.push("/sync")} />
              </Row>
              {canWrite(data) ? <Button title={`＋ ${t.match.new}`} onPress={() => router.push("/match/prepare")} /> : null}
              <Choice options={[{ value: "next" as const, label: "À venir" }, { value: "past" as const, label: "Historique" }]} value={view} onChange={setView} />
              {list.length ? list.map((m) => <MatchCard key={m.id} data={data} match={m} />) : <Body muted>{view === "next" ? "Aucun match programmé." : "Aucun match joué."}</Body>}
            </ScrollView>
          );
        }}
      </LabGate>
    </SafeAreaView>
  );
}

function MatchCard({ data, match }: { data: LabData; match: Match }) {
  const prep = preparation(data.graph, match);
  const evaluated = data.graph.evaluations.filter((e) => e.match_id === match.id).length;
  return (
    <Card onPress={() => router.push({ pathname: "/match/[id]", params: { id: match.id } })}>
      <Label>{`${formatDate(match.played_on)} · ${match.category_id}${match.competition ? ` · ${match.competition}` : ""}`}</Label>
      <Body style={{ fontSize: 18, fontWeight: "700" }}>{scoreLine(match) ?? `N91 – ${match.opponent}`}</Body>
      <Row>
        <Badge text={matchStatusLabels[match.status]} tone={match.status === "draft" ? "neutral" : "success"} />
        {match.played_on >= new Date().toISOString().slice(0, 10) ? (
          <Badge text={`Préparation ${prep.done}/${prep.total}`} tone={prep.done === prep.total ? "success" : "warning"} />
        ) : (
          <Badge text={`${evaluated} évaluation(s)`} tone={evaluated ? "success" : "warning"} />
        )}
      </Row>
    </Card>
  );
}
