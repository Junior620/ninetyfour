"use client";
import { useState } from "react";
import { fr as t, errorMessage } from "@/lib/matchlab/messages";
import { useLab, Heading, useMutation, Feedback } from "./shared";
export function ExportPanel() {
  const { data } = useLab();
  const mutation = useMutation();
  const [format, setFormat] = useState("pdf");
  const [kind, setKind] = useState("period");
  const [entity, setEntity] = useState("Évaluations");
  const [match, setMatch] = useState("");
  const [player, setPlayer] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState("preserve");
  const [preview, setPreview] = useState<{
    digest: string;
    counts: Record<string, number>;
  } | null>(null);
  const [importError, setImportError] = useState("");
  if (!data.member.permissions.includes("export"))
    return <p role="alert">{t.errors.FORBIDDEN}</p>;
  async function restore(commit: boolean) {
    if (!file) return;
    setImportError("");
    if (commit && !window.confirm(t.exports.confirm)) return;
    await mutation.run(async () => {
      const form = new FormData();
      form.set("file", file!);
      form.set("mode", mode);
      form.set("commit", String(commit));
      if (preview) form.set("digest", preview.digest);
      const response = await fetch("/api/matchlab/imports", {
        method: "POST",
        body: form,
      });
      const result = await response.json();
      if (!response.ok) {
        setImportError(
          `${errorMessage(result.code)} ${result.collisions?.join(", ") || ""}`,
        );
        throw new Error(result.code);
      }
      if (commit) {
        setPreview(null);
        setFile(null);
      } else setPreview(result);
    });
  }
  return (
    <>
      <Heading title={t.exports.title} />
      <p className="ml-notice">{t.exports.intro}</p>
      <section className="ml-card">
        <div className="ml-form-grid">
          <label>
            {t.nav.matches}
            <select value={match} onChange={(e) => setMatch(e.target.value)}>
              <option value="">{t.all}</option>
              {data.graph.matches.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.played_on} · {m.opponent}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t.players.columns[0]}
            <select value={player} onChange={(e) => setPlayer(e.target.value)}>
              <option value="">{t.all}</option>
              {data.graph.players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="ml-export-actions">
          {format === "csv" && (
            <label>
              Table à exporter
              <select
                value={entity}
                onChange={(e) => setEntity(e.target.value)}
              >
                {[
                  "Joueurs",
                  "Matchs",
                  "Évaluations",
                  "Circonstances",
                  "Réponses",
                  "Repères vidéo",
                  "Métadonnées",
                ].map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
          )}
          <label>
            {t.exports.format}
            <select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="pdf">PDF A4</option>
              <option value="xlsx">Excel XLSX</option>
              <option value="csv">CSV UTF-8</option>
              <option value="zip">{t.exports.archive}</option>
            </select>
          </label>
          <label>
            {t.admin.kind}
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="period">{t.reports.period}</option>
              <option value="match">{t.reports.match}</option>
              <option value="player">{t.reports.player}</option>
            </select>
          </label>
          <button
            className="ml-button"
            disabled={
              mutation.busy ||
              (kind === "match" && !match) ||
              (kind === "player" && !player)
            }
            onClick={() =>
              mutation.run(async () => {
                const params = new URLSearchParams(
                  Object.entries(data.filters)
                    .filter(([, v]) => v !== undefined)
                    .map(([k, v]) => [k, String(v)]),
                );
                params.set("format", format);
                params.set("kind", kind);
                if (format === "csv") params.set("entity", entity);
                if (match) params.set("match", match);
                if (player) params.set("player", player);
                const response = await fetch(`/api/matchlab/exports?${params}`);
                if (!response.ok) throw new Error((await response.json()).code);
                const url = URL.createObjectURL(await response.blob());
                const a = document.createElement("a");
                a.href = url;
                a.download = `n91-matchlab-${kind}.${format}`;
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              }, false)
            }
          >
            {t.exports.download}
          </button>
        </div>
        <p className="ml-method">
          {JSON.stringify(data.filters)} · {match || t.all} · {player || t.all}
        </p>
        <p className="ml-method">{t.exports.photos}</p>
        <Feedback {...mutation} />
      </section>
      {data.member.role === "direction" && (
        <section className="ml-card">
          <h2>{t.exports.import}</h2>
          <div className="ml-form-grid">
            <label>
              {t.exports.archive}
              <input
                type="file"
                accept=".zip,application/zip"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null);
                  setPreview(null);
                }}
              />
            </label>
            <label>
              {t.exports.mode}
              <select
                value={mode}
                onChange={(e) => {
                  setMode(e.target.value);
                  setPreview(null);
                }}
              >
                <option value="preserve">{t.exports.preserve}</option>
                <option value="copy">{t.exports.copy}</option>
              </select>
            </label>
          </div>
          <Feedback error={importError} success="" />
          <div className="ml-actions">
            <button
              className="ml-button secondary"
              disabled={!file || mutation.busy}
              onClick={() => restore(false)}
            >
              {t.exports.preview}
            </button>
            {preview && (
              <button
                className="ml-button"
                disabled={mutation.busy}
                onClick={() => restore(true)}
              >
                {t.exports.restore}
              </button>
            )}
          </div>
          {preview && (
            <div className="ml-notice">
              <p>{t.exports.checked}</p>
              <pre>{JSON.stringify(preview.counts, null, 2)}</pre>
            </div>
          )}
        </section>
      )}
    </>
  );
}
