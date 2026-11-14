import test from "node:test";
import assert from "node:assert/strict";
import {
  credential,
  originAllowed,
  nativeOriginAllowed,
} from "../src/lib/matchlab/bearer";

const site = "https://www.example.test";
const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1In0.c2lnbmF0dXJl";
const h = (values: Record<string, string>) => new Headers(values);

test("no Authorization header keeps the cookie path", () => {
  assert.deepEqual(credential(h({})), { kind: "cookie" });
});

test("a well-formed Bearer JWT is read as the mobile credential", () => {
  assert.deepEqual(credential(h({ authorization: `Bearer ${jwt}` })), {
    kind: "bearer",
    token: jwt,
  });
});

test("a malformed Authorization header is refused, never treated as a cookie", () => {
  for (const value of [
    "Bearer",
    "Bearer ",
    "Basic dXNlcjpwYXNz",
    "Bearer not-a-jwt",
    `Bearer ${jwt} extra`,
    `bearer ${jwt}`,
    `Bearer ${"a".repeat(5000)}.${"b".repeat(5000)}.c`,
  ])
    assert.equal(credential(h({ authorization: value })).kind, "invalid", value);
});

test("cookie requests still need the exact Origin", () => {
  assert.equal(originAllowed(h({ origin: site }), site), true);
  assert.equal(originAllowed(h({}), site), false);
  assert.equal(originAllowed(h({ origin: "https://evil.test" }), site), false);
  assert.equal(
    originAllowed(h({ origin: site, "sec-fetch-site": "cross-site" }), site),
    false,
  );
});

test("Bearer requests from the app need no Origin", () => {
  assert.equal(originAllowed(h({ authorization: `Bearer ${jwt}` }), site), true);
});

test("an invalid Bearer header falls back to the strict Origin rule", () => {
  assert.equal(
    originAllowed(h({ authorization: "Bearer nope" }), site),
    false,
  );
});

test("token login accepts a native client but refuses a foreign web page", () => {
  assert.equal(nativeOriginAllowed(h({}), site), true);
  assert.equal(nativeOriginAllowed(h({ origin: site }), site), true);
  assert.equal(
    nativeOriginAllowed(h({ origin: "https://evil.test" }), site),
    false,
  );
  assert.equal(
    nativeOriginAllowed(h({ "sec-fetch-site": "cross-site" }), site),
    false,
  );
});
