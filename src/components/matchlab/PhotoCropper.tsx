"use client";
import { useEffect, useRef, useState } from "react";
import { Check, ScanFace } from "lucide-react";
import type { FaceDetector } from "@mediapipe/tasks-vision";
import { fr as t } from "@/lib/matchlab/messages";
import {
  clampCrop,
  defaultCrop,
  faceCrop,
  zoomCrop,
  outputSize,
  type Box,
  type Crop,
} from "@/lib/matchlab/crop";
import { Modal } from "./shared";

/** Photos the cropper can read; the result is always a JPEG under the upload limit. */
export const SOURCE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SOURCE = 25 * 1024 * 1024;
export function checkSource(file: File) {
  if (!SOURCE_TYPES.includes(file.type)) throw new Error("PHOTO_FORMAT");
  if (file.size > MAX_SOURCE) throw new Error("PAYLOAD_TOO_LARGE");
}

// Face detection runs on this device with a model served by the site; nothing is sent.
let detectorPromise: Promise<FaceDetector> | null = null;
function loadDetector() {
  detectorPromise ??= (async () => {
    const { FilesetResolver, FaceDetector } = await import("@mediapipe/tasks-vision");
    const files = await FilesetResolver.forVisionTasks("/matchlab/mediapipe");
    return FaceDetector.createFromOptions(files, {
      baseOptions: {
        modelAssetPath: "/matchlab/models/blaze_face_short_range.tflite",
        delegate: "CPU",
      },
      runningMode: "IMAGE",
      minDetectionConfidence: 0.5,
    });
  })();
  detectorPromise.catch(() => {
    detectorPromise = null;
  });
  return detectorPromise;
}
async function findFaces(image: HTMLImageElement): Promise<Box[]> {
  const detector = await loadDetector();
  return detector.detect(image).detections.flatMap((d) =>
    d.boundingBox
      ? [
          {
            x: d.boundingBox.originX,
            y: d.boundingBox.originY,
            width: d.boundingBox.width,
            height: d.boundingBox.height,
            score: d.categories[0]?.score,
          },
        ]
      : [],
  );
}

type Detection = "loading" | "face" | "none" | "unavailable";
/** Places the photo inside a square box so that the crop fills it exactly. */
const placement = (crop: Crop, width: number) => ({
  width: `${(width / crop.size) * 100}%`,
  left: `${(-crop.x / crop.size) * 100}%`,
  top: `${(-crop.y / crop.size) * 100}%`,
});

/**
 * Square cropping with a round preview. A face found on the device proposes the
 * framing; the photo can always be moved (drag, arrows) and zoomed (pinch, wheel,
 * slider, + and −). Only the cropped JPEG leaves the device.
 */
export function PhotoCropper({
  source,
  name,
  onCancel,
  onConfirm,
}: {
  source: Blob;
  name: string;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}) {
  const [url] = useState(() => URL.createObjectURL(source));
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  const image = useRef<HTMLImageElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const touched = useRef(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ crop: Crop; x: number; y: number; distance: number } | null>(null);
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null);
  const [crop, setCrop] = useState<Crop | null>(null);
  const [suggested, setSuggested] = useState<Crop | null>(null);
  const [detection, setDetection] = useState<Detection>("loading");
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const cropRef = useRef(crop);
  const dimsRef = useRef(dims);
  useEffect(() => {
    cropRef.current = crop;
    dimsRef.current = dims;
  }, [crop, dims]);

  const update = (next: Crop) => {
    const d = dimsRef.current;
    if (!d) return;
    touched.current = true;
    setCrop(clampCrop(next, d.width, d.height));
  };
  // Wheel zoom needs a non-passive listener to keep the page from scrolling.
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      const c = cropRef.current;
      const d = dimsRef.current;
      if (!c || !d) return;
      e.preventDefault();
      touched.current = true;
      setCrop(zoomCrop(c, e.deltaY < 0 ? 1.1 : 1 / 1.1, d.width, d.height));
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, [dims]);

  const distance = () => {
    const [a, b] = [...pointers.current.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };
  const centre = () => {
    const list = [...pointers.current.values()];
    return {
      x: list.reduce((s, p) => s + p.x, 0) / list.length,
      y: list.reduce((s, p) => s + p.y, 0) / list.length,
    };
  };
  const startGesture = () => {
    const c = cropRef.current;
    if (!c) return;
    const m = centre();
    gesture.current = { crop: c, x: m.x, y: m.y, distance: distance() };
  };
  const confirm = () => {
    const img = image.current;
    if (!img || !crop) return;
    setBusy(true);
    const side = outputSize(crop);
    const canvas = document.createElement("canvas");
    canvas.width = side;
    canvas.height = side;
    const ctx = canvas.getContext("2d")!;
    // A transparent PNG becomes a white background in the JPEG.
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, side, side);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, crop.x, crop.y, crop.size, crop.size, 0, 0, side, side);
    canvas.toBlob(
      (blob) => {
        setBusy(false);
        if (!blob) return;
        const base = name.replace(/\.[^.]+$/, "") || "photo";
        onConfirm(new File([blob], `${base}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9,
    );
  };
  const zoom = dims && crop ? Math.min(dims.width, dims.height) / crop.size : 1;
  const status = failed ? t.media.crop.loadFailed : t.media.crop[detection];

  return (
    <Modal
      title={t.media.crop.title}
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <div className="ml-crop">
        <p className="ml-crop-status" role="status">
          {detection === "face" && <ScanFace size={16} aria-hidden />}
          {status}
        </p>
        <div
          ref={frame}
          className="ml-crop-frame"
          tabIndex={0}
          role="group"
          aria-label={t.media.crop.frameLabel}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
            startGesture();
          }}
          onPointerMove={(e) => {
            if (!pointers.current.has(e.pointerId)) return;
            pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
            const g = gesture.current;
            const d = dimsRef.current;
            if (!g || !d) return;
            const scale = g.crop.size / e.currentTarget.getBoundingClientRect().width;
            const m = centre();
            let next = { ...g.crop };
            if (pointers.current.size > 1 && g.distance > 0) next = zoomCrop(next, distance() / g.distance, d.width, d.height);
            update({ ...next, x: next.x - (m.x - g.x) * scale, y: next.y - (m.y - g.y) * scale });
          }}
          onPointerUp={(e) => {
            pointers.current.delete(e.pointerId);
            startGesture();
          }}
          onPointerCancel={(e) => {
            pointers.current.delete(e.pointerId);
            startGesture();
          }}
          onKeyDown={(e) => {
            const c = cropRef.current;
            const d = dimsRef.current;
            if (!c || !d) return;
            const step = c.size * 0.05;
            const moves: Record<string, [number, number]> = {
              ArrowLeft: [-step, 0],
              ArrowRight: [step, 0],
              ArrowUp: [0, -step],
              ArrowDown: [0, step],
            };
            if (moves[e.key]) {
              e.preventDefault();
              update({ ...c, x: c.x + moves[e.key][0], y: c.y + moves[e.key][1] });
            } else if (e.key === "+" || e.key === "=" || e.key === "-") {
              e.preventDefault();
              touched.current = true;
              setCrop(zoomCrop(c, e.key === "-" ? 1 / 1.1 : 1.1, d.width, d.height));
            }
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- local object URL, never optimised */}
          <img
            ref={image}
            src={url}
            alt=""
            draggable={false}
            style={dims && crop ? placement(crop, dims.width) : { visibility: "hidden" }}
            onError={() => {
              setFailed(true);
              setDetection("unavailable");
            }}
            onLoad={(e) => {
              const img = e.currentTarget;
              const d = { width: img.naturalWidth, height: img.naturalHeight };
              setDims(d);
              setCrop(defaultCrop(d.width, d.height));
              findFaces(img)
                .then((faces) => {
                  const found = faceCrop(faces, d.width, d.height);
                  setSuggested(found);
                  setDetection(found ? "face" : "none");
                  if (found && !touched.current) setCrop(found);
                })
                .catch(() => setDetection("unavailable"));
            }}
          />
        </div>
        <label className="ml-crop-zoom">
          {t.media.crop.zoom}
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            disabled={!crop}
            onChange={(e) => {
              const d = dimsRef.current;
              const c = cropRef.current;
              if (!d || !c) return;
              const size = Math.min(d.width, d.height) / Number(e.target.value);
              update({ size, x: c.x + (c.size - size) / 2, y: c.y + (c.size - size) / 2 });
            }}
          />
        </label>
        {dims && crop && (
          <div className="ml-crop-previews" aria-label={t.media.crop.previews}>
            {[96, 52, 36].map((size) => (
              <span key={size} className="ml-crop-preview" style={{ width: size, height: size }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- same local object URL */}
                <img src={url} alt="" draggable={false} style={placement(crop, dims.width)} />
              </span>
            ))}
          </div>
        )}
        <p className="ml-method">
          {t.media.crop.hint} {t.media.crop.privacy}
        </p>
        <div className="ml-actions">
          {suggested && (
            <button
              type="button"
              className="ml-button secondary"
              onClick={() => {
                touched.current = false;
                setCrop(suggested);
              }}
            >
              <ScanFace size={17} aria-hidden />
              {t.media.crop.recenter}
            </button>
          )}
          <button type="button" className="ml-button secondary" onClick={onCancel}>
            {t.cancel}
          </button>
          <button
            type="button"
            className="ml-button"
            disabled={!crop || busy || failed}
            onClick={confirm}
          >
            <Check size={17} aria-hidden />
            {t.media.crop.confirm}
          </button>
        </div>
      </div>
    </Modal>
  );
}

