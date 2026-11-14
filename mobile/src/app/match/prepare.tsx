import AsyncStorage from "@react-native-async-storage/async-storage";
import { randomUUID } from "expo-crypto";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { GROUNDS } from "@matchlab/circumstances";
import { changeFormation, emptyBoard, FORMATIONS, move, type Board } from "@matchlab/formations";
import { collectiveQuestions, commonQuestions, positionNames, specificQuestions, type Position } from "@matchlab/questionnaire";
import { FORMATION_IDS, type Match } from "@matchlab/schema";
import type { Category } from "@matchlab/trials";
import { ApiError } from "@/lib/api";
import { boardPlayers, toBoard } from "@/lib/boards";
import { currentSeason, squad, useLab, writableCategories, type LabData } from "@/lib/lab";
import { categoryOptions, formatDateLong, t, today } from "@/lib/labels";
import { matchdayLineup } from "@/lib/matches";
import { editable, save } from "@/lib/outbox";
import { DateField } from "@/ui/DateField";
import { Avatar, Badge, Body, Button, Card, Choice, Field, H2, LabGate, Label, Notice, Row, Screen } from "@/ui/kit";
import { Pitch } from "@/ui/Pitch";
import { radius, space, usePalette } from "@/ui/theme";

type Circ = Match["circumstances"];
type Draft = {
  category: Category | null;
  opponent: string;
  played_on: string;
  competition: string;
  venue: string;
  context: string;
  circumstances: Circ;
  called: string[];
  board: Board;
};
const STEPS = ["Rencontre", "Contexte", "Effectif", "Organisation", "Questionnaire", "Validation"] as const;
const choices = (list: readonly string[]) => list.map((v) => ({ value: v, label: v }));

/** Match file built as a guided dossier (cahier §04). Creation and later edits. */
export default function Prepare() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const lab = useLab();
  return <LabGate query={lab}>{(data) => <Wizard data={data} matchId={id} />}</LabGate>;
}

function initial(data: LabData, match?: Match): Draft {
  if (!match)
    return { category: null, opponent: "", played_on: today(), competition: "", venue: "", context: "", circumstances: {}, called: [], board: emptyBoard() };
  const lineup = matchdayLineup(data.graph, match.id);
  const board = lineup ? toBoard(lineup) : emptyBoard((FORMATION_IDS as readonly string[]).includes(match.circumstances?.system ?? "") ? (match.circumstances!.system as Board["formation"]) : "4-3-3");
  const called = [...Object.values(board.slots).map((s) => s.player_id).filter((p): p is string => !!p), ...board.bench];
  return {
    category: match.category_id,
    opponent: match.opponent,
    played_on: match.played_on,
    competition: match.competition,
    venue: match.venue,
    context: match.context,
    circumstances: match.circumstances ?? {},
    called,
    board,
  };
}

function Wizard({ data, matchId }: { data: LabData; matchId?: string }) {
  const c = usePalette();
  const match = matchId ? data.graph.matches.find((m) => m.id === matchId) : undefined;
  const season = currentSeason(data.graph.seasons);
  const allowed = season ? writableCategories(data, season.id) : [];
  const draftKey = `matchlab.draft.match.${matchId ?? "new"}`;
  const [draft, setDraft] = useState<Draft>(() => initial(data, match));
  const [step, setStep] = useState(0);
  const [restored, setRestored] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const loaded = useRef(false);

  // Automatic draft: what is typed survives closing the screen or the app.
  useEffect(() => {
    AsyncStorage.getItem(draftKey).then((raw) => {
      if (raw)
        try {
          setDraft(JSON.parse(raw) as Draft);
          setRestored(true);
        } catch {
          /* unreadable draft: start again */
        }
      loaded.current = true;
    });
  }, [draftKey]);
  useEffect(() => {
    if (loaded.current) AsyncStorage.setItem(draftKey, JSON.stringify(draft)).catch(() => undefined);
  }, [draft, draftKey]);

  if (!season) return <Screen><Notice text="Aucune saison définie dans MatchLab." /></Screen>;
  if (!allowed.length) return <Screen><Notice text="Votre compte ne peut pas créer de match dans la saison en cours." /></Screen>;

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const setCirc = (patch: Partial<Circ>) => setDraft((d) => ({ ...d, circumstances: { ...d.circumstances, ...patch } }));
  const players = boardPlayers(data, season.id);
  const roster = draft.category ? squad(data.graph, season.id, draft.category) : [];
  const missing = [
    !draft.category && "catégorie",
    draft.opponent.trim().length < 2 && "adversaire",
    !draft.circumstances.ground && "domicile / extérieur",
    !draft.called.length && "joueurs convoqués",
    Object.values(draft.board.slots).filter((s) => s.player_id).length < FORMATIONS[draft.board.formation].length && "titulaires du plan de jeu",
  ].filter(Boolean) as string[];
  const blocking = !draft.category || draft.opponent.trim().length < 2;

  function toggle(playerId: string) {
    setDraft((d) =>
      d.called.includes(playerId)
        ? { ...d, called: d.called.filter((p) => p !== playerId), board: move(d.board, playerId, null) }
        : { ...d, called: [...d.called, playerId] },
    );
  }

  async function validate() {
    if (blocking || !season || !draft.category) return;
    setBusy(true);
    setError("");
    try {
      const id = match?.id ?? randomUUID();
      const placed = new Set(Object.values(draft.board.slots).map((s) => s.player_id).filter(Boolean));
      const bench = [...draft.board.bench, ...draft.called.filter((p) => !placed.has(p) && !draft.board.bench.includes(p))];
      const first = await save({
        label: `Match : ${draft.category} – ${draft.opponent.trim()}`,
        kind: "matches",
        version: match?.version ?? 0,
        payload: {
          ...(match ? editable("matches", match) : { home_score: null, away_score: null, status: "draft", collective: {} }),
          id,
          season_id: season.id,
          category_id: draft.category,
          opponent: draft.opponent.trim(),
          played_on: draft.played_on,
          competition: draft.competition.trim(),
          venue: draft.venue.trim(),
          context: draft.context.trim(),
          circumstances: { ...draft.circumstances, system: draft.board.formation },
        },
      });
      const lineup = matchdayLineup(data.graph, id);
      const second = await save({
        label: `Feuille de match : ${draft.opponent.trim()}`,
        kind: "lineups",
        version: lineup?.version ?? 0,
        payload: {
          ...(lineup ? editable("lineups", lineup) : {}),
          id: lineup?.id ?? randomUUID(),
          season_id: season.id,
          category_id: draft.category,
          name: `Feuille de match – ${draft.opponent.trim()}`.slice(0, 120),
          kind: "matchday",
          formation: draft.board.formation,
          slots: draft.board.slots,
          bench,
          match_id: id,
        },
      });
      await AsyncStorage.removeItem(draftKey);
      if (first.status === "queued" || second.status === "queued")
        Alert.alert("Enregistré sur le téléphone", "Pas de réseau : la préparation sera envoyée à MatchLab dès le retour de la connexion.");
      router.replace({ pathname: "/match/[id]", params: { id } });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Préparation non enregistrée. Vérifiez les champs.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Steps step={step} onStep={setStep} />
      {restored ? (
        <Row>
          <Badge text="Brouillon repris" tone="gold" />
          <Button kind="ghost" title="Repartir de zéro" onPress={() => { setDraft(initial(data, match)); setRestored(false); AsyncStorage.removeItem(draftKey); }} />
        </Row>
      ) : null}

      {step === 0 ? (
        <Card>
          <H2>01 · Rencontre</H2>
          <Choice label="Catégorie" options={categoryOptions.filter((o) => allowed.includes(o.value))} value={draft.category} onChange={(category) => set({ category, called: category === draft.category ? draft.called : [], board: category === draft.category ? draft.board : emptyBoard(draft.board.formation) })} />
          <Field label={t.match.opponent} value={draft.opponent} onChangeText={(opponent) => set({ opponent })} placeholder="Nom de l’équipe adverse" autoCapitalize="words" />
          <DateField label={t.match.date} value={draft.played_on} onChange={(played_on) => set({ played_on })} />
          <Choice label={t.match.circumstanceKeys.ground} options={GROUNDS.map((g) => ({ value: g, label: t.match.grounds[g] }))} value={draft.circumstances.ground} onChange={(ground) => setCirc({ ground })} />
          <Choice label={t.match.circumstanceKeys.match_type} options={choices(t.match.choices.match_type)} value={draft.circumstances.match_type} onChange={(match_type) => setCirc({ match_type })} />
          <Field label={t.match.competition} value={draft.competition} onChangeText={(competition) => set({ competition })} placeholder="Championnat U17, tournoi…" />
          <Field label={t.match.venue} value={draft.venue} onChangeText={(venue) => set({ venue })} />
          <Choice label={t.match.circumstanceKeys.surface} options={choices(t.match.choices.surface)} value={draft.circumstances.surface} onChange={(surface) => setCirc({ surface })} />
        </Card>
      ) : null}

      {step === 1 ? (
        <Card>
          <H2>02 · Contexte</H2>
          <Body muted>{t.match.circumstanceHint}</Body>
          <Choice label={t.match.circumstanceKeys.weather} options={choices(t.match.choices.weather)} value={draft.circumstances.weather} onChange={(weather) => setCirc({ weather })} />
          <Choice label={t.match.circumstanceKeys.pitch} options={choices(t.match.choices.pitch)} value={draft.circumstances.pitch} onChange={(pitch) => setCirc({ pitch })} />
          <Choice label={t.match.circumstanceKeys.opposition} options={choices(t.match.choices.opposition)} value={draft.circumstances.opposition} onChange={(opposition) => setCirc({ opposition })} />
          <Field label="Enjeux, style adverse, contraintes" value={draft.context} onChangeText={(context) => set({ context })} multiline />
          <Field label={t.match.circumstanceKeys.absences} value={draft.circumstances.absences ?? ""} onChangeText={(absences) => setCirc({ absences })} multiline />
          <Field label={t.match.circumstanceKeys.travel} value={draft.circumstances.travel ?? ""} onChangeText={(travel) => setCirc({ travel })} />
        </Card>
      ) : null}

      {step === 2 ? (
        <Card>
          <H2>03 · Effectif</H2>
          {!draft.category ? <Notice text="Choisissez d’abord la catégorie (étape 1)." /> : null}
          <Row>
            <Body style={{ flex: 1 }}>{`${draft.called.length} convoqué(s) sur ${roster.length}`}</Body>
            {roster.length ? <Button kind="ghost" title={draft.called.length === roster.length ? "Aucun" : "Tous"} onPress={() => setDraft((d) => (d.called.length === roster.length ? { ...d, called: [], board: emptyBoard(d.board.formation) } : { ...d, called: roster.map((r) => r.player.id) }))} /> : null}
          </Row>
          {roster.map(({ player, membership }) => {
            const on = draft.called.includes(player.id);
            return (
              <Pressable
                key={player.id}
                onPress={() => toggle(player.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                style={{ flexDirection: "row", alignItems: "center", gap: space.m, padding: space.s, borderRadius: radius.m, borderWidth: 2, borderColor: on ? c.accent : c.border, backgroundColor: on ? c.surfaceAccent : c.surface }}
              >
                <Avatar name={player.full_name} mediaId={players.get(player.id)?.photo} jersey={membership.jersey} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.textStrong, fontWeight: "700", fontSize: 16 }}>{player.full_name}</Text>
                  <Text style={{ color: c.textSecondary }}>{positionNames[player.usual_position]}{player.status !== "active" ? ` · ${player.status === "injured" ? "indisponible" : player.status === "trial" ? "à revoir" : "inactif"}` : ""}</Text>
                </View>
                <Text style={{ fontSize: 22, color: on ? c.accent : c.border }}>{on ? "✓" : "○"}</Text>
              </Pressable>
            );
          })}
        </Card>
      ) : null}

      {step === 3 ? (
        <View style={{ gap: space.m }}>
          <H2>04 · Organisation</H2>
          <Choice label="Système de départ" options={FORMATION_IDS.map((f) => ({ value: f, label: f }))} value={draft.board.formation} onChange={(f) => set({ board: changeFormation(draft.board, f) })} />
          {!draft.called.length ? <Notice text="Convoquez d’abord des joueurs (étape 3)." /> : null}
          <Pitch board={draft.board} players={players} pool={draft.called} onChange={(board) => set({ board })} />
          <Body muted>Les convoqués non placés iront sur le banc à la validation.</Body>
        </View>
      ) : null}

      {step === 4 ? <QuestionnaireStep draft={draft} /> : null}

      {step === 5 ? (
        <Card>
          <H2>06 · Validation</H2>
          <Body>{`${draft.category ?? "?"} · N91 – ${draft.opponent || "?"}`}</Body>
          <Body muted>{formatDateLong(draft.played_on)}{draft.venue ? ` · ${draft.venue}` : ""}{draft.circumstances.ground ? ` · ${t.match.grounds[draft.circumstances.ground]}` : ""}</Body>
          <Body muted>{`${draft.board.formation} · ${Object.values(draft.board.slots).filter((s) => s.player_id).length} titulaire(s) · ${draft.called.length} convoqué(s)`}</Body>
          {missing.length ? <Notice text={`À compléter : ${missing.join(", ")}.${blocking ? "" : " Vous pouvez valider maintenant et compléter plus tard."}`} /> : <Notice tone="success" text="Préparation complète." />}
          {error ? <Notice tone="danger" text={error} /> : null}
          <Button title={match ? "Enregistrer la préparation" : "Valider la préparation"} onPress={validate} busy={busy} disabled={blocking} />
          <Body muted style={{ fontSize: 13 }}>Visible aussitôt dans MatchLab web (Matchs, Terrain), pour le staff autorisé.</Body>
        </Card>
      ) : null}

      <Row>
        <View style={{ flex: 1 }}>{step > 0 ? <Button kind="secondary" title="Précédent" onPress={() => setStep(step - 1)} /> : null}</View>
        <View style={{ flex: 1 }}>{step < STEPS.length - 1 ? <Button title="Suivant" onPress={() => setStep(step + 1)} /> : null}</View>
      </Row>
    </Screen>
  );
}

function Steps({ step, onStep }: { step: number; onStep: (s: number) => void }) {
  const c = usePalette();
  return (
    <View style={{ flexDirection: "row", gap: 4 }} accessibilityRole="tablist">
      {STEPS.map((label, i) => (
        <Pressable key={label} onPress={() => onStep(i)} accessibilityRole="tab" accessibilityState={{ selected: i === step }} accessibilityLabel={`Étape ${i + 1} : ${label}`} style={{ flex: 1, gap: 4 }}>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: i <= step ? c.accent : c.border }} />
          <Text numberOfLines={1} style={{ fontSize: 10, fontWeight: i === step ? "800" : "500", color: i === step ? c.textStrong : c.textSecondary }}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Step 05: the questions that will be asked, adapted to each starter's post. */
function QuestionnaireStep({ draft }: { draft: Draft }) {
  const posts = new Map<Position, number>();
  for (const slot of FORMATIONS[draft.board.formation])
    if (draft.board.slots[slot.id]?.player_id) posts.set(slot.position, (posts.get(slot.position) ?? 0) + 1);
  return (
    <Card>
      <H2>05 · Questionnaire</H2>
      <Body muted>Questionnaire officiel 1.1 : 6 questions communes + 5 propres au poste, réponses 1 à 5 ou « Non observé ». Saisie après le match, depuis la fiche du match.</Body>
      <Label>Communes à tous</Label>
      {commonQuestions.map((q) => <Body key={q.id}>{`• ${q.label}`}</Body>)}
      <Label>Par poste (titulaires prévus)</Label>
      {[...posts].length ? (
        [...posts].map(([p, n]) => <Body key={p}>{`• ${positionNames[p]} (${n}) : ${specificQuestions[p].map((q) => q.label).join(", ")}`}</Body>)
      ) : (
        <Body muted>Placez les titulaires à l’étape 4 pour voir leurs questions.</Body>
      )}
      <Label>Collectif</Label>
      {collectiveQuestions.map((q) => <Body key={q.id}>{`• ${q.label}`}</Body>)}
    </Card>
  );
}
