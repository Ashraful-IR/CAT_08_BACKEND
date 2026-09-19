const dns = require("dns");
dns.setServers([
  "8.8.8.8",
  "8.8.4.4",
  "0.0.0.0",
  "1.1.1.1",
  "103.129.238.255",
  "192.168.1.1",
]);

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
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

app.use(express.json());

// Route Imports
const registerRoute = require("./src/route/auth/register.route");
const loginRoute = require("./src/route/auth/login.route");
const sessionRoute = require("./src/route/auth/session.route");
const doctorsRoute = require("./src/route/doctors/doctors.route");
const appointmentsRoute = require("./src/route/appointments/appointments.route");
const reviewsRoute = require("./src/route/reviews/reviews.route");
const usersRoute = require("./src/route/users/users.route");

// Register Routes
app.use("/api/auth", registerRoute);
app.use("/api/auth", loginRoute);
app.use("/api/auth", sessionRoute);
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
if (require.main === module) {
  const { connectdb } = require("./db/dbconfig");
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

module.exports = app;
