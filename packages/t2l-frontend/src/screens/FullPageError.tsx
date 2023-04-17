import React from "react";
import { FallbackProps } from "react-error-boundary";
import { ApiError, InvalidCourseError } from "../utils/errors";
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

  if (error instanceof ApiError) {
    if (error.code === "forbidden") {
      return (
        <div className="FullPageError">
          <header>
            <h1>You are not allowed to use Transfer to Ladok</h1>
          </header>
          <main>
            <p>{error.message}</p>
            <p className="small">
              Please try again later or contact{" "}
              <a href="mailto:it-support@kth.se">it-support@kth.se</a> and
              provide the message above.
            </p>
          </main>
        </div>
      );
    }

    return (
      <div className="FullPageError">
        <header>
          <h1>
            Error {error.code} ({error.message})
          </h1>
        </header>
        <main>
          <p>
            Something unexpected happened when fetching the endpoint{" "}
            <code>{error.endpoint}</code>
          </p>
          <p className="small">
            Please try again later or contact{" "}
            <a href="mailto:it-support@kth.se">it-support@kth.se</a> and provide
            the message above.
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
