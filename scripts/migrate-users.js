// Migrates users from the legacy `users` collection (hand-rolled auth) into
// Better Auth's `user` + `account` collections.
//
// - Reuses each user's existing ObjectId so nothing else needs to be remapped.
// - Copies bcrypt password hashes into a `credential` account; src/lib/auth.js
//   is configured to verify bcrypt hashes, so existing passwords keep working.
// - Copies `googleId` into a `google` account when present.
// - Idempotent: users whose email already exists in `user` are skipped.
//
// Usage:
//   node scripts/migrate-users.js --dry-run   # preview, write nothing
//   node scripts/migrate-users.js             # perform the migration

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";

dotenv.config();

const DB_NAME = process.env.DB_NAME || "docappoint";
const OLD_USERS = "users";
const NEW_USERS = "user";
const ACCOUNTS = "account";

const toObjectId = (value) => {
  if (value instanceof ObjectId) return value;
  if (typeof value === "string" && ObjectId.isValid(value)) {
    return new ObjectId(value);
  }
  return null;
};

// Pure transform: legacy user doc -> Better Auth user + account docs.
// Returns null when the legacy document is unusable (no email).
const buildMigration = (oldUser, now = new Date()) => {
  const email =
    typeof oldUser.email === "string" ? oldUser.email.trim().toLowerCase() : "";
  if (!email) return null;

  const id = toObjectId(oldUser._id) || new ObjectId();
  const createdAt = oldUser.createdAt instanceof Date ? oldUser.createdAt : now;

  const user = {
    _id: id,
    name: oldUser.name || email.split("@")[0],
    email,
    emailVerified: true,
    image: oldUser.photoURL || oldUser.image || null,
    createdAt,
    updatedAt: now,
  };

  const accounts = [];

  if (oldUser.password) {
    accounts.push({
      _id: new ObjectId(),
      accountId: id.toString(),
      providerId: "credential",
      userId: id,
      password: oldUser.password,
      createdAt,
      updatedAt: now,
    });
  }

  if (oldUser.googleId) {
    accounts.push({
      _id: new ObjectId(),
      accountId: String(oldUser.googleId),
      providerId: "google",
      userId: id,
      createdAt,
      updatedAt: now,
    });
  }

  return { user, accounts };
};

async function main() {
  const uri = process.env.DB_URL;
  if (!uri) {
    console.error("DB_URL is not set. Add it to your .env before migrating.");
    process.exit(1);
  }

  const dryRun = process.argv.includes("--dry-run");
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    console.log(
      `Connected to "${DB_NAME}"${dryRun ? " (dry run — no writes)" : ""}`
    );

    const oldUsers = await db.collection(OLD_USERS).find({}).toArray();
    const users = db.collection(NEW_USERS);
    const accounts = db.collection(ACCOUNTS);

    let migrated = 0;
    let skipped = 0;
    let invalid = 0;
    let credentialAccounts = 0;
    let googleAccounts = 0;

    for (const oldUser of oldUsers) {
      const built = buildMigration(oldUser);

      if (!built) {
        invalid++;
        console.warn(`Skipping legacy user ${oldUser._id}: missing email`);
        continue;
      }

      const existing = await users.findOne({ email: built.user.email });
      if (existing) {
        skipped++;
        continue;
      }

      if (!dryRun) {
        await users.insertOne(built.user);
        if (built.accounts.length) {
          await accounts.insertMany(built.accounts);
        }
      }

      migrated++;
      credentialAccounts += built.accounts.filter(
        (a) => a.providerId === "credential"
      ).length;
      googleAccounts += built.accounts.filter(
        (a) => a.providerId === "google"
      ).length;
    }

    console.log("\n--- Migration summary ---");
    console.log(`Legacy users scanned : ${oldUsers.length}`);
    console.log(`Migrated             : ${migrated}`);
    console.log(`  credential accounts: ${credentialAccounts}`);
    console.log(`  google accounts    : ${googleAccounts}`);
    console.log(`Skipped (already in) : ${skipped}`);
    console.log(`Skipped (no email)   : ${invalid}`);

    if (dryRun) {
      console.log("\nDry run complete — re-run without --dry-run to apply.");
    }
  } catch (error) {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  main();
}

export { buildMigration, toObjectId };
