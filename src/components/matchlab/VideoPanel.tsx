"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Play, Upload, Pause, Trash2 } from "lucide-react";
import { fr as t, errorMessage } from "@/lib/matchlab/messages";
import type { Match, Video } from "@/lib/matchlab/schema";
import { timecode } from "@/lib/matchlab/sequences";
import { useLab, Feedback } from "./shared";

type Ticket = {
  endpoint: string;
  apikey: string;
  bucket: string;
  path: string;
  token: string;
};
type Pending = { id: string; location: string | null; fingerprint: string };
const CHUNK = 6 * 1024 * 1024; // Supabase resumable uploads use 6 MB chunks.
const PENDING = "ml-video-upload";
const fingerprint = (file: File, matchId: string) =>
  `${matchId}|${file.name}|${file.size}|${file.lastModified}`;
const readPending = (): Pending | null => {
  try {
    return JSON.parse(localStorage.getItem(PENDING) || "null");
  } catch {
    return null;
  }
};
const writePending = (p: Pending | null) => {
  try {
    if (p) localStorage.setItem(PENDING, JSON.stringify(p));
    else localStorage.removeItem(PENDING);
  } catch {}
};
async function call(body: unknown) {
  const response = await fetch("/api/matchlab/videos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.code);
  return result;
}
const b64 = (s: string) => btoa(unescape(encodeURIComponent(s)));

/** TUS upload signed for one path; resumes from the server's offset. */
async function sendFile(
  file: File,
  ticket: Ticket,
  location: string | null,
  onLocation: (l: string) => void,
  onProgress: (sent: number) => void,
  stop: { current: boolean },
) {
  const headers = {
    "Tus-Resumable": "1.0.0",
    "x-signature": ticket.token,
    apikey: ticket.apikey,
  };
  let offset = 0;
  if (location) {
    const head = await fetch(location, { method: "HEAD", headers });
    if (head.ok) offset = Number(head.headers.get("Upload-Offset") ?? 0);
    else location = null;
  }
  if (!location) {
    const created = await fetch(ticket.endpoint, {
      method: "POST",
      headers: {
        ...headers,
        "Upload-Length": String(file.size),
        "Upload-Metadata": `bucketName ${b64(ticket.bucket)},objectName ${b64(ticket.path)},contentType ${b64(file.type)}`,
        "x-upsert": "true",
      },
    });
    location = created.headers.get("Location");
    if (!created.ok || !location) throw new Error("DATABASE_UNAVAILABLE");
    onLocation(location);
  }
  onProgress(offset);
  while (offset < file.size) {
    if (stop.current) throw new Error("PAUSED");
    const patch = await fetch(location, {
      method: "PATCH",
      headers: {
        ...headers,
        "Upload-Offset": String(offset),
        "Content-Type": "application/offset+octet-stream",
      },
      body: file.slice(offset, offset + CHUNK),
    });
    if (!patch.ok) throw new Error("DATABASE_UNAVAILABLE");
    offset = Number(patch.headers.get("Upload-Offset") ?? offset);
    onProgress(offset);
  }
}
const duration = (file: File) =>
  new Promise<number | null>((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      resolve(Number.isFinite(v.duration) ? Math.round(v.duration) : null);
      URL.revokeObjectURL(v.src);
    };
    v.onerror = () => resolve(null);
    v.src = URL.createObjectURL(file);
  });
const size = (bytes: number) =>
  bytes > 1024 ** 3
    ? `${(bytes / 1024 ** 3).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Go`
    : `${Math.round(bytes / 1024 ** 2).toLocaleString("fr-FR")} Mo`;

/**
 * Match video: import (resumable, signed), playback by short signed URL, or a local
 * file read on this device only. The <video> element is shared with the sequences.
 */
export function VideoPanel({
  match,
  videoRef,
  local,
  onLocalFile,
  onActive,
}: {
  match?: Match;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  local: { url: string; name: string };
  onLocalFile: (file: File) => void;
  onActive: (videoId: string | null) => void;
}) {
  const { data, refresh } = useLab();
  // A sequence link (?t=seconds) opens the video at that moment once it is loaded.
  const query = useSearchParams();
  const startAt = useRef(Number(query.get("t")) || 0);
  const canWrite = data.member.role !== "reader";
  const governed =
    !!data.settings.retention_days && !!data.settings.consent_policy;
  const videos = data.graph.videos
    .filter((v) => v.match_id === match?.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const ready = videos.filter((v) => v.status === "ready");
  const [activeId, setActiveId] = useState<string | null>(ready[0]?.id ?? null);
  const [remoteUrl, setRemoteUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [team, setTeam] = useState("");
  const [conditions, setConditions] = useState("");
  const [sent, setSent] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const stop = useRef(false);
  const [pending] = useState<Pending | null>(() => readPending());
  const active = videos.find((v) => v.id === activeId);
  const useLocal = !!local.url && !remoteUrl;

  useEffect(() => {
    onActive(useLocal ? null : (active?.id ?? null));
  }, [active?.id, useLocal, onActive]);
  // Fetch a signed URL once per selected video, not on every data reload (it would
  // reset playback).
  const playable = active?.status === "ready" ? active.id : null;
  useEffect(() => {
    if (!playable) return;
    let alive = true;
    fetch(`/api/matchlab/videos?id=${playable}`)
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (!alive) return;
        if (ok) setRemoteUrl(j.url);
        else setError(errorMessage(j.code));
      })
      .catch(() => alive && setError(errorMessage("DATABASE_UNAVAILABLE")));
    return () => {
      alive = false;
    };
  }, [playable]);

  const upload = async () => {
    if (!file || !match) return;
    setBusy(true);
    setError("");
    setSuccess("");
    stop.current = false;
    try {
      const print = fingerprint(file, match.id);
      const previous = readPending();
      let id = "";
      let ticket: Ticket | null = null;
      let location: string | null = null;
      // Same file as an interrupted upload: new ticket, same row and path. The row may
      // not be in the loaded data yet (created in this session); the server refuses a
      // ticket for a finished or removed video, and we then start a new import.
      if (previous?.fingerprint === print && !ready.some((v) => v.id === previous.id)) {
        try {
          ({ upload: ticket } = await call({ action: "ticket", id: previous.id }));
          id = previous.id;
          location = previous.location;
        } catch {
          writePending(null);
        }
      }
      if (!ticket) {
        let video: Video;
        ({ video, upload: ticket } = await call({
          action: "create",
          match_id: match.id,
          name: file.name,
          mime: file.type,
          bytes: file.size,
          duration_seconds: await duration(file),
          team_filmed: team,
          conditions,
        }));
        id = video.id;
        writePending({ id, location: null, fingerprint: print });
      }
      await sendFile(
        file,
        ticket!,
        location,
        (l) => writePending({ id, location: l, fingerprint: print }),
        setSent,
        stop,
      );
      await call({ action: "complete", id });
      writePending(null);
      setFile(null);
      setSent(null);
      await refresh();
      setActiveId(id);
      setSuccess(t.video.uploaded);
    } catch (e) {
      const code = e instanceof Error ? e.message : "INTERNAL_ERROR";
      if (code !== "PAUSED") setError(errorMessage(code));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ml-video-panel">
      <div className="ml-video-stage">
        {remoteUrl || local.url ? (
          <video
            ref={videoRef}
            src={useLocal ? local.url : remoteUrl}
            controls
            playsInline
            preload="metadata"
            onLoadedMetadata={(e) => {
              if (!startAt.current) return;
              e.currentTarget.currentTime = startAt.current;
              startAt.current = 0;
            }}
          />
        ) : (
          <div>
            <Play size={42} />
            <p>{ready.length ? t.loading : t.analysis.chooseVideo}</p>
            {local.name && <small>{local.name}</small>}
          </div>
        )}
      </div>
      {ready.length > 0 && (
        <label>
          {t.video.playing}
          <select
            value={activeId ?? ""}
            onChange={(e) => {
              setRemoteUrl("");
              setActiveId(e.target.value || null);
            }}
          >
            {ready.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
                {v.team_filmed ? ` · ${v.team_filmed}` : ""}
                {v.duration_seconds ? ` · ${timecode(v.duration_seconds)}` : ""}
              </option>
            ))}
          </select>
        </label>
      )}
      {active && (
        <p className="ml-muted">
          {t.video.ready} · {size(active.bytes)}
          {active.conditions ? ` · ${active.conditions}` : ""}
        </p>
      )}
      {match && canWrite && (
        <details className="ml-video-import" open={!ready.length}>
          <summary>{t.video.import}</summary>
          {!governed ? (
            <p className="ml-notice">{t.video.governance}</p>
          ) : (
            <div className="ml-form-grid">
              <label className="wide">
                {t.video.choose}
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm"
                  disabled={busy}
                  onChange={(e) => {
                    setFile(e.target.files?.[0] ?? null);
                    setSent(null);
                  }}
                />
              </label>
              {pending?.fingerprint.startsWith(`${match.id}|`) && !busy && (
                <p className="ml-notice wide">{t.video.resumeHint}</p>
              )}
              <label>
                {t.video.teamFilmed}
                <input
                  value={team}
                  maxLength={120}
                  disabled={busy}
                  onChange={(e) => setTeam(e.target.value)}
                />
              </label>
              <label>
                {t.video.conditions}
                <input
                  value={conditions}
                  maxLength={500}
                  placeholder={t.video.conditionsHint}
                  disabled={busy}
                  onChange={(e) => setConditions(e.target.value)}
                />
              </label>
              {file && (
                <p className="ml-muted wide">
                  {file.name} · {t.video.size} {size(file.size)}
                </p>
              )}
              {sent !== null && file && (
                <div className="wide ml-upload-progress">
                  <progress
                    value={sent}
                    max={file.size}
                    aria-label={t.video.progress}
                  />
                  <span>{Math.floor((sent / file.size) * 100)} %</span>
                </div>
              )}
              <div className="ml-actions wide">
                {busy ? (
                  <button
                    type="button"
                    className="ml-button secondary"
                    onClick={() => (stop.current = true)}
                  >
                    <Pause size={17} />
                    {t.video.pause}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="ml-button"
                    disabled={!file}
                    onClick={upload}
                  >
                    <Upload size={17} />
                    {sent !== null ? t.video.resume : t.video.send}
                  </button>
                )}
                {active && (
                  <button
                    type="button"
                    className="ml-button secondary"
                    disabled={busy}
                    onClick={async () => {
                      if (!window.confirm(t.video.removeConfirm)) return;
                      try {
                        await call({ action: "remove", id: active.id });
                        setRemoteUrl("");
                        setActiveId(null);
                        await refresh();
                      } catch (e) {
                        setError(errorMessage(e instanceof Error ? e.message : "INTERNAL_ERROR"));
                      }
                    }}
                  >
                    <Trash2 size={17} />
                    {t.video.remove}
                  </button>
                )}
              </div>
              <small className="wide">{t.video.noCompression}</small>
            </div>
          )}
        </details>
      )}
      <Feedback error={error} success={success} />
      <label className="ml-video-select">
        {t.video.local}
        <input
          type="file"
          accept="video/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setRemoteUrl("");
              onLocalFile(f);
            }
          }}
        />
      </label>
      <p className="ml-muted">{t.video.localHint}</p>
    </div>
  );
}
