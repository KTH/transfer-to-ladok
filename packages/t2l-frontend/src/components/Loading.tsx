import "./Loading.scss";
import React from "react";
import { Spinner } from "../utils/icons";

export default function Loading() {
  return (
    <div className="Loading">
      <Spinner className="Spinner" />
      <div>Loading...</div>
    </div>
  );
}
