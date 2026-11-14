import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, View } from "react-native";
import { photoConsent } from "@matchlab/photos";
import { playerProfile } from "@matchlab/profile";
import type { Position } from "@matchlab/questionnaire";
import { displayScore } from "@matchlab/scoring";
import type { Player } from "@matchlab/schema";
import { nextCategory, trialComparison } from "@matchlab/trials";
import { ApiError } from "@/lib/api";
import { canUseMedia, canWrite, currentSeason, LAB_KEY, queryClient, useLab, type LabData } from "@/lib/lab";
import { footLabel, formatDate, photoOf, positionName, positionOptions, statusLabels, t } from "@/lib/labels";
import { editable, save } from "@/lib/outbox";
import { pickPortrait, uploadPortrait } from "@/lib/portrait";
import { Avatar, Badge, Body, Button, Card, Choice, Field, H1, H2, LabGate, Label, Notice, Row, Screen } from "@/ui/kit";
import { space, usePalette } from "@/ui/theme";

export default function PlayerFile() {
  const { id } = useLocalSearchParams<{ id: string; portrait?: string }>();
  const lab = useLab();
  return (
    <LabGate query={lab}>
      {(data) => {
        const player = data.graph.players.find((p) => p.id === id);
        if (!player) return <Screen><Notice text="Ce joueur n’est pas (ou plus) dans votre périmètre." /></Screen>;
        return <File data={data} player={player} />;
      }}
    </LabGate>
  );
}

function File({ data, player }: { data: LabData; player: Player }) {
  const { graph } = data;
  const season = currentSeason(graph.seasons);
  const membership =
    graph.memberships.find((m) => m.player_id === player.id && m.season_id === season?.id) ??
    graph.memberships.find((m) => m.player_id === player.id);
  const profile = playerProfile(player, graph);
  const media = canUseMedia(data);
  const writer = canWrite(data);
  const upper = membership ? nextCategory(membership.category_id) : null;
  const trial = upper ? trialComparison(player, graph, upper, player.usual_position) : null;

  return (
    <Screen>
      <Row gap={space.l}>
        <Avatar name={player.full_name} mediaId={photoOf(graph, player.id, media)} size={84} jersey={membership?.jersey} />
        <View style={{ flex: 1, gap: 4 }}>
          <H1>{player.full_name}</H1>
          <Body muted>
            {membership ? `${membership.category_id} · n°${membership.jersey} · ` : ""}
            {positionName(player.usual_position)} · pied {footLabel(player.strong_foot).toLowerCase()}
          </Body>
          <Badge text={statusLabels[player.status]} tone={player.status === "active" ? "success" : player.status === "trial" ? "gold" : "warning"} />
        </View>
      </Row>

      {media && writer ? <Portrait data={data} player={player} /> : null}

      <Card>
        <H2>Profil observé</H2>
        <Row gap={space.xl}>
          <Stat label="Note moyenne" value={`${displayScore(profile.score)} / 10`} />
          <Stat label="Matchs évalués" value={String(profile.sample.matches)} />
          <Stat label="Minutes" value={String(profile.sample.minutes)} />
        </Row>
        {profile.sample.evaluations === 0 ? <Body muted>Données insuffisantes : aucune évaluation enregistrée.</Body> : null}
        {profile.criteria.filter((c) => c.mean !== null).length ? (
          <View style={{ gap: 6, marginTop: space.s }}>
            {profile.criteria.filter((c) => c.mean !== null).map((c) => (
              <Bar key={c.key} label={c.label} value={c.mean!} count={c.answers} />
            ))}
          </View>
        ) : null}
      </Card>

      {trial && upper ? (
        <Card tone="gold">
          <H2>{`Tester en ${upper}`}</H2>
          <Row>
            <Badge
              text={trial.confidence === "insufficient" || trial.confidence === "low" ? "À confirmer" : `Confiance ${trial.confidence === "high" ? "élevée" : "moyenne"}`}
              tone={trial.confidence === "insufficient" || trial.confidence === "low" ? "warning" : "success"}
            />
            <Body muted>{`${trial.sample.matches} match(s) · ${trial.sample.atPosition} au poste`}</Body>
          </Row>
          {!trial.defined ? (
            <Body>Aucun référentiel {upper} défini pour ce poste : la direction le renseigne sur MatchLab web (Essai).</Body>
          ) : (
            <View style={{ gap: 4 }}>
              {trial.criteria.filter((c) => c.status === "gap" || c.status === "unobserved").slice(0, 6).map((c) => (
                <Body key={c.key}>
                  {c.status === "gap" ? "▲ Écart" : "○ Non observé"} · {c.label}
                  {c.mean !== null && c.level !== null ? ` (${c.mean.toFixed(1)} / cible ${c.level})` : ""}
                </Body>
              ))}
              {trial.criteria.every((c) => c.status !== "gap" && c.status !== "unobserved") ? <Body>Critères requis atteints sur les matchs observés.</Body> : null}
            </View>
          )}
          <Body muted style={{ fontSize: 13 }}>
            Aide à l’observation, jamais une décision : l’âge seul ne dit rien du potentiel. Toute promotion est validée par le staff.
          </Body>
        </Card>
      ) : null}

      <Card>
        <H2>Historique</H2>
        {profile.history.length ? (
          profile.history.slice(0, 10).map((h) => (
            <Row key={h.evaluation.id}>
              <Body style={{ flex: 1 }}>{`${formatDate(h.match.played_on)} · ${h.match.opponent} · ${h.evaluation.position}`}</Body>
              <Badge text={displayScore(h.score)} tone="neutral" />
            </Row>
          ))
        ) : (
          <Body muted>Pas encore de match évalué.</Body>
        )}
      </Card>

      {writer ? <Edit player={player} /> : null}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const c = usePalette();
  return (
    <View>
      <Label>{label}</Label>
      <Body style={{ fontSize: 22, fontWeight: "800", color: c.textStrong }}>{value}</Body>
    </View>
  );
}
function Bar({ label, value, count }: { label: string; value: number; count: number }) {
  const c = usePalette();
  return (
    <View accessible accessibilityLabel={`${label} : ${value.toFixed(1)} sur 5, ${count} réponse(s)`}>
      <Row>
        <Body style={{ flex: 1, fontSize: 14 }}>{label}</Body>
        <Body muted style={{ fontSize: 14 }}>{value.toFixed(1)}</Body>
      </Row>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: c.surfaceMuted }}>
        <View style={{ height: 8, borderRadius: 4, width: `${(value / 5) * 100}%`, backgroundColor: c.accent }} />
      </View>
    </View>
  );
}

/** Portrait (cahier §03 + youth safeguards): only with a current guardian consent. */
function Portrait({ data, player }: { data: LabData; player: Player }) {
  // Consents are compared with the time of the last change, not frozen at first render.
  const [now, setNow] = useState(() => Date.now());
  const consent = photoConsent(data.graph.consents, player.id, now);
  const [guardian, setGuardian] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const hasPhoto = !!photoOf(data.graph, player.id, true);
  const season = currentSeason(data.graph.seasons);

  async function recordConsent() {
    setBusy(true);
    setError("");
    try {
      const now = new Date();
      const yearLater = new Date(now.getTime() + 365 * 864e5);
      const seasonEnd = season ? new Date(`${season.ends_on}T23:59:59Z`) : yearLater;
      const expires = seasonEnd > now ? seasonEnd : yearLater;
      await save({
        label: `Consentement photo : ${player.full_name}`,
        kind: "consents",
        version: 0,
        // The server replaces the policy with the club's text in force.
        payload: {
          player_id: player.id,
          guardian_name: guardian.trim(),
          purpose: "internal_photo",
          policy: "Politique du club en vigueur",
          granted_at: now.toISOString(),
          expires_at: expires.toISOString(),
          revoked_at: null,
        },
      });
      setNow(Date.now());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Consentement non enregistré.");
    } finally {
      setBusy(false);
    }
  }
  async function choose(source: "camera" | "library") {
    setError("");
    try {
      setPreview(await pickPortrait(source));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function send() {
    if (!preview || !consent) return;
    setBusy(true);
    setError("");
    try {
      await uploadPortrait(player.id, consent.id, preview);
      setPreview(null);
      await queryClient.invalidateQueries({ queryKey: LAB_KEY });
    } catch (e) {
      setError(e instanceof ApiError ? (e.offline ? `Pas de réseau : le portrait n’est pas envoyé. Réessayez une fois connecté.${__DEV__ && e.detail ? ` [${e.detail}]` : ""}` : e.message) : `Envoi impossible.${__DEV__ ? ` [${String(e)}]` : ""}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <H2>{t.players.photo}</H2>
      {!consent ? (
        <>
          <Body muted>{t.players.photoHint} Sans autorisation en cours, aucune image n’est prise ni envoyée.</Body>
          <Field label="Représentant légal" value={guardian} onChangeText={setGuardian} placeholder="Nom du parent / tuteur" autoCapitalize="words" />
          <Choice
            options={[{ value: "yes", label: "J’ai recueilli son autorisation écrite" }]}
            value={confirmed ? "yes" : null}
            onChange={() => setConfirmed(!confirmed)}
          />
          <Button title="Enregistrer le consentement" onPress={recordConsent} busy={busy} disabled={guardian.trim().length < 2 || !confirmed} />
        </>
      ) : preview ? (
        <>
          <Image source={{ uri: preview }} style={{ width: 220, height: 220, borderRadius: 110, alignSelf: "center" }} accessibilityLabel="Aperçu du portrait" />
          <Row>
            <View style={{ flex: 1 }}><Button kind="secondary" title="Reprendre" onPress={() => setPreview(null)} /></View>
            <View style={{ flex: 1 }}><Button title="Envoyer" onPress={send} busy={busy} /></View>
          </Row>
        </>
      ) : (
        <>
          <Body muted>{`Autorisé par ${consent.guardian_name} jusqu’au ${new Date(consent.expires_at).toLocaleDateString("fr-FR")}. Usage interne uniquement.`}</Body>
          <Row>
            <View style={{ flex: 1 }}><Button title={hasPhoto ? "Nouvelle photo" : "Prendre la photo"} onPress={() => choose("camera")} /></View>
            <View style={{ flex: 1 }}><Button kind="secondary" title="Photothèque" onPress={() => choose("library")} /></View>
          </Row>
        </>
      )}
      {error ? <Notice tone="danger" text={error} /> : null}
    </Card>
  );
}

function Edit({ player }: { player: Player }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(player.status);
  const [position, setPosition] = useState<Position>(player.usual_position);
  const [notes, setNotes] = useState(player.scouting);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!open) return <Button kind="secondary" title="Modifier la fiche" onPress={() => setOpen(true)} />;
  async function submit() {
    setBusy(true);
    setError("");
    try {
      const result = await save({
        label: `Fiche : ${player.full_name}`,
        kind: "players",
        version: player.version,
        payload: { ...editable("players", player), status, usual_position: position, scouting: notes },
      });
      if (result.status === "queued") Alert.alert("Enregistré sur le téléphone", "La modification partira au retour du réseau.");
      setOpen(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Modification refusée.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card>
      <H2>Modifier la fiche</H2>
      <Choice label="Statut" options={(Object.keys(statusLabels) as Player["status"][]).map((s) => ({ value: s, label: statusLabels[s] }))} value={status} onChange={setStatus} />
      <Choice label={t.players.usual} options={positionOptions} value={position} onChange={setPosition} />
      <Field label={t.players.notes} value={notes} onChangeText={setNotes} multiline />
      {error ? <Notice tone="danger" text={error} /> : null}
      <Row>
        <View style={{ flex: 1 }}><Button kind="secondary" title="Annuler" onPress={() => setOpen(false)} /></View>
        <View style={{ flex: 1 }}><Button title="Enregistrer" onPress={submit} busy={busy} /></View>
      </Row>
    </Card>
  );
}
