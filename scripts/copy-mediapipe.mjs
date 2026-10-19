// Copies the MediaPipe face detection runtime (WebAssembly) next to the site so the
// photo cropper loads it from our own domain. The files are generated, not committed.
import { copyFileSync, mkdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";

const source = path.join("node_modules", "@mediapipe", "tasks-vision", "wasm");
const target = path.join("public", "matchlab", "mediapipe");
const files = [
  "vision_wasm_internal.js",
  "vision_wasm_internal.wasm",
  "vision_wasm_nosimd_internal.js",
  "vision_wasm_nosimd_internal.wasm",
];
if (!existsSync(source)) {
  console.warn("[mediapipe] @mediapipe/tasks-vision is not installed; automatic cropping will be unavailable.");
  process.exit(0);
}
mkdirSync(target, { recursive: true });
for (const file of files) {
  const from = path.join(source, file);
  const to = path.join(target, file);
  if (existsSync(to) && statSync(to).size === statSync(from).size) continue;
  copyFileSync(from, to);
}
console.log(`[mediapipe] runtime ready in ${target}`);
