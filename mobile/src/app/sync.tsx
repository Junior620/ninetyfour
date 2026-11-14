import * as WebBrowser from "expo-web-browser";
import { Alert, View } from "react-native";
import { useAuth } from "@/lib/auth";
import { API_URL, WEB_URL } from "@/lib/config";
import { useLab } from "@/lib/lab";
import { discard, flush, retry, useSync } from "@/lib/outbox";
import { Badge, Body, Button, Card, H2, Label, Notice, Row, Screen, SyncBadge } from "@/ui/kit";

const roles = { direction: "Direction", staff: "Staff", reader: "Lecteur" } as const;

/** Visible sync states (cahier §08): up to date, waiting, failed to resolve. */
export default function Sync() {
  const { jobs, online, sending, lastSync } = useSync();
  const lab = useLab();
  const { signOut } = useAuth();
  const pending = jobs.filter((j) => j.status === "pending");

  function leave() {
    if (!jobs.length) return void signOut();
    Alert.alert(
      "Saisies non envoyées",
      `${jobs.length} saisie(s) n’ont pas rejoint MatchLab. Elles seront supprimées de ce téléphone si vous vous déconnectez.`,
      [
        { text: "Annuler", style: "cancel" },
        { text: "Se déconnecter quand même", style: "destructive", onPress: () => void signOut() },
      ],
    );
  }

  return (
    <Screen>
      <Row>
        <SyncBadge />
        <Body muted>
          {online ? "Réseau disponible" : "Hors ligne"}
          {lab.dataUpdatedAt ? ` · données du ${new Date(lab.dataUpdatedAt).toLocaleString("fr-FR")}` : ""}
          {lastSync ? ` · dernier envoi ${new Date(lastSync).toLocaleTimeString("fr-FR")}` : ""}
        </Body>
      </Row>
      <Button title="Synchroniser maintenant" busy={sending || lab.isFetching} onPress={() => { flush(); lab.refetch(); }} />

      <H2>{jobs.length ? `Saisies en file (${jobs.length})` : "Aucune saisie en attente"}</H2>
      {!jobs.length ? <Body muted>Tout ce qui a été saisi sur ce téléphone est dans MatchLab.</Body> : null}
      {pending.length ? <Notice text="Ces saisies partiront automatiquement dès le retour du réseau, dans l’ordre où elles ont été faites." /> : null}
      {jobs.map((j) => (
        <Card key={j.id}>
          <Row>
            <Badge text={j.status === "failed" ? "À résoudre" : "En attente"} tone={j.status === "failed" ? "danger" : "warning"} />
            <Body muted>{new Date(j.created_at).toLocaleString("fr-FR")}</Body>
          </Row>
          <Body style={{ fontWeight: "700" }}>{j.label}</Body>
          {j.message ? <Body>{j.message}</Body> : null}
          {j.code === "VERSION_CONFLICT" ? (
            <Body muted>Quelqu’un a modifié ce dossier entre-temps. Rien n’a été écrasé : rouvrez-le pour voir la version actuelle, refaites la modification, puis supprimez cette saisie.</Body>
          ) : null}
          {j.status === "failed" ? (
            <Row>
              <View style={{ flex: 1 }}><Button kind="secondary" title="Réessayer" onPress={() => retry(j.id)} /></View>
              <View style={{ flex: 1 }}>
                <Button
                  kind="ghost"
                  title="Supprimer"
                  onPress={() =>
                    Alert.alert("Supprimer cette saisie ?", "Elle ne sera jamais envoyée à MatchLab.", [
                      { text: "Annuler", style: "cancel" },
                      { text: "Supprimer", style: "destructive", onPress: () => discard(j.id) },
                    ])
                  }
                />
              </View>
            </Row>
          ) : null}
        </Card>
      ))}

      <Card>
        <Label>Compte</Label>
        <Body>{lab.data?.email ?? "—"}</Body>
        <Body muted>{lab.data ? `${roles[lab.data.member.role]}${lab.data.member.permissions.length ? ` · ${lab.data.member.permissions.join(", ")}` : ""}` : ""}</Body>
        <Body muted style={{ fontSize: 13 }}>{`Serveur : ${API_URL}`}</Body>
        <Button kind="secondary" title="Ouvrir MatchLab web" onPress={() => WebBrowser.openBrowserAsync(WEB_URL)} />
        <Button kind="danger" title="Se déconnecter" onPress={leave} />
      </Card>
    </Screen>
  );
}
