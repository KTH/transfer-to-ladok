import "./config";
import express from "express";
import router from "./router";
import sessionMiddleware from "express-session";
import log, { skogMiddleware } from "skog";
import path from "path";

const app = express();
const port = 3000;

app.set("trust proxy", 1);
app.use(express.json());
app.use(
  sessionMiddleware({
    name: "transfer-to-ladok.sid",
    proxy: true,
    cookie: {
      domain: "localdev.kth.se",
      maxAge: 3600 * 1000,
      httpOnly: true,
      secure: "auto",
      sameSite: "none",
    },
    resave: true,
    saveUninitialized: true,
    secret: "super secret!",
  })
);
app.use(skogMiddleware);
app.use("/transfer-to-ladok", router);
app.use(
  "/transfer-to-ladok",
  express.static(path.join(__dirname, "../../t2l-frontend/dist"))
);
app.listen(port, () => {
  log.info(`Listening to port ${port}`);
});

export * from "./types";
