const { connectdb } = require("../db/dbconfig");

// Vercel serverless entrypoint: connect to MongoDB (cached across warm
// invocations) and hand the Express app to the platform.
let appPromise = null;

async function getApp() {
  if (!appPromise) {
    appPromise = connectdb().then(() => require("../index"));
  }
  return appPromise;
}

module.exports = async (req, res) => {
  const app = await getApp();
  return app(req, res);
};
