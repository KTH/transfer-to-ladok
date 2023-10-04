import { MongoClient } from "mongodb";
import logger from "skog";
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
    .collection<Transference>("transfers_1.1");

  const result = collection.insertOne(transference);
  logger.info(
    `inserted the following document into the DB for traceability: {_id: "${transference._id}"}`
  );
  return result;
}
