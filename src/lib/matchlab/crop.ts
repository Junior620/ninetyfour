/** Square crop of a photo, in source pixels. */
export type Crop = { x: number; y: number; size: number };
export type Box = { x: number; y: number; width: number; height: number; score?: number };

/** Smallest square side allowed: a quarter of the short side (4× zoom). */
export const minSize = (width: number, height: number) =>
  Math.max(1, Math.min(width, height) / 4);

/** Keeps the square inside the photo and within the zoom limits. */
export function clampCrop(crop: Crop, width: number, height: number): Crop {
  const size = Math.min(Math.min(width, height), Math.max(minSize(width, height), crop.size));
  return {
    size,
    x: Math.min(Math.max(0, crop.x), width - size),
    y: Math.min(Math.max(0, crop.y), height - size),
  };
}

/** Without a face: the largest square, centred across, slightly high on a portrait photo. */
export function defaultCrop(width: number, height: number): Crop {
  const size = Math.min(width, height);
  return clampCrop(
    { size, x: (width - size) / 2, y: height > width ? (height - size) * 0.3 : (height - size) / 2 },
    width,
    height,
  );
}

/**
 * Head-and-shoulders framing around the most prominent face: a square about 2.4 times
 * the face, the face centre slightly above the middle so the shoulders stay in frame.
 */
export function faceCrop(faces: Box[], width: number, height: number): Crop | null {
  const face = [...faces].sort(
    (a, b) => b.width * b.height * (b.score ?? 1) - a.width * a.height * (a.score ?? 1),
  )[0];
  if (!face || face.width <= 0 || face.height <= 0) return null;
  const size = Math.max(face.width, face.height) * 2.4;
  const cx = face.x + face.width / 2;
  const cy = face.y + face.height / 2;
  return clampCrop({ size, x: cx - size / 2, y: cy - size * 0.42 }, width, height);
}

/** Zoom around the crop centre (factor > 1 zooms in). */
export function zoomCrop(crop: Crop, factor: number, width: number, height: number): Crop {
  const size = crop.size / factor;
  const cx = crop.x + crop.size / 2;
  const cy = crop.y + crop.size / 2;
  return clampCrop({ size, x: cx - size / 2, y: cy - size / 2 }, width, height);
}

/** Output side in pixels: at most 800, never enlarged beyond the source crop (min 256). */
export const outputSize = (crop: Crop) => Math.round(Math.min(800, Math.max(256, crop.size)));
