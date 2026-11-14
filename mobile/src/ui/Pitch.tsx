import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { PanResponder, Pressable, Text, View, type LayoutRectangle } from "react-native";
import { FORMATIONS, move, positionShort, type Board } from "@matchlab/formations";
import { Avatar, Body, Button, Label, Row } from "./kit";
import { radius, space, usePalette } from "./theme";

export type BoardPlayer = { id: string; name: string; jersey?: number; photo?: string | null };

/**
 * Tactical board (cahier §05): portraits on their posts. A player is moved by dragging
 * his token onto a post, or by touching him then the post (one-handed, accessible).
 * Moving onto an occupied post swaps the two players (same rule as the web, formations.ts).
 */
export function Pitch({
  board,
  players,
  pool,
  onChange,
  editable = true,
}: {
  board: Board;
  players: Map<string, BoardPlayer>;
  /** Players that may be placed (match squad or category squad). */
  pool: string[];
  onChange?: (b: Board) => void;
  editable?: boolean;
}) {
  const c = usePalette();
  const [selected, setSelected] = useState<string | null>(null);
  const [frame, setFrame] = useState<LayoutRectangle | null>(null);
  const slots = FORMATIONS[board.formation];
  const onBoard = new Set([...Object.values(board.slots).map((s) => s.player_id).filter(Boolean), ...board.bench]);
  const available = pool.filter((p) => !onBoard.has(p));

  const apply = (playerId: string, to: string | "bench" | null) => {
    onChange?.(move(board, playerId, to));
    setSelected(null);
  };
  const tapSlot = (slotId: string) => {
    if (!editable) return;
    const occupant = board.slots[slotId]?.player_id ?? null;
    if (selected && selected !== occupant) apply(selected, slotId);
    else setSelected(occupant && occupant !== selected ? occupant : null);
  };
  const dropAt = (playerId: string, x: number, y: number) => {
    if (!frame) return;
    const px = (x / frame.width) * 100;
    const py = (y / frame.height) * 100;
    let best: { id: string; d: number } | null = null;
    for (const s of slots) {
      const d = Math.hypot(s.x - px, s.y - py);
      if (!best || d < best.d) best = { id: s.id, d };
    }
    if (best && best.d < 14) apply(playerId, best.id);
  };

  return (
    <View style={{ gap: space.m }}>
      <View
        onLayout={(e) => setFrame(e.nativeEvent.layout)}
        style={{ aspectRatio: 68 / 100, width: "100%", maxWidth: 520, alignSelf: "center", backgroundColor: c.pitch, borderRadius: radius.l, overflow: "hidden" }}
        accessibilityLabel={`Terrain, formation ${board.formation}`}
      >
        <PitchLines color={c.pitchLine} />
        {frame
          ? slots.map((slot) => {
              const pid = board.slots[slot.id]?.player_id ?? null;
              const player = pid ? players.get(pid) : undefined;
              return (
                <Token
                  key={slot.id}
                  left={(slot.x / 100) * frame.width}
                  top={(slot.y / 100) * frame.height}
                  label={positionShort[slot.position]}
                  player={player}
                  active={!!pid && pid === selected}
                  target={!!selected && pid !== selected}
                  editable={editable}
                  onTap={() => tapSlot(slot.id)}
                  onDrop={(dx, dy) => pid && dropAt(pid, (slot.x / 100) * frame.width + dx, (slot.y / 100) * frame.height + dy)}
                />
              );
            })
          : null}
      </View>

      {selected && editable ? (
        <Row>
          <Body style={{ flex: 1 }}>{players.get(selected)?.name ?? "Joueur"} : touchez un poste</Body>
          <Button kind="secondary" title="Banc" onPress={() => apply(selected, "bench")} />
          <Button kind="secondary" title="Retirer" onPress={() => apply(selected, null)} />
          <Button kind="ghost" title="Fiche" onPress={() => router.push({ pathname: "/player/[id]", params: { id: selected } })} />
        </Row>
      ) : null}

      <Strip title={`Banc (${board.bench.length})`} ids={board.bench} players={players} selected={selected} onPick={editable ? (id) => setSelected(id === selected ? null : id) : undefined} />
      {editable ? (
        <Strip title={`À placer (${available.length})`} ids={available} players={players} selected={selected} onPick={(id) => setSelected(id === selected ? null : id)} />
      ) : null}
    </View>
  );
}

function Token({
  left,
  top,
  label,
  player,
  active,
  target,
  editable,
  onTap,
  onDrop,
}: {
  left: number;
  top: number;
  label: string;
  player?: BoardPlayer;
  active: boolean;
  target: boolean;
  editable: boolean;
  onTap: () => void;
  onDrop: (dx: number, dy: number) => void;
}) {
  const c = usePalette();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const handlers = useRef({ onTap, onDrop });
  useEffect(() => {
    handlers.current = { onTap, onDrop };
  });
  // Created once so a drag keeps its gesture state; the latest callbacks are read from
  // the ref inside the gesture handlers only, never during render.
  // eslint-disable-next-line react-hooks/refs
  const [responder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) + Math.abs(g.dy) > 6,
      onPanResponderMove: (_, g) => setOffset({ x: g.dx, y: g.dy }),
      onPanResponderRelease: (_, g) => {
        setOffset({ x: 0, y: 0 });
        if (Math.abs(g.dx) + Math.abs(g.dy) <= 6) handlers.current.onTap();
        else handlers.current.onDrop(g.dx, g.dy);
      },
      onPanResponderTerminate: () => setOffset({ x: 0, y: 0 }),
    }),
  );
  const size = 46;
  return (
    <View
      {...(editable && player ? responder.panHandlers : {})}
      style={{ position: "absolute", left: left - 34 + offset.x, top: top - 30 + offset.y, width: 68, alignItems: "center", zIndex: offset.x || offset.y ? 10 : 1 }}
    >
      <Pressable
        disabled={!!player && editable}
        onPress={onTap}
        accessibilityRole="button"
        accessibilityLabel={player ? `${player.name}, ${label}` : `Poste ${label} libre`}
        style={{ borderRadius: size, borderWidth: 3, borderColor: active ? c.gold : target ? "#ffffffaa" : "transparent" }}
      >
        {player ? (
          <Avatar name={player.name} mediaId={player.photo} size={size} jersey={player.jersey} />
        ) : (
          <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderStyle: "dashed", borderColor: "#ffffffb3", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>{label}</Text>
          </View>
        )}
      </Pressable>
      {player ? (
        <Text numberOfLines={1} style={{ color: "#fff", fontSize: 11, fontWeight: "700", marginTop: 2, textShadowColor: "#0008", textShadowRadius: 3 }}>
          {player.name.split(" ").slice(-1)[0]} · {label}
        </Text>
      ) : null}
    </View>
  );
}

function Strip({
  title,
  ids,
  players,
  selected,
  onPick,
}: {
  title: string;
  ids: string[];
  players: Map<string, BoardPlayer>;
  selected: string | null;
  onPick?: (id: string) => void;
}) {
  const c = usePalette();
  if (!ids.length) return null;
  return (
    <View style={{ gap: space.s }}>
      <Label>{title}</Label>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.s }}>
        {ids.map((id) => {
          const p = players.get(id);
          return (
            <Pressable
              key={id}
              disabled={!onPick}
              onPress={() => onPick?.(id)}
              accessibilityRole="button"
              accessibilityState={{ selected: selected === id }}
              style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: radius.pill, borderWidth: 2, borderColor: selected === id ? c.gold : c.border, backgroundColor: c.surface }}
            >
              <Avatar name={p?.name ?? "?"} mediaId={p?.photo} size={30} />
              <Text style={{ color: c.text, fontWeight: "600" }}>
                {p?.jersey ? `${p.jersey} · ` : ""}
                {p?.name ?? "Joueur hors périmètre"}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function PitchLines({ color }: { color: string }) {
  const line = { position: "absolute" as const, borderColor: color, borderWidth: 2 };
  return (
    <>
      <View style={{ ...line, left: "4%", right: "4%", top: "3%", bottom: "3%" }} />
      <View style={{ ...line, left: "4%", right: "4%", top: "50%", height: 0, borderWidth: 1 }} />
      <View style={{ ...line, left: "36%", width: "28%", top: "41%", aspectRatio: 1, borderRadius: 999 }} />
      <View style={{ ...line, left: "24%", right: "24%", top: "3%", height: "14%" }} />
      <View style={{ ...line, left: "24%", right: "24%", bottom: "3%", height: "14%" }} />
    </>
  );
}
