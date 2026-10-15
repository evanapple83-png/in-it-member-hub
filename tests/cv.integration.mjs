// Requires local Postgres and npm run dev. Uses temporary identities and deletes its files.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { access, unlink } from "node:fs/promises";
import path from "node:path";
import nextEnv from "@next/env";
import pg from "pg";
import { encode } from "next-auth/jwt";

nextEnv.loadEnvConfig(process.cwd(), true);
if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(process.env.DATABASE_URL).hostname)
  || process.env.CV_BLOB_READ_WRITE_TOKEN) throw new Error("Requires local DB and local CV file storage.");
const base = "http://localhost:3000";
const providers = await (await fetch(`${base}/api/auth/providers`)).json();
assert.ok(providers["local-dev"], "Requires a development server with local auth enabled");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
const ids = [];
const files = new Set();
const pdf = new TextEncoder().encode("%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n");
async function request(route, cookie, options = {}) {
  return fetch(base + route, { ...options, redirect: "manual", headers: { ...options.headers, ...(cookie ? { cookie } : {}) } });
}
function upload(content = pdf, name = "resume.pdf") {
  const form = new FormData();
  form.append("file", new File([content], name, { type: "application/pdf" }));
  return { method: "POST", body: form };
}
try {
  await client.connect();
  const cookies = [];
  for (const role of ["owner", "other", "admin"]) {
    const id = randomUUID();
    ids.push(id);
    const userId = `cv-test-${id}`;
    await client.query(`insert into members (id,user_id,full_name,email,visibility_status,consent_given,onboarding_completed,public_fields)
      values ($1,$2,$3,$4,'approved',true,true,array['role'])`, [id, userId, `CV Test ${role}`, `${id}@example.test`]);
    if (role === "admin") await client.query("insert into admins (user_id,role) values ($1,'admin')", [userId]);
    const token = await encode({ secret: process.env.NEXTAUTH_SECRET, token: { sub: userId, linkedinSub: userId } });
    cookies.push(`next-auth.session-token=${token}`);
  }
  const [owner, other, admin] = cookies;
  const download = `/api/members/${ids[0]}/cv`;
  assert.equal((await request("/api/me/cv", null, upload())).status, 401);
  assert.equal((await request(download)).status, 401);
  assert.equal((await request(download, owner)).status, 404);
  assert.equal((await request("/api/me/cv", owner, upload("not a pdf"))).status, 400);
  assert.equal((await request("/api/me/cv", owner, upload(new Uint8Array(4 * 1024 * 1024 + 1)))).status, 413);
  assert.equal((await request("/api/me/cv", owner, { ...upload(), headers: { origin: "https://other.example" } })).status, 403);

  let response = await request("/api/me/cv", owner, upload());
  assert.equal(response.status, 201);
  const { cv } = await response.json();
  assert.equal(cv.filename, "resume.pdf");
  assert.equal(cv.downloadUrl, download);
  assert.ok(!JSON.stringify(cv).includes("storage"));
  const first = (await client.query("select storage_key from member_cvs where member_id=$1", [ids[0]])).rows[0].storage_key;
  files.add(first);
  await access(path.join(process.cwd(), ".local", first));
  for (const cookie of [owner, admin]) {
    response = await request(download, cookie);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "application/pdf");
    assert.match(response.headers.get("cache-control"), /no-store/);
    assert.match(response.headers.get("content-disposition"), /^attachment;/);
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), pdf);
  }
  assert.equal((await request(download, other)).status, 403);
  const publicPage = await (await request(`/profile/${ids[0]}`)).text();
  assert.ok(!publicPage.includes("resume.pdf"));
  assert.ok(!publicPage.includes(download));
  assert.ok(!publicPage.includes(first));

  response = await request("/api/me/cv", owner, upload(pdf, "replacement.pdf"));
  assert.equal(response.status, 201);
  const second = (await client.query("select storage_key from member_cvs where member_id=$1", [ids[0]])).rows[0].storage_key;
  files.add(second);
  assert.notEqual(first, second);
  await assert.rejects(access(path.join(process.cwd(), ".local", first)));
  await client.query("update members set visibility_status='rejected',consent_given=false,onboarding_completed=false where id=$1", [ids[0]]);
  assert.equal((await request(download, owner)).status, 403);
  assert.equal((await request("/api/me/cv", owner, upload())).status, 403);
  await client.query("update members set visibility_status='approved',consent_given=true,onboarding_completed=true where id=$1", [ids[0]]);
  assert.equal((await request("/api/me/cv", owner, { method: "DELETE" })).status, 200);
  assert.equal((await request(download, owner)).status, 404);
  await assert.rejects(access(path.join(process.cwd(), ".local", second)));

  assert.equal((await request("/api/me/cv", owner, upload())).status, 201);
  const last = (await client.query("select storage_key from member_cvs where member_id=$1", [ids[0]])).rows[0].storage_key;
  files.add(last);
  assert.equal((await request("/api/me", owner, { method: "DELETE" })).status, 200);
  await assert.rejects(access(path.join(process.cwd(), ".local", last)));
  console.log("CV validation, upload, replacement, download permissions, privacy, removal and account cleanup passed.");
} finally {
  const remaining = await client.query("select storage_key from member_cvs where member_id=any($1::uuid[])", [ids]);
  for (const row of remaining.rows) files.add(row.storage_key);
  for (const key of files) {
    if (/^member-cvs\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.pdf$/.test(key)) await unlink(path.join(process.cwd(), ".local", key)).catch(() => {});
  }
  await client.query("delete from admins where user_id=any($1::text[])", [ids.map((id) => `cv-test-${id}`)]);
  await client.query("delete from members where id=any($1::uuid[])", [ids]);
  await client.query("delete from rate_limits where key=any($1::text[])", [ids.map((id) => `cv-upload:cv-test-${id}`)]);
  await client.end();
}
