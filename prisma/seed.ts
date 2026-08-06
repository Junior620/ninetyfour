import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "christianouragan@gmail.com";
const ADMIN_NAME = "Christian";

const DEMO_EMAILS = [
  "joueur@ninetyone.demo",
  "parent@ninetyone.demo",
  "coach@ninetyone.demo",
  "admin@ninetyone.demo",
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
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim();

  if (!password || password.length < 8) {
    throw new Error(
      "ADMIN_BOOTSTRAP_PASSWORD is required (min 8 characters) to seed the admin account."
    );
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const listed = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listed.error) throw listed.error;

  const users = listed.data.users ?? [];
  const byEmail = new Map(
    users.map((user) => [user.email?.toLowerCase() ?? "", user])
  );

  // Disable legacy demo accounts
  for (const demoEmail of DEMO_EMAILS) {
    const existing = byEmail.get(demoEmail);
    if (!existing) continue;
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      ban_duration: "876000h",
      app_metadata: {
        ...(existing.app_metadata ?? {}),
        status: "disabled",
        role: existing.app_metadata?.role ?? "player",
      },
      user_metadata: {
        ...(existing.user_metadata ?? {}),
        status: "disabled",
      },
    });
    if (error) {
      console.warn(`Could not disable ${demoEmail}:`, error.message);
    } else {
      console.log(`disabled demo ${demoEmail}`);
    }
  }

  const existingAdmin = byEmail.get(ADMIN_EMAIL.toLowerCase());
  const meta = {
    role: "admin",
    status: "active",
  };

  if (existingAdmin) {
    const { error } = await admin.auth.admin.updateUserById(existingAdmin.id, {
      password,
      email_confirm: true,
      ban_duration: "none",
      app_metadata: { ...existingAdmin.app_metadata, ...meta },
      user_metadata: {
        ...existingAdmin.user_metadata,
        name: ADMIN_NAME,
        ...meta,
      },
    });
    if (error) throw error;
    console.log(`updated admin ${ADMIN_EMAIL}`);
  } else {
    const { error } = await admin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password,
      email_confirm: true,
      app_metadata: meta,
      user_metadata: { name: ADMIN_NAME, ...meta },
    });
    if (error) throw error;
    console.log(`created admin ${ADMIN_EMAIL}`);
  }

  console.log("Auth seed OK — admin bootstrap ready");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
