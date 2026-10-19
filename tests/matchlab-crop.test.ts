import test from "node:test";
import assert from "node:assert/strict";
import {
  clampCrop,
  defaultCrop,
  faceCrop,
  zoomCrop,
  outputSize,
  minSize,
} from "../src/lib/matchlab/crop";

test("MatchLab crop — a face low in a portrait photo is framed head and shoulders", () => {
  // Portrait 1000×1500, face small at the bottom centre (like a selfie with a busy background).
  const crop = faceCrop([{ x: 450, y: 1100, width: 120, height: 150 }], 1000, 1500)!;
  assert.equal(crop.size, 360);
  assert.equal(crop.x, 330);
  assert.ok(crop.y < 1100 && crop.y + crop.size > 1250, "the whole face is inside");
  assert.ok(crop.y + crop.size <= 1500);
});

test("MatchLab crop — the most prominent face wins and the frame stays inside the photo", () => {
  const crop = faceCrop(
    [
      { x: 10, y: 10, width: 40, height: 40, score: 0.9 },
      { x: 900, y: 20, width: 200, height: 220, score: 0.8 },
    ],
    1200,
    800,
  )!;
  assert.deepEqual(crop, { size: 528, x: 672, y: 0 });
  assert.equal(faceCrop([], 100, 100), null);
});

test("MatchLab crop — default, clamping, zoom limits and output size", () => {
  assert.deepEqual(defaultCrop(1000, 1500), { size: 1000, x: 0, y: 150 });
  assert.deepEqual(defaultCrop(1600, 900), { size: 900, x: 350, y: 0 });
  assert.deepEqual(clampCrop({ x: -50, y: 2000, size: 5000 }, 800, 600), { x: 0, y: 0, size: 600 });
  assert.equal(minSize(800, 600), 150);
  assert.equal(clampCrop({ x: 0, y: 0, size: 10 }, 800, 600).size, 150);
  const zoomed = zoomCrop({ x: 0, y: 0, size: 600 }, 2, 800, 600);
  assert.deepEqual(zoomed, { size: 300, x: 150, y: 150 });
  assert.equal(outputSize({ x: 0, y: 0, size: 3000 }), 800);
  assert.equal(outputSize({ x: 0, y: 0, size: 100 }), 256);
  assert.equal(outputSize({ x: 0, y: 0, size: 512.4 }), 512);
});
