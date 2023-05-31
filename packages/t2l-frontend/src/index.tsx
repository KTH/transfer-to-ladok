import "./index.scss";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// if (process.env.NODE_ENV === "development") {
//   const { worker } = require("./mocks/browser");
//   worker.start({
//     serviceWorker: {
//       url: "/transfer-to-ladok/mockServiceWorker.js",
//     },
//   });
// }

const domNode = document.getElementById("root");
const root = createRoot(domNode!);
root.render(<App />);
