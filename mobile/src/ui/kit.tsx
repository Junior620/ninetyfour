import { Image } from "expo-image";
import { useEffect, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { accessToken } from "@/lib/api";
import { API_URL } from "@/lib/config";
import { useSync } from "@/lib/outbox";
import { radius, space, touch, usePalette } from "./theme";

export function Screen({
  children,
  scroll = true,
  edges = ["bottom"],
}: {
  children: ReactNode;
  scroll?: boolean;
  edges?: ("top" | "bottom")[];
}) {
  const c = usePalette();
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: c.bg }}>
      {scroll ? (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: space.l, gap: space.l, paddingBottom: space.xxl * 2 }}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, padding: space.l, gap: space.l }}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function H1({ children }: { children: ReactNode }) {
  const c = usePalette();
  return <Text style={[s.h1, { color: c.textStrong }]}>{children}</Text>;
}
export function H2({ children }: { children: ReactNode }) {
  const c = usePalette();
  return <Text style={[s.h2, { color: c.textStrong }]}>{children}</Text>;
}
export function Label({ children }: { children: ReactNode }) {
  const c = usePalette();
  return <Text style={[s.label, { color: c.textSecondary }]}>{children}</Text>;
}
export function Body({
  children,
  muted,
  style,
}: {
  children: ReactNode;
  muted?: boolean;
  style?: object;
}) {
  const c = usePalette();
  return (
    <Text style={[s.body, { color: muted ? c.textSecondary : c.text }, style]}>{children}</Text>
  );
}

export function Card({
  children,
  onPress,
  style,
  tone,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  tone?: "accent" | "gold";
}) {
  const c = usePalette();
  const bg = tone === "accent" ? c.navy : tone === "gold" ? c.goldSurface : c.surface;
  const content = (
    <View style={[s.card, { backgroundColor: bg, borderColor: c.border }, style]}>{children}</View>
  );
  return onPress ? (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      {content}
    </Pressable>
  ) : (
    content
  );
}

export function Button({
  title,
  onPress,
  kind = "primary",
  disabled,
  busy,
  icon,
}: {
  title: string;
  onPress: () => void;
  kind?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  busy?: boolean;
  icon?: string;
}) {
  const c = usePalette();
  const bg =
    kind === "primary" ? c.accent : kind === "danger" ? c.danger : kind === "secondary" ? c.surface : "transparent";
  const fg = kind === "primary" ? c.onAccent : kind === "danger" ? "#fff" : c.accentText;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        {
          backgroundColor: bg,
          borderColor: kind === "secondary" ? c.border : bg,
          opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
        },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[s.buttonText, { color: fg }]}>
          {icon ? `${icon}  ` : ""}
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  hint,
  error,
  ...input
}: TextInputProps & { label: string; hint?: string; error?: string }) {
  const c = usePalette();
  return (
    <View style={{ gap: space.xs }}>
      <Label>{label}</Label>
      <TextInput
        placeholderTextColor={c.textSecondary}
        {...input}
        accessibilityLabel={label}
        style={[
          s.input,
          {
            color: c.text,
            backgroundColor: c.surface,
            borderColor: error ? c.danger : c.border,
            minHeight: input.multiline ? 96 : touch,
            textAlignVertical: input.multiline ? "top" : "center",
          },
        ]}
      />
      {error ? (
        <Text style={{ color: c.danger, fontSize: 14 }}>{error}</Text>
      ) : hint ? (
        <Text style={{ color: c.textSecondary, fontSize: 14 }}>{hint}</Text>
      ) : null}
    </View>
  );
}

/** Pre-filled choices: one tap instead of typing (football vocabulary). */
export function Choice<T extends string | number>({
  label,
  options,
  value,
  onChange,
  wrap = true,
}: {
  label?: string;
  options: readonly { value: T; label: string }[];
  value: T | null | undefined;
  onChange: (v: T) => void;
  wrap?: boolean;
}) {
  const c = usePalette();
  const chips = options.map((o) => {
    const on = o.value === value;
    return (
      <Pressable
        key={String(o.value)}
        accessibilityRole="radio"
        accessibilityState={{ selected: on }}
        onPress={() => onChange(o.value)}
        style={[
          s.chip,
          { backgroundColor: on ? c.accent : c.surface, borderColor: on ? c.accent : c.border },
        ]}
      >
        <Text style={{ color: on ? c.onAccent : c.text, fontWeight: "600", fontSize: 15 }}>
          {o.label}
        </Text>
      </Pressable>
    );
  });
  return (
    <View style={{ gap: space.xs }}>
      {label ? <Label>{label}</Label> : null}
      {wrap ? (
        <View style={s.chips} accessibilityRole="radiogroup">
          {chips}
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.s }}>
          {chips}
        </ScrollView>
      )}
    </View>
  );
}

export function Badge({
  text,
  tone = "neutral",
}: {
  text: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "gold";
}) {
  const c = usePalette();
  const map = {
    neutral: [c.surfaceMuted, c.textSecondary],
    success: [c.successSurface, c.success],
    warning: [c.warningSurface, c.warning],
    danger: [c.dangerSurface, c.danger],
    gold: [c.goldSurface, c.goldText],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={[s.badge, { backgroundColor: bg }]}>
      <Text style={{ color: fg, fontWeight: "700", fontSize: 13 }}>{text}</Text>
    </View>
  );
}

export function Notice({
  text,
  tone = "warning",
}: {
  text: string;
  tone?: "warning" | "danger" | "success" | "info";
}) {
  const c = usePalette();
  const bg = tone === "danger" ? c.dangerSurface : tone === "success" ? c.successSurface : tone === "info" ? c.surfaceAccent : c.warningSurface;
  const fg = tone === "danger" ? c.danger : tone === "success" ? c.success : tone === "info" ? c.accentText : c.warning;
  return (
    <View accessibilityRole="alert" style={[s.notice, { backgroundColor: bg }]}>
      <Text style={{ color: fg, fontSize: 15, lineHeight: 21 }}>{text}</Text>
    </View>
  );
}

export function Row({ children, gap = space.s }: { children: ReactNode; gap?: number }) {
  return <View style={{ flexDirection: "row", alignItems: "center", gap, flexWrap: "wrap" }}>{children}</View>;
}

export function Loading({ text = "Chargement de MatchLab…" }: { text?: string }) {
  const c = usePalette();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: space.m, backgroundColor: c.bg }}>
      <ActivityIndicator color={c.accent} size="large" />
      <Body muted>{text}</Body>
    </View>
  );
}

/** Always-visible synchronisation status: up to date, waiting (n), to resolve. */
export function SyncBadge({ onPress }: { onPress?: () => void }) {
  const { jobs, online, sending } = useSync();
  const failed = jobs.filter((j) => j.status === "failed").length;
  const waiting = jobs.filter((j) => j.status === "pending").length;
  const [text, tone] = failed
    ? [`${failed} à résoudre`, "danger" as const]
    : sending
      ? ["Envoi…", "neutral" as const]
      : waiting
        ? [`${waiting} en attente${online ? "" : " · hors ligne"}`, "warning" as const]
        : online
          ? ["À jour", "success" as const]
          : ["Hors ligne", "warning" as const];
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Synchronisation : ${text}`} hitSlop={10}>
      <Badge text={text} tone={tone} />
    </Pressable>
  );
}

/** Real portrait when consented and allowed, otherwise initials. */
export function Avatar({
  name,
  mediaId,
  size = 48,
  jersey,
}: {
  name: string;
  mediaId?: string | null;
  size?: number;
  jersey?: number | null;
}) {
  const c = usePalette();
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    if (mediaId) accessToken().then(setToken).catch(() => setToken(null));
  }, [mediaId]);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <View style={{ width: size, height: size }}>
      {mediaId && token ? (
        <Image
          source={{ uri: `${API_URL}/api/matchlab/media?id=${mediaId}`, headers: { Authorization: `Bearer ${token}` } }}
          cachePolicy="memory"
          style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.surfaceMuted }}
          accessibilityLabel={`Portrait de ${name}`}
        />
      ) : (
        <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.surfaceAccent, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: c.accentText, fontWeight: "800", fontSize: size * 0.36 }}>{initials || "?"}</Text>
        </View>
      )}
      {jersey ? (
        <View style={[s.jersey, { backgroundColor: c.gold, borderColor: c.surface }]}>
          <Text style={{ color: "#0f2745", fontWeight: "800", fontSize: 11 }}>{jersey}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  const c = usePalette();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, padding: space.l, gap: space.l, justifyContent: "center" }}>
      <Notice tone="danger" text={message} />
      <Button title="Réessayer" onPress={retry} />
    </SafeAreaView>
  );
}

/** Shows the last known data, an error screen, or the loader. */
export function LabGate<T>({
  query,
  children,
}: {
  query: { data?: T; error: unknown; refetch: () => unknown };
  children: (data: T) => ReactNode;
}) {
  if (query.data) return <>{children(query.data)}</>;
  if (query.error) return <ErrorState message={(query.error as Error).message} retry={() => query.refetch()} />;
  return <Loading />;
}

export function Empty({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <Card>
      <H2>{title}</H2>
      {text ? <Body muted>{text}</Body> : null}
      {action}
    </Card>
  );
}

const s = StyleSheet.create({
  h1: { fontSize: 28, fontWeight: "800", letterSpacing: -0.4 },
  h2: { fontSize: 19, fontWeight: "700" },
  label: { fontSize: 13, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" },
  body: { fontSize: 16, lineHeight: 22 },
  card: { borderRadius: radius.l, borderWidth: StyleSheet.hairlineWidth, padding: space.l, gap: space.s },
  button: { minHeight: touch, borderRadius: radius.m, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: space.l },
  buttonText: { fontSize: 17, fontWeight: "700" },
  input: { borderWidth: 1, borderRadius: radius.m, paddingHorizontal: space.m, paddingVertical: space.s, fontSize: 17 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.s },
  chip: { minHeight: 44, paddingHorizontal: space.l, borderRadius: radius.pill, borderWidth: 1, justifyContent: "center" },
  badge: { borderRadius: radius.pill, paddingHorizontal: space.m, paddingVertical: 5, alignSelf: "flex-start" },
  notice: { borderRadius: radius.m, padding: space.m },
  jersey: { position: "absolute", right: -4, bottom: -4, minWidth: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
});
