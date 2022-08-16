import "./config/start";
import log from "skog";
import app from "./server";
// import { mockedServices } from "./mocks/example";

const port = 3000;

// mockedServices.listen();
app.listen(port, () => {
  log.info(`Listening to port ${port}`);
});
