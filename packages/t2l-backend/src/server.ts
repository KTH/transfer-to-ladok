import express from "express";
import router from "./router";
import sessionMiddleware from "express-session";
import connectMongoDbSession from "connect-mongodb-session";
import { skogMiddleware } from "skog";
import { insightsMiddleware } from "./apiHandlers/utils/applicationInsights";

const MongoDbStore = connectMongoDbSession(sessionMiddleware);

const app = express();
const store = new MongoDbStore({
  uri: process.env.MONGODB_CONNECTION_STRING || "",
  databaseName: "transfer-to-ladok",
  collection: "sessions",

  // Azure Cosmos MongoDB requires an index called "_ts".
  // Read more: https://github.com/mongodb-js/connect-mongodb-session#azure-cosmos-mongodb-support
  expiresKey: "_ts",

  expiresAfterSeconds: 14 * 24 * 3600,
});

app.set("trust proxy", 1);
app.use(express.json());
app.use(express.urlencoded());
app.use(
  sessionMiddleware({
    name: "transfer-to-ladok.sid",
    proxy: true,
    store: store,
    cookie: {
      domain: new URL(process.env.PROXY_HOST || "").hostname,
      maxAge: 14 * 24 * 3600 * 1000,
      httpOnly: true,
      secure: "auto",
      sameSite: "none",
    },

    // Read more: https://www.npmjs.com/package/express-session#resave
    resave: false,

    // Save only sessions when user is authenticated. Setting "saveUnitialized"
    // to "false" prevents creation of sessions when app is accessed via API
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || "",
  })
);
app.use(skogMiddleware);
app.use(insightsMiddleware);
app.use("/transfer-to-ladok", router);

/* Un-comment this section when Transfer to Ladok Frontend is ready for
   production
app.use(
  "/transfer-to-ladok",
  express.static(path.join(__dirname, "../../t2l-frontend/dist"))
);
*/

export default app;
