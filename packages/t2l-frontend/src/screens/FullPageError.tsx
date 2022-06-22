import React from "react";
import { FallbackProps } from "react-error-boundary";
import { InvalidCourseError } from "../utils/errors";
import "./FullPageError.scss";

export default function FullPageError({ error }: FallbackProps) {
  if (error instanceof InvalidCourseError) {
    return (
      <div className="FullPageError">
        <header>
          <h1>{error.message}</h1>
        </header>
        <main>
          <p>{error.details}</p>
          <p className="small">
            Contact IT-support if you need more help:{" "}
            <a href="mailto:it-support@kth.se">it-support@kth.se</a>
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="FullPageError">
      <header>
        <h1>Unknown error: {error.name}</h1>
      </header>
      <main>
        <p>{error.message}</p>
        <p className="small">
          Contact IT-support if you need more help:{" "}
          <a href="mailto:it-support@kth.se">it-support@kth.se</a>
        </p>
      </main>
    </div>
  );
}
