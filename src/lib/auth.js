import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { verifyPassword } from "better-auth/crypto";
import bcrypt from "bcryptjs";
import { db } from "../../db/dbconfig.js";

// Origins allowed to hit the auth endpoints (the SPA runs on a different port
// than this API). Mirrors the CORS allow-list in index.js.
const trustedOrigins = [
  "http://localhost:5002",
  "http://127.0.0.1:5002",
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : []),
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",") : []),
  ...(process.env.CLIENT_URLS ? process.env.CLIENT_URLS.split(",") : []),
]
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const uniqueTrustedOrigins = [...new Set(trustedOrigins)];

// The public origin of THIS API. Better Auth uses it to build the Google
// callback ({baseURL}/api/auth/callback/google), set cookie security and
// validate origins. An explicit BETTER_AUTH_URL always wins; otherwise on
// Vercel we fall back to the stable production domain, then the deployment URL.
const resolveBaseUrl = () => {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;

  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercelHost) return `https://${vercelHost}`;

  return undefined;
};

const baseUrl = resolveBaseUrl();

// When this API is served over HTTPS the frontend is usually on a different
// site, so the session cookie must be SameSite=None; Secure (and Partitioned
// for Chrome's third-party-cookie rules). Auto-enabled on HTTPS; override with
// CROSS_SITE_COOKIES="true"/"false".
const crossSiteFlag = process.env.CROSS_SITE_COOKIES?.trim();
const crossSiteCookies = crossSiteFlag
  ? crossSiteFlag === "true"
  : Boolean(baseUrl && baseUrl.startsWith("https://"));

export const auth = betterAuth({
  baseURL: baseUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  database: mongodbAdapter(db),
  emailAndPassword: {
    enabled: true,
    // Previous hand-rolled rule required min 6 chars; Better Auth defaults to 8.
    minPasswordLength: 6,
    password: {
      // New passwords keep Better Auth's default scrypt hashing, but accounts
      // migrated from the old system have bcrypt hashes ($2a/$2b/$2y). Detect
      // those and verify with bcrypt, everything else falls back to scrypt.
      verify: async ({ password, hash }) => {
        if (typeof hash === "string" && /^\$2[aby]\$/.test(hash)) {
          return bcrypt.compare(password, hash);
        }
        return verifyPassword({ password, hash });
      },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      prompt: "select_account",
    },
  },
  ...(crossSiteCookies
    ? {
        advanced: {
          defaultCookieAttributes: {
            sameSite: "none",
            secure: true,
            partitioned: true,
          },
        },
      }
    : {}),
  trustedOrigins: uniqueTrustedOrigins,
});
