import React from "react";
import "./ProgressBar.scss";

export function IndeterminateProgressBar({ visible }: { visible: boolean }) {
  return (
    <div
      className={["IndeterminateProgressBar", visible ? "visible" : ""].join(
        " "
      )}
    >
      <div className="track"></div>
    </div>
  );
}
