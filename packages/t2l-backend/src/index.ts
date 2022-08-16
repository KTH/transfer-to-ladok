import "./config/start";
import log from "skog";
import app from "./server";

const port = 3000;

app.listen(port, () => {
  log.info(`Listening to port ${port}`);
});
