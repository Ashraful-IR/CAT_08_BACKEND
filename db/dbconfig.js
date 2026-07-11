const { MongoClient, ServerApiVersion } = require("mongodb");
const dotenv = require("dotenv");
dotenv.config();

const uri = process.env.DB_URL;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let dbConnection = null;

async function connectdb() {
  if (dbConnection) return dbConnection;
  try {
    await client.connect();
    // Defaulting to "docappoint" or the DB from connection string if configured
    dbConnection = client.db("docappoint");
    console.log("Successfully connected to MongoDB!");
    return dbConnection;
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
}

function getDb() {
  if (!dbConnection) {
    throw new Error("Database not initialized. Call connectdb first.");
  }
  return dbConnection;
}

module.exports = {
  connectdb,
  getDb,
  client,
};
