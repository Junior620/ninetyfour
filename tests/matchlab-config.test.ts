import test from "node:test";
import assert from "node:assert/strict";
import { resolveLabConfig } from "../src/lib/matchlab/config.mjs";

const site = {
  NEXT_PUBLIC_SUPABASE_URL: "https://site.example.test",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "site-anon",
  SUPABASE_SERVICE_ROLE_KEY: "site-service",
};
const local = {
  MATCHLAB_SUPABASE_URL: "http://127.0.0.1:55321",
  MATCHLAB_SUPABASE_ANON_KEY: "local-anon",
  MATCHLAB_SUPABASE_SERVICE_ROLE_KEY: "local-service",
};

test("MatchLab reuses the site's existing Supabase configuration", () => {
  assert.deepEqual(resolveLabConfig(site), {
    url: site.NEXT_PUBLIC_SUPABASE_URL,
    key: site.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceKey: site.SUPABASE_SERVICE_ROLE_KEY,
  });
});

test("MatchLab local overrides keep every credential isolated from the site", () => {
  assert.deepEqual(resolveLabConfig({ ...site, ...local }), {
    url: local.MATCHLAB_SUPABASE_URL,
    key: local.MATCHLAB_SUPABASE_ANON_KEY,
    serviceKey: local.MATCHLAB_SUPABASE_SERVICE_ROLE_KEY,
  });
});

test("Incomplete dedicated configuration never falls back to another project", () => {
  for (const [name, value] of Object.entries(local)) {
    const resolved = resolveLabConfig({ ...site, [name]: value });
    assert.deepEqual(resolved, {
      url: name === "MATCHLAB_SUPABASE_URL" ? value : undefined,
      key: name === "MATCHLAB_SUPABASE_ANON_KEY" ? value : undefined,
      serviceKey:
        name === "MATCHLAB_SUPABASE_SERVICE_ROLE_KEY" ? value : undefined,
    });
  }
  assert.equal(
    resolveLabConfig({
      ...site,
      MATCHLAB_SUPABASE_URL: local.MATCHLAB_SUPABASE_URL,
      MATCHLAB_SUPABASE_ANON_KEY: local.MATCHLAB_SUPABASE_ANON_KEY,
    }).serviceKey,
    undefined,
  );
});

test("Missing credentials remain missing and empty overrides are ignored", () => {
  assert.deepEqual(resolveLabConfig({}), {
    url: undefined,
    key: undefined,
    serviceKey: undefined,
  });
  assert.equal(
    resolveLabConfig({ NEXT_PUBLIC_SUPABASE_URL: site.NEXT_PUBLIC_SUPABASE_URL })
      .key,
    undefined,
  );
  assert.deepEqual(
    resolveLabConfig({
      ...site,
      MATCHLAB_SUPABASE_URL: "  ",
      MATCHLAB_SUPABASE_ANON_KEY: "",
    }),
    resolveLabConfig(site),
  );
});

test("Public anon credentials never become the privileged service key", () => {
  const resolved = resolveLabConfig({
    NEXT_PUBLIC_SUPABASE_URL: site.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: site.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  assert.equal(resolved.key, site.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  assert.equal(resolved.serviceKey, undefined);
});
