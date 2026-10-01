// End-to-end auth smoke test for the Better Auth setup.
//
// Boots the Express app on a random port against the configured DB_URL and
// exercises the real HTTP endpoints:
//   sign-up -> get-session -> compat session -> protected route -> sign-in
//   -> sign-out -> wrong password -> migrated (bcrypt) user sign-in
//
// Creates throwaway users and deletes them in a finally block, so it is safe
// to run against the real database.
//
// Usage: npm run test:auth
//
// Note: Better Auth enforces a trusted Origin on state-changing requests, so
// every POST below sends an Origin header matching CLIENT_URL's default.

import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import app from "../index.js";
import { connectdb, db } from "../db/dbconfig.js";
import { buildMigration } from "./migrate-users.js";

const ORIGIN = "http://localhost:5002";
const email = `smoke_${Date.now()}@example.com`;
const password = "Abcd@1234";
const legacyEmail = `legacy_${Date.now()}@example.com`;
const legacyPassword = "Legacy@123";

const results = [];
const check = (name, ok, detail = "") => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  -- " + detail : ""}`);
};

const jsonPost = (base, path, body, cookie) =>
  fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: ORIGIN,
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });

const cookieFrom = (res) =>
  (res.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");

await connectdb();

const server = app.listen(0);
await new Promise((r) => server.once("listening", r));
const base = `http://127.0.0.1:${server.address().port}`;

try {
  // 1. sign up
  const up = await jsonPost(base, "/api/auth/sign-up/email", {
    name: "Smoke Test",
    email,
    password,
    image: "https://x/y.png",
  });
  const upBody = await up.json();
  const cookie = cookieFrom(up);
  check("sign-up returns 200", up.status === 200, `status=${up.status}`);
  check("sign-up returns user email", upBody?.user?.email === email, upBody?.user?.email);
  check(
    "sign-up sets session cookie",
    cookie.includes("session_token"),
    cookie ? "cookie present" : "no cookie"
  );

  // 2. get-session with cookie
  const gs = await fetch(`${base}/api/auth/get-session`, { headers: { cookie } });
  const gsBody = await gs.json();
  check("get-session returns user", gsBody?.user?.email === email, `status=${gs.status}`);

  // 3. compat /api/auth/session
  const compat = await fetch(`${base}/api/auth/session`, { headers: { cookie } });
  const compatBody = await compat.json();
  check(
    "compat /session returns mapped user",
    compat.status === 200 && compatBody?.user?.photoURL === "https://x/y.png",
    JSON.stringify(compatBody)
  );

  // 4. protected route with cookie
  const mine = await fetch(`${base}/api/appointments/mine`, { headers: { cookie } });
  check("protected /appointments/mine allowed", mine.status === 200, `status=${mine.status}`);

  // 5. protected route without cookie
  const mineNo = await fetch(`${base}/api/appointments/mine`);
  check("protected route rejects anonymous (401)", mineNo.status === 401, `status=${mineNo.status}`);

  // 6. sign in on a fresh cookie
  const signin = await jsonPost(base, "/api/auth/sign-in/email", { email, password });
  check("sign-in returns 200", signin.status === 200, `status=${signin.status}`);
  const signinCookie = cookieFrom(signin);

  // 7. sign out then session is gone
  const out = await jsonPost(base, "/api/auth/sign-out", {}, signinCookie);
  check("sign-out returns 200", out.status === 200, `status=${out.status}`);
  const after = await fetch(`${base}/api/auth/get-session`, { headers: { cookie: signinCookie } });
  const afterBody = await after.json();
  check(
    "session cleared after sign-out",
    afterBody === null || afterBody?.user == null,
    JSON.stringify(afterBody)
  );

  // 8. wrong password rejected
  const bad = await jsonPost(base, "/api/auth/sign-in/email", { email, password: "WrongPass1" });
  check("sign-in rejects wrong password", bad.status >= 400, `status=${bad.status}`);

  // 9. a migrated (bcrypt) credential can sign in
  const legacyDoc = {
    _id: new ObjectId(),
    name: "Legacy User",
    email: legacyEmail,
    photoURL: "https://legacy/pic.png",
    password: await bcrypt.hash(legacyPassword, 10),
    createdAt: new Date(),
  };
  const built = buildMigration(legacyDoc);
  await db.collection("user").insertOne(built.user);
  await db.collection("account").insertMany(built.accounts);

  const legacySignin = await jsonPost(base, "/api/auth/sign-in/email", {
    email: legacyEmail,
    password: legacyPassword,
  });
  check("migrated bcrypt user can sign in", legacySignin.status === 200, `status=${legacySignin.status}`);

  const legacyWrong = await jsonPost(base, "/api/auth/sign-in/email", {
    email: legacyEmail,
    password: "Nope@123",
  });
  check(
    "migrated bcrypt user rejects wrong password",
    legacyWrong.status >= 400,
    `status=${legacyWrong.status}`
  );
} finally {
  // Remove every throwaway user created above.
  try {
    for (const target of [email, legacyEmail]) {
      const user = await db.collection("user").findOne({ email: target });
      if (user) {
        await db.collection("account").deleteMany({ userId: user._id });
        await db.collection("session").deleteMany({ userId: user._id });
        await db.collection("user").deleteOne({ _id: user._id });
        console.log("cleanup: removed test user", target);
      }
    }
  } catch (e) {
    console.log("cleanup failed:", e.message);
  }
  server.close();
}

const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${results.length} checks passed`);
process.exit(passed === results.length ? 0 : 1);
