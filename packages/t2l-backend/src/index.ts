import express from "express";
import router from "./router";
import sessionMiddleware from "express-session";

const app = express();
const port = 3000;

app.use(sessionMiddleware());
app.use("/transfer-to-ladok", router);
app.listen(port, () => {
  console.log(`Listening to port ${port}`);
});
