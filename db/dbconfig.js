import { MongoClient, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.DB_URL;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Defaulting to "docappoint" or the DB from connection string if configured.
// This handle is available before an explicit connect: the driver dials the
// server lazily on the first operation, which lets Better Auth build its
// adapter at import time.
const db = client.db("docappoint");

let isConnected = false;

async function connectdb() {
  if (isConnected) return db;
  try {
    await client.connect();
    isConnected = true;
    console.log("Successfully connected to MongoDB!");
    return db;
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
}

function getDb() {
  if (!isConnected) {
    throw new Error("Database not initialized. Call connectdb first.");
  }
  return db;
}

export { connectdb, getDb, client, db };
