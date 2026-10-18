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
import type { Dossier } from "./schema";
import { contactInfo } from "@/lib/data/academy";
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

const dossierStyles = StyleSheet.create({
  head: { flexDirection: "row", gap: 16, marginBottom: 14 },
  photo: { width: 84, height: 84, objectFit: "cover", borderRadius: 4 },
  name: { fontSize: 22, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  label: { fontSize: 8, color: "#5d6e84", marginBottom: 2 },
  box: {
    padding: 10,
    backgroundColor: "#f5f7fa",
    borderRadius: 4,
    marginBottom: 6,
  },
});
const decimal = (v: number | null) =>
  v === null ? "—" : v.toFixed(1).replace(".", ",");
const month = (p: string) => `${p.slice(5, 7)}/${p.slice(0, 4)}`;
const footName = { right: "Droit", left: "Gauche", both: "Ambidextre" } as const;

/** Club dossier: only the content frozen at validation, never live data. */
export async function dossierPdf(
  dossier: Pick<Dossier, "content" | "validated_at">,
  photo?: { data: Uint8Array; format: "png" | "jpg" },
) {
  const c = dossier.content!;
  const d = t.dossier;
  const span = `${c.period.from} – ${c.period.to} · ${c.period.matches} ${t.playerFile.matches}`;
  const doc = (
    <Document
      title={`N91 — ${d.pdfTitle} — ${c.identity.name}`}
      author="N91 MatchLab"
    >
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.brand}>
          {t.academy} · {contactInfo.address.fr.toUpperCase()}
        </Text>
        <View style={dossierStyles.head}>
          {photo && (
            <PdfImage
              src={{ data: Buffer.from(photo.data), format: photo.format }}
              style={dossierStyles.photo}
            />
          )}
          <View style={{ flex: 1 }}>
            <Text style={dossierStyles.label}>{d.pdfTitle}</Text>
            <Text style={dossierStyles.name}>{c.identity.name}</Text>
            <Text style={styles.note}>
              {positionNames[c.identity.position]} · {t.players.foot} :{" "}
              {footName[c.identity.foot]}
            </Text>
            <Text style={styles.note}>
              {c.identity.memberships
                .map((m) => `${m.season} · ${m.category} · #${m.jersey}`)
                .join("   ")}
            </Text>
          </View>
        </View>
        <View style={dossierStyles.box}>
          <Text style={styles.note}>
            {d.recipientFor} : {c.recipient}
            {c.recipient_contact ? ` (${c.recipient_contact})` : ""}
          </Text>
          <Text style={styles.note}>
            {t.playerFile.period} : {span} · {c.period.minutes}{" "}
            {t.playerFile.minutes}
            {c.period.minutesUnknown
              ? ` (${t.playerFile.minutesUnknown} ${c.period.minutesUnknown} ${t.playerFile.evaluations})`
              : ""}
          </Text>
          <Text style={styles.note}>{d.basis}</Text>
        </View>
        {c.positions && (
          <>
            <Text style={styles.section}>{d.sections.positions}</Text>
            {c.positions.length ? (
              c.positions.map((p) => (
                <View style={styles.row} key={p.position} wrap={false}>
                  <Text style={styles.cell}>{positionNames[p.position]}</Text>
                  <Text style={styles.cell}>
                    {p.matches} {t.playerFile.matches} · {p.minutes} min
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.note}>{d.noData}</Text>
            )}
          </>
        )}
        {c.statistics && (
          <>
            <Text style={styles.section}>{d.sections.statistics}</Text>
            <Text style={styles.note}>
              {t.playerFile.score} : {displayScore(c.statistics.score)} /10 ·{" "}
              {c.statistics.scored} {t.playerFile.evaluations} · {span}
            </Text>
            {c.statistics.indicators.map((i) => (
              <Text style={styles.note} key={i.kind}>
                {t.analysis.markerTypes[i.kind]} :{" "}
                {i.success + i.fail
                  ? `${i.success}/${i.success + i.fail} ${t.sequences.successRate}`
                  : "—"}{" "}
                ({i.total} {t.sequences.sample})
              </Text>
            ))}
            <Text style={styles.note}>{t.sequences.physical}</Text>
          </>
        )}
        {c.criteria && (
          <>
            <Text style={styles.section}>
              {d.sections.criteria} · {positionNames[c.criteria.position]}
            </Text>
            {c.criteria.rows.map((r) => (
              <View style={styles.row} key={r.key} wrap={false}>
                <Text style={styles.cell}>{r.label}</Text>
                <Text style={styles.score}>{decimal(r.mean)} /5</Text>
                <Text style={{ width: 80, textAlign: "right" }}>
                  {r.answers} {t.playerFile.answers}
                </Text>
              </View>
            ))}
          </>
        )}
        {c.progression && (
          <>
            <Text style={styles.section}>{d.sections.progression}</Text>
            {c.progression.map((p) => (
              <View style={styles.row} key={p.period} wrap={false}>
                <Text style={styles.cell}>{month(p.period)}</Text>
                <Text style={styles.score}>{displayScore(p.score)} /10</Text>
                <Text style={{ width: 80, textAlign: "right" }}>
                  {p.matches} {t.playerFile.matches}
                </Text>
              </View>
            ))}
          </>
        )}
        {c.strengths && (
          <>
            <Text style={styles.section}>{d.sections.strengths}</Text>
            <Text style={styles.note}>{c.strengths}</Text>
          </>
        )}
        {c.development && (
          <>
            <Text style={styles.section}>{d.sections.development}</Text>
            <Text style={styles.note}>{c.development}</Text>
          </>
        )}
        {c.sequences && c.sequences.length > 0 && (
          <>
            <Text style={styles.section}>{d.sections.sequences}</Text>
            {c.sequences.map((s) => (
              <Text style={styles.note} key={s.id}>
                {s.date} · {s.opponent} · {s.timecode} ·{" "}
                {t.analysis.markerTypes[s.kind]}
                {s.outcome ? ` · ${t.sequences.outcomes[s.outcome]}` : ""}
                {s.tags.length ? ` · ${s.tags.join(", ")}` : ""}
              </Text>
            ))}
          </>
        )}
        {c.staff_comments && c.staff_comments.length > 0 && (
          <>
            <Text style={styles.section}>{d.sections.staff_comments}</Text>
            {c.staff_comments.map((s, i) => (
              <Text style={styles.note} key={i}>
                {s.date} · {s.opponent} : {s.text}
              </Text>
            ))}
          </>
        )}
        {c.scouting && (
          <>
            <Text style={styles.section}>{d.sections.scouting}</Text>
            <Text style={styles.note}>{c.scouting}</Text>
          </>
        )}
        {c.status && (
          <>
            <Text style={styles.section}>{d.sections.status}</Text>
            <Text style={styles.note}>{t.players[c.status]}</Text>
          </>
        )}
        <Text style={styles.section}>{d.contacts}</Text>
        <Text style={styles.note}>
          {t.academy} · {contactInfo.address.fr} · {contactInfo.email}
        </Text>
        <Text style={styles.note}>{d.confidential}</Text>
        <View style={styles.footer} fixed>
          <Text>
            {d.footer} · {d.validatedOn} {dossier.validated_at?.slice(0, 10)}
          </Text>
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
