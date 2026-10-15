import assert from "node:assert/strict";
import { test } from "node:test";
import { toPublicProfile } from "../src/lib/public-profile.ts";

const member = {
  id: "demo-id", full_name: "Public Name", email: "private@example.test", user_id: "private-user",
  role: "Private Role", location: "Amsterdam", skills: ["Private Skill"], about: "Private About",
  public_fields: ["location"], visibility_status: "approved", consent_given: true,
};

test("public projection includes only identity and explicitly selected supported fields", () => {
  assert.deepEqual(toPublicProfile(member), { id: "demo-id", full_name: "Public Name", location: "Amsterdam" });
  assert.deepEqual(toPublicProfile({ ...member, public_fields: ["email", "user_id", "location", "open_to_mentor"] }),
    { id: "demo-id", full_name: "Public Name", location: "Amsterdam" });
  assert.deepEqual(toPublicProfile({ ...member, public_fields: ["skills"] }),
    { id: "demo-id", full_name: "Public Name", skills: ["Private Skill"] });
});

test("private, unapproved and non-consenting profiles are excluded", () => {
  for (const visibility_status of ["pending", "hidden", "rejected", "deactivated"]) {
    assert.equal(toPublicProfile({ ...member, visibility_status }), null);
  }
  assert.equal(toPublicProfile({ ...member, consent_given: false }), null);
  assert.equal(toPublicProfile({ ...member, public_fields: [] }), null);
  assert.equal(toPublicProfile({ ...member, public_fields: ["email"] }), null);
});
