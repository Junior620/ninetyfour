import { useState } from "react";
import { KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { API_URL } from "@/lib/config";
import { Crest, Wordmark } from "@/ui/brand";
import { Body, Button, Field, Notice, Screen } from "@/ui/kit";
import { space, usePalette } from "@/ui/theme";

export default function Login() {
  const c = usePalette();
  const { signIn, notice } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setBusy(true);
    setError("");
    try {
      await signIn(email, password);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "La connexion n’a pas abouti. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Screen edges={["top", "bottom"]}>
        <View style={{ backgroundColor: c.navy, borderRadius: 22, padding: space.xl, gap: space.m, marginTop: space.l, alignItems: "center" }}>
          <Crest size={132} />
          <Wordmark height={20} light />
          <Text style={{ color: "#fff", fontSize: 26, fontWeight: "800", textAlign: "center" }}>Le terrain devient le premier écran.</Text>
          <Text style={{ color: "#c5dbf1", fontSize: 16, textAlign: "center" }}>Accès réservé au staff de Ninety One Foot Academy.</Text>
        </View>
        {notice ? <Notice text={notice} /> : null}
        <Field
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="username"
          placeholder="prenom.nom@club.com"
        />
        <Field
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          onSubmitEditing={submit}
          returnKeyType="go"
        />
        {error ? <Notice tone="danger" text={error} /> : null}
        <Button title="Se connecter" onPress={submit} busy={busy} disabled={!email || !password} />
        <Body muted style={{ fontSize: 13 }}>
          Même compte que MatchLab web. Mot de passe oublié : utilisez « Mot de passe oublié » sur {API_URL}/matchlab/login.
        </Body>
      </Screen>
    </KeyboardAvoidingView>
  );
}
