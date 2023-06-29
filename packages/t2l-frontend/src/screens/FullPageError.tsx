import React from "react";
import { FallbackProps } from "react-error-boundary";
import {
  ApiError,
  InvalidCourseError,
  NotAuthorizeError,
} from "../utils/errors";
import "./FullPageError.scss";

export default function FullPageError({ error }: FallbackProps) {
  if (error instanceof NotAuthorizeError) {
    return (
      <div className="FullPageError">
        <header>
          <h1>{error.message}</h1>
          <main>
            <p>{error.details}</p>
            <p className="small">
              Contact IT-support if you need more help:{" "}
              <a href="mailto:it-support@kth.se">it-support@kth.se</a>
            </p>
          </main>
        </header>
      </div>
    );
  }
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
            <h1>Not allowed to transfer grades to Ladok</h1>
          </header>
          <main>
            <p>{error.message}</p>
            <p className="small">
              Read more about{" "}
              <a href="https://intra.kth.se/en/utbildning/systemstod/ladok/anvandarutbildningar-1.971219">
                User traning Ladok at KTH intranet
              </a>{" "}
              or contact{" "}
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
