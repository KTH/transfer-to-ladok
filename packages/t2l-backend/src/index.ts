import express from "express";
import router from "./router";

const app = express();
app.use("/transfer-to-ladok", router);
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Listening to port ${port}`);
});
