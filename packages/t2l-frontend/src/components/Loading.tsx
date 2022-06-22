import "./Loading.scss";
import React from "react";
import { Spinner } from "../utils/icons";

export default function Loading({ children }: { children?: React.ReactNode }) {
  return (
    <div className="Loading">
      <Spinner className="Spinner" />
      <div>{children}</div>
    </div>
  );
}
