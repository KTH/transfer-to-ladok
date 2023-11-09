/** @typedef { import("t2l-backend/src/apiHandlers/utils/types").Transference } Transference */
const inquirer = require("inquirer");
const { MongoClient } = require("mongodb");

const LINKS_TO_PORTAL = {
  production:
    "https://portal.azure.com/#@kth.onmicrosoft.com/resource/subscriptions/89badcd9-244a-4255-af4f-bc0d931d3a69/resourceGroups/transfer-to-ladok-prod/providers/Microsoft.DocumentDB/databaseAccounts/transfer-to-ladok-mongodb-kthse/Connection%20strings",
  stage:
    "https://portal.azure.com/#@kth.onmicrosoft.com/resource/subscriptions/89badcd9-244a-4255-af4f-bc0d931d3a69/resourceGroups/transfer-to-ladok-ref/providers/Microsoft.DocumentDB/databaseAccounts/transfer-to-ladok-stage-mongodb-kthse/Connection%20strings",
};

async function start() {
  const { linkToPortal } = await inquirer.prompt({
    type: "list",
    name: "linkToPortal",
    message: "Select the mongo instance to access",
    choices: [
      {
        name: "Production",
        value: LINKS_TO_PORTAL.production,
        short: "prod",
      },
      {
        name: "stage",
        value: LINKS_TO_PORTAL.stage,
        short: "stage",
      },
    ],
  });

  console.log(`Go to ${linkToPortal} and copy the connection string`);

  const { connectionString } = await inquirer.prompt({
    name: "connectionString",
    message: "Go to the URL above and paste here the connection string",
  });

  const client = new MongoClient(connectionString);

  await client.connect();
  const db = client.db("transfer-to-ladok");
  await db.command({ ping: 1 });
  // console.log((await db.collections()).map((c) => c.namespace));
  // return;
  const collection = db.collection("transfers_1.1");
  console.log("Pinged! You successfully connect to MongoDB!");

  const { operation } = await inquirer.prompt({
    type: "list",
    name: "operation",
    message: "What do you want to do?",
    choices: [
      {
        name: "A CSV with the summary of all transfers",
        value: "summary-csv",
      },
      {
        name: "A JSON with one transfer",
        value: "one-json",
      },
    ],
  });

  if (operation === "summary-csv") {
    console.log(
      "This operation will return all transactions in a given range."
    );

    const { startDateString } = await inquirer.prompt({
      type: "input",
      name: "startDateString",
      message: "Input a start date (YYYY-MM-DD) or leave it blank",
    });
    const { endDateString } = await inquirer.prompt({
      type: "input",
      name: "endDateString",
      message: "Input a end date (YYYY-MM-DD) or leave it blank",
    });

    const dateQuery = {};

    if (startDateString) {
      dateQuery["$gte"] = new Date(`${startDateString}T00:00:00Z`);
    }

    if (endDateString) {
      dateQuery["$lt"] = new Date(`${endDateString}T00:00:00Z`);
    }

    const findResult = collection.find({
      // date: dateQuery,
    });

    console.log("Searching...");
    // console.log((await findResult.toArray()).length);
    console.log(["date", "course_id", "user_id", "transfers"].join(","));

    for await (const doc of findResult) {
      /** @type {Transference} */
      const transference = doc;

      console.log(
        [
          transference.createdAt.toISOString(),
          transference.parameters.courseId,
          transference.user.canvasId,
          transference.results.length,
        ].join(",")
      );
    }

    await client.close();
  }
}

start().catch(console.dir);
