import { connectdb } from "../db/dbconfig.js";

// Vercel serverless entrypoint: connect to MongoDB (cached across warm
// invocations) and hand the Express app to the platform.
let appPromise = null;

async function getApp() {
  if (!appPromise) {
    appPromise = connectdb()
      .then(() => import("../index.js"))
      .then((mod) => mod.default);
  }
  return appPromise;
}

export default async (req, res) => {
  const app = await getApp();
  return app(req, res);
};
