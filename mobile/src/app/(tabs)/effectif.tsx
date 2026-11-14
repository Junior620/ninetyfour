import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { plain } from "@matchlab/search";
import type { Position } from "@matchlab/questionnaire";
import type { Category } from "@matchlab/trials";
import { canUseMedia, canWrite, currentSeason, useLab } from "@/lib/lab";
import { categoryOptions, photoOf, positionName, positionShortOptions, statusLabels, t } from "@/lib/labels";
import { Avatar, Badge, Body, Button, Choice, H1, LabGate, Row, SyncBadge } from "@/ui/kit";
import { radius, space, touch, usePalette } from "@/ui/theme";

export default function Effectif() {
  const c = usePalette();
  const lab = useLab();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [position, setPosition] = useState<Position | "all">("all");

  const rows = useMemo(() => {
    if (!lab.data) return [];
    const { graph } = lab.data;
    const season = currentSeason(graph.seasons);
    const needle = plain(q.trim());
    return graph.players
      .map((p) => {
        const m =
          graph.memberships.find((x) => x.player_id === p.id && x.season_id === season?.id) ??
          graph.memberships.find((x) => x.player_id === p.id);
        return { player: p, membership: m };
      })
      .filter(({ player, membership }) => {
        if (category !== "all" && membership?.category_id !== category) return false;
        if (position !== "all" && player.usual_position !== position) return false;
        if (!needle) return true;
        return plain(player.full_name).includes(needle) || String(membership?.jersey ?? "") === needle;
      })
      .sort((a, b) => (a.membership?.jersey ?? 100) - (b.membership?.jersey ?? 100));
  }, [lab.data, q, category, position]);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: c.bg }}>
      <LabGate query={lab}>
        {(data) => (
          <FlatList
            data={rows}
            keyExtractor={(r) => r.player.id}
            contentContainerStyle={{ padding: space.l, gap: space.m, paddingBottom: space.xxl * 2 }}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <View style={{ gap: space.m, marginBottom: space.s }}>
                <Row>
                  <View style={{ flex: 1 }}>
                    <H1>Effectif</H1>
                  </View>
                  <SyncBadge onPress={() => router.push("/sync")} />
                </Row>
                <TextInput
                  value={q}
                  onChangeText={setQ}
                  placeholder="Nom ou dossard"
                  placeholderTextColor={c.textSecondary}
                  accessibilityLabel="Rechercher par nom ou dossard"
                  clearButtonMode="while-editing"
                  autoCorrect={false}
                  style={{ minHeight: touch, borderRadius: radius.m, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, paddingHorizontal: space.m, fontSize: 17, color: c.text }}
                />
                <Choice wrap={false} options={[{ value: "all" as const, label: "Toutes" }, ...categoryOptions]} value={category} onChange={setCategory} />
                <Choice wrap={false} options={[{ value: "all" as const, label: "Tous postes" }, ...positionShortOptions]} value={position} onChange={setPosition} />
                {canWrite(data) ? <Button title={`＋ ${t.players.add}`} onPress={() => router.push("/player/new")} /> : null}
                <Body muted>{rows.length} joueur{rows.length > 1 ? "s" : ""}</Body>
              </View>
            }
            ListEmptyComponent={<Body muted>Aucun joueur ne correspond à ces filtres.</Body>}
            renderItem={({ item: { player, membership } }) => (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push({ pathname: "/player/[id]", params: { id: player.id } })}
                style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: space.m, padding: space.m, borderRadius: radius.l, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, opacity: pressed ? 0.85 : 1 })}
              >
                <Avatar name={player.full_name} mediaId={photoOf(data.graph, player.id, canUseMedia(data))} jersey={membership?.jersey} size={52} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontSize: 17, fontWeight: "700", color: c.textStrong }}>{player.full_name}</Text>
                  <Text style={{ color: c.textSecondary, fontSize: 15 }}>
                    {membership ? `${membership.category_id} · ` : ""}
                    {positionName(player.usual_position)}
                  </Text>
                </View>
                {player.status !== "active" ? <Badge text={statusLabels[player.status]} tone={player.status === "trial" ? "gold" : "warning"} /> : null}
              </Pressable>
            )}
          />
        )}
      </LabGate>
    </SafeAreaView>
  );
}
