import assert from "node:assert/strict";
import { test } from "node:test";
import { isLocalDevAuthEnabled } from "../src/lib/local-dev-auth.ts";

test("local login is opt-in and cannot be enabled in a deployment", () => {
  const saved = { ...process.env };
  try {
    delete process.env.VERCEL;
    Object.assign(process.env, {
      NODE_ENV: "development",
      LOCAL_DEV_AUTH: "true",
      DATABASE_URL: "postgresql://init:password@127.0.0.1:5433/demo",
      NEXTAUTH_URL: "http://localhost:3000",
    });
    assert.equal(isLocalDevAuthEnabled(), true);
    for (const [key, value] of [
      ["NODE_ENV", "production"],
      ["NODE_ENV", "test"],
      ["LOCAL_DEV_AUTH", "false"],
      ["VERCEL", "1"],
      ["DATABASE_URL", "postgresql://user:password@remote.example/demo"],
      ["NEXTAUTH_URL", "https://example.com"],
      ["DATABASE_URL", "invalid"],
      ["NEXTAUTH_URL", ""],
    ]) {
      const previous = process.env[key];
      process.env[key] = value;
      assert.equal(isLocalDevAuthEnabled(), false, `${key}=${value} must disable local login`);
      if (previous === undefined) delete process.env[key];
      else process.env[key] = previous;
    }
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  }
});
