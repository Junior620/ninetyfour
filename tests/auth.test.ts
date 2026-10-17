import test from "node:test";
import assert from "node:assert/strict";
import { SignJWT } from "jose";
import {
  readAccountStatus,
  readRoleFromUser,
} from "../src/lib/auth/credentials";
import {
  createSessionToken,
  verifySessionToken,
} from "../src/lib/auth/session-token";

const env = process.env as Record<string, string | undefined>;
const strongSecret = "test-only-secret-0123456789abcdef0123456789";
const session = {
  sub: "user-1",
  email: "coach@example.invalid",
  name: "Coach",
  role: "coach" as const,
};

async function withEnv(
  values: Record<string, string | undefined>,
  run: () => Promise<void>,
) {
  const previous = Object.keys(values).map((name) => [name, env[name]] as const);
  const apply = (entries: readonly (readonly [string, string | undefined])[]) => {
    for (const [name, value] of entries) {
      if (value === undefined) delete env[name];
      else env[name] = value;
    }
  };
  apply(Object.entries(values));
  try {
    await run();
  } finally {
    apply(previous);
  }
}

test("A role written by the user in user_metadata never grants access", () => {
  // Shape of an account created directly with the public anon key (signUp).
  const selfRegistered = {
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: { role: "admin", status: "active" },
  };
  assert.equal(readRoleFromUser(selfRegistered), null);

  const coach = {
    app_metadata: { role: "coach", status: "active" },
    user_metadata: { role: "admin" },
  };
  assert.equal(readRoleFromUser(coach), "coach");
  assert.equal(readRoleFromUser({ app_metadata: { role: "owner" } }), null);
});

test("Account status comes from app_metadata, not user_metadata", () => {
  const pending = {
    app_metadata: { role: "parent", status: "pending" },
    user_metadata: { status: "active" },
  };
  assert.equal(readAccountStatus(pending), "pending");
  const disabled = {
    app_metadata: { role: "player", status: "disabled" },
    user_metadata: { status: "active" },
  };
  assert.equal(readAccountStatus(disabled), "disabled");
});

test("Production refuses a missing, short or published session secret", async () => {
  for (const AUTH_SECRET of [
    undefined,
    "",
    "too-short",
    "change-me-to-a-long-random-string",
    "dev-only-auth-secret-change-me",
  ]) {
    await withEnv({ NODE_ENV: "production", AUTH_SECRET }, async () => {
      await assert.rejects(createSessionToken(session), /AUTH_SECRET/);
    });
  }
});

test("A session forged with the former built-in secret is rejected in production", async () => {
  const forged = await new SignJWT({
    email: "attacker@example.invalid",
    name: "Attacker",
    role: "admin",
    status: "active",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("attacker")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode("dev-only-auth-secret-change-me"));
  for (const AUTH_SECRET of [undefined, strongSecret]) {
    await withEnv({ NODE_ENV: "production", AUTH_SECRET }, async () => {
      assert.equal(await verifySessionToken(forged), null);
    });
  }
});

test("A strong production secret signs and verifies sessions", async () => {
  await withEnv(
    { NODE_ENV: "production", AUTH_SECRET: strongSecret },
    async () => {
      const token = await createSessionToken(session);
      assert.equal((await verifySessionToken(token))?.role, "coach");
    },
  );
});
