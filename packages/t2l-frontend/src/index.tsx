import "./index.scss";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const domNode = document.getElementById("root");
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(domNode!);
root.render(<App />);
