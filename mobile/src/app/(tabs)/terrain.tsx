import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { changeFormation, compareBoards, emptyBoard, type Board } from "@matchlab/formations";
import { FORMATION_IDS, LINEUP_KINDS, type Lineup } from "@matchlab/schema";
import { CATEGORIES, type Category } from "@matchlab/trials";
import { ApiError } from "@/lib/api";
import { boardPlayers, sameBoard, scenarios, toBoard } from "@/lib/boards";
import { canWrite, currentSeason, squad, useLab, writableCategories, type LabData } from "@/lib/lab";
import { editable, save } from "@/lib/outbox";
import { Body, Button, Card, Choice, Field, H1, H2, LabGate, Notice, Row, SyncBadge } from "@/ui/kit";
import { Pitch } from "@/ui/Pitch";
import { space, usePalette } from "@/ui/theme";

const kindLabels: Record<(typeof LINEUP_KINDS)[number], string> = {
  team: "Équipe type",
  rotation: "Rotation",
  alternative: "Variante",
  matchday: "Feuille de match",
};

export default function Terrain() {
  const c = usePalette();
  const lab = useLab();
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: c.bg }}>
      <LabGate query={lab}>{(data) => <Scenarios data={data} />}</LabGate>
    </SafeAreaView>
  );
}

function Scenarios({ data }: { data: LabData }) {
  const season = currentSeason(data.graph.seasons);
  const writable = season ? writableCategories(data, season.id) : [];
  const visible = CATEGORIES.filter((cat) => writable.includes(cat) || data.graph.memberships.some((m) => m.season_id === season?.id && m.category_id === cat));
  const [category, setCategory] = useState<Category | null>(visible[0] ?? null);
  const list = season && category ? scenarios(data.graph, season.id, category) : [];
  const [openId, setOpenId] = useState<string | null>(list[0]?.id ?? null);
  const open = list.find((l) => l.id === openId) ?? null;

  if (!season) return <View style={{ padding: space.l }}><Notice text="Aucune saison définie dans MatchLab." /></View>;
  const canEdit = canWrite(data) && !!category && writable.includes(category);
  return (
    <ScrollView contentContainerStyle={{ padding: space.l, gap: space.l, paddingBottom: space.xxl * 2 }}>
      <Row>
        <View style={{ flex: 1 }}><H1>Terrain</H1></View>
        <SyncBadge onPress={() => router.push("/sync")} />
      </Row>
      <Choice wrap={false} options={visible.map((v) => ({ value: v, label: v }))} value={category} onChange={(v) => { setCategory(v); setOpenId(null); }} />
      <Choice
        wrap={false}
        label="Scénarios"
        options={[...list.map((l) => ({ value: l.id, label: l.name })), ...(canEdit ? [{ value: "__new", label: "＋ Nouveau" }] : [])]}
        value={openId ?? "__new"}
        onChange={(v) => setOpenId(v === "__new" ? null : v)}
      />
      {category ? (
        // A new scenario, or a fresher version saved on the web, starts a fresh editor.
        <Editor
          key={`${category}:${open?.id ?? "new"}:${open?.version ?? 0}`}
          data={data}
          seasonId={season.id}
          category={category}
          open={open}
          list={list}
          canEdit={canEdit}
          onSaved={setOpenId}
        />
      ) : null}
    </ScrollView>
  );
}

function Editor({
  data,
  seasonId,
  category,
  open,
  list,
  canEdit,
  onSaved,
}: {
  data: LabData;
  seasonId: string;
  category: Category;
  open: Lineup | null;
  list: Lineup[];
  canEdit: boolean;
  onSaved: (id: string) => void;
}) {
  const [board, setBoard] = useState<Board>(open ? toBoard(open) : emptyBoard());
  const [name, setName] = useState(open?.name ?? "");
  const [kind, setKind] = useState<Lineup["kind"]>(open?.kind ?? "team");
  const [compareId, setCompareId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const players = boardPlayers(data, seasonId);
  const pool = squad(data.graph, seasonId, category).map((r) => r.player.id);
  const dirty = open ? !sameBoard(board, toBoard(open)) || name !== open.name || kind !== open.kind : Object.values(board.slots).some((s) => s.player_id) || board.bench.length > 0;
  const other = list.find((l) => l.id === compareId && l.id !== open?.id);
  const diff = other ? compareBoards(board, toBoard(other)) : null;

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const id = open?.id ?? randomUUID();
      const payload = {
        ...(open ? editable("lineups", open) : {}),
        id,
        season_id: seasonId,
        category_id: category,
        name: name.trim() || `Scénario ${board.formation}`,
        kind,
        formation: board.formation,
        slots: board.slots,
        bench: board.bench,
      };
      const result = await save({ label: `Scénario : ${payload.name}`, kind: "lineups", version: open?.version ?? 0, payload });
      if (result.status === "queued") Alert.alert("Enregistré sur le téléphone", "Le scénario partira au retour du réseau.");
      onSaved(id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Scénario non enregistré.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: space.l }}>
      {!pool.length ? <Notice tone="info" text="Aucun joueur dans cette catégorie pour la saison en cours. Ajoutez-en depuis l’Effectif." /> : null}

      <Choice
        label="Formation"
        options={FORMATION_IDS.map((f) => ({ value: f, label: f }))}
        value={board.formation}
        onChange={(f) => canEdit && setBoard(changeFormation(board, f))}
      />
      <Pitch board={board} players={players} pool={pool} onChange={setBoard} editable={canEdit} />

      {canEdit ? (
        <Card>
          <H2>{open ? "Enregistrer le scénario" : "Nouveau scénario"}</H2>
          <Field label="Nom" value={name} onChangeText={setName} placeholder={`Scénario ${board.formation}`} />
          <Choice options={LINEUP_KINDS.filter((k) => k !== "matchday").map((k) => ({ value: k, label: kindLabels[k] }))} value={kind} onChange={setKind} />
          {error ? <Notice tone="danger" text={error} /> : null}
          <Button title={open ? "Enregistrer les changements" : "Enregistrer comme scénario"} onPress={submit} busy={busy} disabled={!dirty} />
          <Body muted style={{ fontSize: 13 }}>Un scénario est une proposition : aucune sélection officielle sans validation du staff.</Body>
        </Card>
      ) : null}

      {list.length > 1 ? (
        <Card>
          <H2>Comparer avec…</H2>
          <Choice wrap={false} options={list.filter((l) => l.id !== open?.id).map((l) => ({ value: l.id, label: l.name }))} value={compareId} onChange={setCompareId} />
          {diff && other ? (
            <View style={{ gap: 4 }}>
              <Body>{diff.sameFormation ? `Même formation (${board.formation})` : `${board.formation} ↔ ${other.formation}`}</Body>
              {diff.moved.map((m) => <Body key={m.player}>{`↔ ${players.get(m.player)?.name ?? "Joueur"} : ${m.from} → ${m.to}`}</Body>)}
              {diff.onlyA.map((p) => <Body key={`a${p}`}>{`− ${players.get(p)?.name ?? "Joueur"} absent de « ${other.name} »`}</Body>)}
              {diff.onlyB.map((p) => <Body key={`b${p}`}>{`＋ ${players.get(p)?.name ?? "Joueur"} seulement dans « ${other.name} »`}</Body>)}
              {!diff.moved.length && !diff.onlyA.length && !diff.onlyB.length ? <Body muted>Aucune différence de placement.</Body> : null}
            </View>
          ) : null}
        </Card>
      ) : null}
    </View>
  );
}
