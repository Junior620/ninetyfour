import { createClient } from "@supabase/supabase-js";
import { resolveLabConfig } from "../src/lib/matchlab/config.mjs";
const id = process.argv[2];
if (!/^[a-f0-9-]{36}$/.test(id || ""))
  throw new Error(
    "Usage: node --env-file=<dedicated environment> scripts/matchlab-bootstrap.mjs <existing Supabase user UUID>",
  );
const { url, serviceKey: key } = resolveLabConfig(process.env);
if (!url || !key)
  throw new Error("Supabase URL and server service key are required.");
const db = createClient(url, key, { auth: { persistSession: false } });
const existing = await db
  .from("ml_members")
  .select("user_id")
  .eq("role", "direction")
  .eq("active", true);
if (existing.error) throw existing.error;
if (existing.data.length)
  throw new Error(
    "An administrator already exists. Use the audited administration screen.",
  );
const user = await db.auth.admin.getUserById(id);
if (user.error) throw user.error;
const result = await db
  .from("ml_members")
  .insert({
    user_id: id,
    role: "direction",
    active: true,
    permissions: ["export", "media", "site_editor", "site_publisher"],
  });
if (result.error) throw result.error;
await db
  .from("ml_audit")
  .insert({
    user_id: id,
    action: "EXPLICIT_BOOTSTRAP",
    resource: "ml_members",
    resource_id: id,
  });
console.log(
  "Existing identity explicitly habilitated. No password or public role changed.",
);
