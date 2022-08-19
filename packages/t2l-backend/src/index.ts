import "./config/start";
import log from "skog";
import app from "./server";
// import { mockedServices } from "./mocks/example";
import * as appInsights from "applicationinsights";

const port = 3000;

// mockedServices.listen({ onUnhandledRequest: "bypass" });
appInsights.setup();
app.listen(port, () => {
  log.info(`Listening to port ${port}`);
});
