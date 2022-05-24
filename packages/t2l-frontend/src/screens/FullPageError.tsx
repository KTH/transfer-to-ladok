import React, { ErrorInfo } from "react";
import { FallbackProps } from "react-error-boundary";
// import { ApiError } from "../hooks/apiClient";
import "./FullPageError.scss";

export default function FullPageError({ error }: FallbackProps) {
  return (
    <div className="FullPageError">
      <header>
        <h1>Invalid course</h1>
        {/* <div>You cannot use Transfer to Ladok in this course</div> */}
      </header>
      <main>
        <p>
          You can only use KTH Transfer to Ladok in official courses or
          examinations. You cannot use it in intern nor sandbox courses.
        </p>
        <p className="small">
          Contact IT-support if you need more help:{" "}
          <a href="mailto:it-support@kth.se">it-support@kth.se</a>
        </p>
      </main>
    </div>
  );
}
