// Requires the local database and `npm run dev`. Uses temporary synthetic rows only.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import nextEnv from "@next/env";
import pg from "pg";

nextEnv.loadEnvConfig(process.cwd(), true);
const url = process.env.DATABASE_URL;
if (!url || !["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname)) {
  throw new Error("Integration checks require a loopback development database.");
}
const base = "http://localhost:3000";
const client = new pg.Client({ connectionString: url });
const ids = [];
const marker = randomUUID();
try {
  await client.connect();
  for (const [status, consent, fields] of [
    ["approved", true, ["location"]], ["approved", true, []],
    ["pending", true, ["location"]], ["hidden", true, ["location"]],
    ["rejected", true, ["location"]], ["approved", false, ["location"]],
  ]) {
    const id = randomUUID();
    ids.push(id);
    await client.query(`insert into members
      (id, full_name, email, role, company, about, skills, location, visibility_status, consent_given, public_fields)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, [
      id, `Test ${id}`, `${id}@example.test`, `SecretRole${marker}`, `SecretCompany${marker}`,
      `SecretAbout${marker}`, [`SecretSkill${marker}`], `PublicLocation${marker}`, status, consent, fields,
    ]);
  }
  const directory = await fetch(`${base}/members`, { redirect: "manual" });
  assert.equal(directory.status, 200);
  const html = await directory.text();
  assert.ok(html.includes(`Test ${ids[0]}`));
  assert.ok(html.includes(`/profile/${ids[0]}`));
  for (const id of ids.slice(1)) assert.ok(!html.includes(`Test ${id}`), "Excluded identity leaked to directory");
  const privateValues = [`SecretRole${marker}`, `SecretCompany${marker}`, `SecretAbout${marker}`, `SecretSkill${marker}`, `${ids[0]}@example.test`];
  for (const value of privateValues) assert.ok(!html.includes(value), "Private value leaked in directory HTML or client payload");

  const home = await fetch(base, { redirect: "manual" });
  assert.equal(home.status, 200);
  const landing = await home.text();
  assert.ok(landing.includes(`/profile/${ids[0]}`), "Public member missing from homepage preview");
  assert.ok(landing.includes('href="/request-access"'), "Homepage must offer access requests");
  assert.ok(landing.includes('href="/members"'), "Homepage must link to public directory");
  assert.ok(landing.includes('href="/join"'), "Existing invitations must remain usable");
  for (const value of privateValues) assert.ok(!landing.includes(value), "Private value leaked to homepage");
  for (const id of ids.slice(1)) assert.ok(!landing.includes(`Test ${id}`), "Excluded identity leaked to homepage");

  for (const prefix of ["/profile/", "/members/"]) {
    const response = await fetch(`${base}${prefix}${ids[0]}`, { redirect: "manual" });
    assert.equal(response.status, 200);
    const profile = await response.text();
    assert.ok(profile.includes(`PublicLocation${marker}`));
    for (const value of privateValues) assert.ok(!profile.includes(value), "Private value leaked to profile");
    for (const id of [...ids.slice(1), "not-a-member-id"]) {
      const hidden = await fetch(`${base}${prefix}${id}`, { redirect: "manual" });
      assert.equal(hidden.status, 404, `${prefix}${id} must return 404`);
    }
  }
  const legacy = await fetch(`${base}/p/${ids[0]}`, { redirect: "manual" });
  assert.equal(legacy.status, 307);
  assert.equal(legacy.headers.get("location"), `/profile/${ids[0]}`);

  let cookies = [];
  async function signedRequest(path, options = {}) {
    const response = await fetch(base + path, { ...options, redirect: "manual", headers: {
      ...options.headers, ...(cookies.length ? { cookie: cookies.join("; ") } : {}),
    } });
    for (const value of response.headers.getSetCookie()) {
      const cookie = value.split(";")[0];
      cookies = cookies.filter((item) => item.split("=")[0] !== cookie.split("=")[0]);
      cookies.push(cookie);
    }
    return response;
  }
  const { csrfToken } = await (await signedRequest("/api/auth/csrf")).json();
  await signedRequest("/api/auth/callback/local-dev", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ csrfToken, account: "member", callbackUrl: `${base}/members`, json: "true" }),
  });
  const session = await (await signedRequest("/api/auth/session")).json();
  assert.equal(session.user?.id, "local-dev-member", "Enable local auth and run db:local:setup first");
  const signedHome = await signedRequest("/");
  assert.equal(signedHome.status, 307);
  assert.equal(signedHome.headers.get("location"), "/vandaag");
  const fullDirectory = await (await signedRequest("/members")).text();
  assert.ok(fullDirectory.includes(`Test ${ids[1]}`), "Approved members must still see non-public members");
  const fullProfile = await (await signedRequest(`/members/${ids[0]}`)).text();
  assert.ok(fullProfile.includes(`SecretRole${marker}`), "Approved members must retain full profiles");
  console.log("Homepage, public directory, field privacy, 404s, legacy links and signed-in access passed.");
} finally {
  if (ids.length) await client.query("delete from members where id = any($1::uuid[])", [ids]);
  await client.end();
}
