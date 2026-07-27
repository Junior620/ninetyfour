import { createClient } from "@supabase/supabase-js";
import type { UserRole } from "../src/types";

const DEFAULT_PASSWORD = process.env.PRIVATE_SPACE_PASSWORD?.trim() || "nofa2026";

const USERS: Array<{
  email: string;
  name: string;
  role: UserRole;
}> = [
  {
    email: "joueur@ninetyone.demo",
    name: "Kofi Mensah",
    role: "player",
  },
  {
    email: "parent@ninetyone.demo",
    name: "M. Mensah",
    role: "parent",
  },
  {
    email: "coach@ninetyone.demo",
    name: "Coach Martin",
    role: "coach",
  },
  {
    email: "admin@ninetyone.demo",
    name: "Admin NOFA",
    role: "admin",
  },
];

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const listed = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listed.error) {
    throw listed.error;
  }

  const byEmail = new Map(
    (listed.data.users ?? []).map((user) => [user.email?.toLowerCase() ?? "", user])
  );

  for (const account of USERS) {
    const existing = byEmail.get(account.email.toLowerCase());

    if (existing) {
      const { error } = await admin.auth.admin.updateUserById(existing.id, {
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        app_metadata: { role: account.role },
        user_metadata: { name: account.name, role: account.role },
      });
      if (error) throw error;
      console.log(`updated ${account.email} (${account.role})`);
      continue;
    }

    const { error } = await admin.auth.admin.createUser({
      email: account.email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      app_metadata: { role: account.role },
      user_metadata: { name: account.name, role: account.role },
    });
    if (error) throw error;
    console.log(`created ${account.email} (${account.role})`);
  }

  console.log(
    `Auth seed OK — password: ${DEFAULT_PASSWORD === "nofa2026" ? "nofa2026" : "***"}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
