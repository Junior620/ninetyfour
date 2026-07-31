import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const key = process.env.INDEXNOW_KEY?.trim();
if (!key) {
  console.log("INDEXNOW_KEY not set — skip key file.");
  process.exit(0);
}

if (!/^[a-zA-Z0-9-]{8,128}$/.test(key)) {
  console.error("INDEXNOW_KEY format invalid");
  process.exit(1);
}

const publicDir = join(process.cwd(), "public");
mkdirSync(publicDir, { recursive: true });
const file = join(publicDir, `${key}.txt`);
writeFileSync(file, key, "utf8");
console.log(`Wrote ${file}`);
