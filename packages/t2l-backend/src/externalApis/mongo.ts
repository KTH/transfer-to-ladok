import { MongoClient } from "mongodb";
import { Transference } from "../apiHandlers/utils/types";

const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING || "");

let connection: Promise<MongoClient>;

function connectToDatabase() {
  return connection || client.connect();
}

export async function insertTransference(transference: Transference) {
  await connectToDatabase();

  const collection = client
    .db("transfer-to-ladok")
    .collection<Transference>("transfers");

  return collection.insertOne(transference);
}
