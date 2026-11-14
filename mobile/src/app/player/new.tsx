import { router } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";
import type { Position } from "@matchlab/questionnaire";
import type { Player } from "@matchlab/schema";
import type { Category } from "@matchlab/trials";
import { ApiError } from "@/lib/api";
import { currentSeason, useLab, writableCategories } from "@/lib/lab";
import { categoryOptions, footOptions, positionName, positionOptions, t } from "@/lib/labels";
import { save } from "@/lib/outbox";
import { Body, Button, Card, Choice, Field, H2, LabGate, Notice, Screen } from "@/ui/kit";

/** Quick player creation (cahier §03): sporting identity first, portrait right after. */
export default function NewPlayer() {
  const lab = useLab();
  const [name, setName] = useState("");
  const [jersey, setJersey] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [foot, setFoot] = useState<Player["strong_foot"]>("right");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <LabGate query={lab}>
      {(data) => {
        const season = currentSeason(data.graph.seasons);
        const allowed = season ? writableCategories(data, season.id) : [];
        const number = Number(jersey);
        const jerseyError = jersey && !(Number.isInteger(number) && number >= 1 && number <= 99) ? "Entre 1 et 99." : "";
        const taken =
          season && category && !jerseyError && jersey
            ? data.graph.memberships.some((m) => m.season_id === season.id && m.category_id === category && m.jersey === number)
            : false;
        const ready = name.trim().length >= 2 && !!category && !!position && !!jersey && !jerseyError && !!season;

        async function submit() {
          if (!ready || !season || !category || !position) return;
          setBusy(true);
          setError("");
          try {
            const result = await save({
              label: `Nouveau joueur : ${name.trim()}`,
              kind: "players",
              version: 0,
              payload: { full_name: name.trim(), usual_position: position, strong_foot: foot, status: "active", scouting: notes.trim() },
              membership: { season_id: season.id, category_id: category, jersey: number },
            });
            if (result.status === "queued") {
              Alert.alert(
                "Enregistré sur le téléphone",
                "Pas de réseau : le joueur sera envoyé à MatchLab dès le retour de la connexion. Le portrait pourra être ajouté ensuite depuis sa fiche.",
              );
              router.back();
              return;
            }
            const created = result.data as { player: { id: string }; jersey_warning?: boolean };
            if (created.jersey_warning) Alert.alert("Dossard en double", t.players.jerseyWarning);
            router.replace({ pathname: "/player/[id]", params: { id: created.player.id, portrait: "1" } });
          } catch (e) {
            setError(e instanceof ApiError ? e.message : "Vérifiez les champs renseignés.");
          } finally {
            setBusy(false);
          }
        }

        if (!season) return <Screen><Notice text="Aucune saison n’est définie dans MatchLab. La direction doit en créer une sur le web." /></Screen>;
        if (!allowed.length)
          return <Screen><Notice text="Votre compte n’est affecté à aucune catégorie de la saison en cours : création impossible." /></Screen>;
        return (
          <Screen>
            <Body muted>Saison {season.name}. Le profil apparaîtra aussitôt dans MatchLab web, onglet Joueurs.</Body>
            <Card>
              <H2>Identité sportive</H2>
              <Field label={t.players.name} value={name} onChangeText={setName} placeholder="Prénom Nom" autoCapitalize="words" autoComplete="off" />
              <Choice label="Catégorie" options={categoryOptions.filter((o) => allowed.includes(o.value))} value={category} onChange={setCategory} />
              <Field
                label={t.players.jersey}
                value={jersey}
                onChangeText={(v) => setJersey(v.replace(/[^0-9]/g, "").slice(0, 2))}
                keyboardType="number-pad"
                placeholder="10"
                error={jerseyError}
                hint={taken ? t.players.jerseyWarning : undefined}
              />
            </Card>
            <Card>
              <H2>Poste et profil</H2>
              <Choice label={t.players.usual} options={positionOptions} value={position} onChange={setPosition} />
              <Choice label={t.players.foot} options={footOptions} value={foot} onChange={setFoot} />
              <Field label={t.players.notes} value={notes} onChangeText={setNotes} multiline placeholder="Observation du staff (facultatif)" />
            </Card>
            {ready ? (
              <Card tone="gold">
                <Body>
                  Aperçu : {name.trim()} · n°{jersey} · {category} · {positionName(position!)} · pied {footOptions.find((f) => f.value === foot)?.label.toLowerCase()}
                </Body>
              </Card>
            ) : null}
            {error ? <Notice tone="danger" text={error} /> : null}
            <Button title="Enregistrer le profil" onPress={submit} busy={busy} disabled={!ready} />
            <Body muted>Étape suivante : portrait (avec consentement du représentant légal).</Body>
          </Screen>
        );
      }}
    </LabGate>
  );
}
