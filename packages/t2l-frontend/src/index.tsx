import "./index.scss";
import React from "react";
import { render } from "react-dom";
import App from "./App";

// if (process.env.NODE_ENV === "development") {
//   const { worker } = require("./mocks/browser");
//   worker.start({
//     serviceWorker: {
//       url: "/transfer-to-ladok/mockServiceWorker.js",
//     },
//   });
// }

render(<App />, document.getElementById("root"));
