import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Image as PdfImage,
} from "@react-pdf/renderer";
import type { Archive } from "./export";
import {
  displayScore,
  individualScore,
  collectiveScore,
  rankings,
} from "./scoring";
import {
  positionNames,
  commonQuestions,
  specificQuestions,
  collectiveQuestions,
} from "./questionnaire";
import { describeCircumstances } from "./circumstances";
import { fr as t } from "./messages";
const styles = StyleSheet.create({
  page: { padding: 38, fontFamily: "Helvetica", fontSize: 9, color: "#17334f" },
  brand: {
    fontSize: 10,
    letterSpacing: 1.4,
    color: "#6887a9",
    marginBottom: 18,
  },
  title: { fontSize: 23, fontFamily: "Helvetica-Bold", marginBottom: 14 },
  meta: { fontSize: 8, color: "#74889e", marginBottom: 15 },
  section: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginTop: 18,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 7,
    borderBottom: "1px solid #e1e7ee",
  },
  cell: { flex: 1, paddingRight: 8 },
  score: { width: 48, textAlign: "right" },
  note: { fontSize: 9, lineHeight: 1.5, marginBottom: 6 },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 38,
    right: 38,
    fontSize: 7,
    color: "#7c8da1",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
export async function reportPdf(
  archive: Archive,
  kind: "match" | "player" | "period",
  photos: Record<string, Uint8Array> = {},
) {
  const { graph: g, metadata } = archive;
  const rank = rankings(g.evaluations);
  const doc = (
    <Document
      title={`N91 MatchLab — ${t.reports[kind]}`}
      author={metadata.author}
    >
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.brand}>{t.footer}</Text>
        <Text style={styles.title}>{t.reports[kind]}</Text>
        <Text style={styles.meta}>
          {metadata.created_at} · {metadata.author} · {metadata.schema}
          {"\n"}
          {JSON.stringify(metadata.filters)}
        </Text>
        <Text style={styles.note}>
          {t.overview.method} · {rank.playerCount} joueurs · {g.matches.length}{" "}
          matchs
        </Text>
        {rank.playerCount < 5 && (
          <Text style={styles.note}>{t.reports.small}</Text>
        )}
        {kind === "player" &&
          g.players.map((p) => (
            <View key={p.id} style={{ marginBottom: 12 }}>
              <Text style={styles.section}>{p.full_name}</Text>
              <Text style={styles.note}>
                {positionNames[p.usual_position]} ·{" "}
                {p.strong_foot === "right"
                  ? "Droitier"
                  : p.strong_foot === "left"
                    ? "Gaucher"
                    : "Ambidextre"}
              </Text>
              {p.scouting && <Text style={styles.note}>{p.scouting}</Text>}
            </View>
          ))}
        {g.matches.map((m) => (
          <View key={m.id}>
            <Text style={styles.section}>
              N91 {m.home_score ?? "—"} - {m.away_score ?? "—"} {m.opponent}
            </Text>
            <Text style={styles.meta}>
              {m.played_on} · {m.category_id} · {m.competition} · {m.venue}
            </Text>
            <Text style={styles.note}>
              {t.reports.collective} :{" "}
              {displayScore(collectiveScore(m.collective))} /10
            </Text>
            <Text style={styles.note}>
              {collectiveQuestions
                .map(
                  (q) =>
                    `${q.label} : ${
                      q.id in m.collective
                        ? m.collective[q.id] === null
                          ? t.analysis.unobserved
                          : `${m.collective[q.id]}/5`
                        : "—"
                    }`,
                )
                .join(" · ")}
            </Text>
            {m.context && <Text style={styles.note}>{m.context}</Text>}
            {describeCircumstances(m.circumstances).map((c) => (
              <Text style={styles.note} key={c.key}>
                {c.label} : {c.value}
              </Text>
            ))}
            {g.evaluations
              .filter((e) => e.match_id === m.id)
              .map((e) => (
                <View key={e.id}>
                  {photos[e.player_id] && (
                    <PdfImage
                      src={{
                        data: Buffer.from(photos[e.player_id]),
                        format:
                          g.media.find((m) => m.player_id === e.player_id)
                            ?.mime === "image/png"
                            ? "png"
                            : "jpg",
                      }}
                      style={{
                        width: 48,
                        height: 48,
                        objectFit: "cover",
                        marginTop: 10,
                      }}
                    />
                  )}
                  <View style={styles.row} wrap={false}>
                    <Text style={styles.cell}>
                      {g.players.find((p) => p.id === e.player_id)?.full_name} ·{" "}
                      #
                      {g.memberships.find(
                        (ms) =>
                          ms.player_id === e.player_id &&
                          ms.season_id === m.season_id &&
                          ms.category_id === m.category_id,
                      )?.jersey ?? "—"}{" "}
                      · {positionNames[e.position as keyof typeof positionNames]}{" "}
                      · {t.reports.minutes} {e.minutes ?? "—"} min
                    </Text>
                    <Text style={styles.score}>
                      {displayScore(individualScore(e.common, e.specific))} /10
                    </Text>
                  </View>
                  {e.observation && <Text style={styles.note}>{e.observation}</Text>}
                  {e.priorities && <Text style={styles.note}>{e.priorities}</Text>}
                  {kind !== "period" &&
                    [
                      ...commonQuestions.map((q) => ({ q, a: e.common })),
                      ...specificQuestions[e.position].map((q) => ({
                        q,
                        a: e.specific,
                      })),
                    ].map(({ q, a }, i) => (
                      <Text style={styles.note} key={i}>
                        {q.label} :{" "}
                        {q.id in a
                          ? a[q.id] === null
                            ? t.analysis.unobserved
                            : String(a[q.id])
                          : t.analysis.unanswered}
                      </Text>
                    ))}
                </View>
              ))}
            {g.markers
              .filter((marker) => marker.match_id === m.id)
              .map((marker) => (
                <Text key={marker.id} style={styles.note}>
                  {Math.floor(marker.seconds / 60)}:
                  {Math.floor(marker.seconds % 60)
                    .toString()
                    .padStart(2, "0")}{" "}
                  · {t.analysis.markerTypes[marker.kind]}
                  {marker.outcome && ` · ${t.sequences.outcomes[marker.outcome]}`}
                  {marker.theme && ` · ${marker.theme}`} · {marker.observation}
                </Text>
              ))}
          </View>
        ))}
        {g.matches.length === 0 && <Text style={styles.note}>{t.empty}</Text>}
        <Text style={styles.section}>{t.reports.best}</Text>
        {rank.best.map((e, i) => (
          <Text key={i} style={styles.note}>
            {g.players.find((p) => p.id === e.player_id)?.full_name} ·{" "}
            {positionNames[e.position as keyof typeof positionNames]} ·{" "}
            {displayScore(e.score)} /10
          </Text>
        ))}
        <Text style={styles.note}>{t.decision}</Text>
        <Text style={styles.section}>{t.reports.bestPositions}</Text>
        {rank.bestPositions.map((p) => (
          <Text key={p.position} style={styles.note}>
            {positionNames[p.position as keyof typeof positionNames]} ·{" "}
            {displayScore(p.mean)} /10 · {p.n} joueur(s) distinct(s)
          </Text>
        ))}
        <Text style={styles.note}>{t.reports.review}</Text>
        <View style={styles.footer} fixed>
          <Text>N91 MatchLab · Confidentiel · {metadata.scoring}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
  return new Uint8Array(await renderToBuffer(doc));
}
