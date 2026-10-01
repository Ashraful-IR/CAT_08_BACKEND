import dns from "dns";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";

import { auth } from "./src/lib/auth.js";
import { connectdb } from "./db/dbconfig.js";
import doctorsRoute from "./src/route/doctors/doctors.route.js";
import appointmentsRoute from "./src/route/appointments/appointments.route.js";
import reviewsRoute from "./src/route/reviews/reviews.route.js";
import usersRoute from "./src/route/users/users.route.js";

dns.setServers([
  "8.8.8.8",
  "8.8.4.4",
  "0.0.0.0",
  "1.1.1.1",
  "103.129.238.255",
  "192.168.1.1",
]);

dotenv.config();

const app = express();

const clientOrigins = [
  "http://localhost:5002",
  "http://127.0.0.1:5002",
  "http://192.168.0.171:3000",
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : []),
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",") : []),
  ...(process.env.CLIENT_URLS ? process.env.CLIENT_URLS.split(",") : []),
]
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: clientOrigins,
    credentials: true,
  })
);

// Backwards-compatible alias for the old custom GET /api/auth/session.
// Must be registered before the Better Auth catch-all handler.
app.get("/api/auth/session", async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session || !session.user) {
    return res.status(401).json({ message: "No active session" });
  }

  return res.status(200).json({
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      photoURL: session.user.image,
    },
  });
});

// Better Auth owns everything under /api/auth/* and must be mounted BEFORE
// express.json(), which would otherwise consume the request stream first.
// Express 5 wildcard syntax is `{*name}`.
app.all("/api/auth/{*any}", toNodeHandler(auth));

app.use(express.json());

// Feature routes (auth is fully handled by Better Auth above).
app.use("/api/doctors", doctorsRoute);
app.use("/api/appointments", appointmentsRoute);
app.use("/api/reviews", reviewsRoute);
app.use("/api/users", usersRoute);

// Base route for server health check
app.get("/", (req, res) => {
  res.json({ message: "DocAppoint API server running" });
});

// On Vercel (serverless) the app is exported and handled by the platform;
// locally we connect to the DB first and then start listening.
const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const port = process.env.PORT || 5001;

  connectdb()
    .then(() => {
      app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
      });
    })
    .catch((err) => {
      console.error("Failed to start server due to DB connection error:", err);
      process.exit(1);
    });
}

export default app;
