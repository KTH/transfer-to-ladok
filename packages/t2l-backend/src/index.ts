import "./config";
import express from "express";
import router from "./router";
// import sessionMiddleware from "express-session";
import log, { skogMiddleware } from "skog";

const app = express();
const port = 3000;

// app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// app.use(sessionMiddleware());
app.use(skogMiddleware);
app.use("/transfer-to-ladok", router);
app.listen(port, () => {
  console.log(`Listening to port ${port}`);
});
