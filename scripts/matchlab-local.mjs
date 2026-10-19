import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "node:url";
const root = new URL("../", import.meta.url);
process.chdir(fileURLToPath(root));
const command = process.argv[2] || "dev";
if (command === "setup") {
  const status = JSON.parse(
    execFileSync(
      process.execPath,
      ["node_modules/supabase/dist/supabase.js", "status", "-o", "json"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    ),
  );
  if (!/^http:\/\/127\.0\.0\.1:55321$/.test(status.API_URL))
    throw new Error("Only the isolated local MatchLab instance is allowed.");
  mkdirSync(".matchlab-local", { recursive: true });
  const config = {
    MATCHLAB_SUPABASE_URL: status.API_URL,
    MATCHLAB_SUPABASE_ANON_KEY: status.ANON_KEY,
    MATCHLAB_SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
    MATCHLAB_CMS_ENABLED: "true",
  };
  writeFileSync(".matchlab-local/env.json", JSON.stringify(config, null, 2));
  if (!existsSync(".matchlab-local/admin.json")) {
    const admin = createClient(status.API_URL, status.SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
    const email = `direction-${randomBytes(4).toString("hex")}@matchlab.test`;
    const password = randomBytes(24).toString("base64url");
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    const grant = await admin.from("ml_members").insert({
      user_id: data.user.id,
      role: "direction",
      permissions: ["export", "media", "site_editor", "site_publisher"],
    });
    if (grant.error) throw grant.error;
    writeFileSync(
      ".matchlab-local/admin.json",
      JSON.stringify({ email, password, user_id: data.user.id }, null, 2),
    );
  }
  console.log(
    "Local configuration ready. Fictitious administrator credentials: .matchlab-local/admin.json (ignored by Git).",
  );
} else {
  const config = JSON.parse(readFileSync(".matchlab-local/env.json", "utf8"));
  if (!/^http:\/\/127\.0\.0\.1:55321$/.test(config.MATCHLAB_SUPABASE_URL))
    throw new Error("Local host required.");
  // The photo cropper loads its face detection runtime from public/matchlab/mediapipe.
  if (command === "build" || command === "dev")
    execFileSync(process.execPath, ["scripts/copy-mediapipe.mjs"], { stdio: "inherit" });
  if (command === "dev" || command === "start")
    config.MATCHLAB_APP_ORIGIN = `http://127.0.0.1:${process.argv[3] || "3000"}`;
  const args =
    command === "test"
      ? ["--import", "tsx", "tests/matchlab.integration.ts"]
      : command === "build"
        ? ["node_modules/next/dist/bin/next", "build", "--webpack"]
        : [
            "node_modules/next/dist/bin/next",
            command === "start" ? "start" : "dev",
            "--port",
            process.argv[3] || "3000",
            "--hostname",
            "127.0.0.1",
            ...(command === "start" ? [] : ["--webpack"]),
          ];
  const child = spawn(process.execPath, args, {
    stdio: "inherit",
    env: { ...process.env, ...config },
  });
  child.on("exit", (code) => process.exit(code || 0));
}
