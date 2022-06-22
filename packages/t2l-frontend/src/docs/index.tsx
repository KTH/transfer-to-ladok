import React from "react";
import { render } from "react-dom";
import Hello from "./Example.mdx";

function App2() {
  return <Hello />;
}

render(<App2 />, document.getElementById("root"));
