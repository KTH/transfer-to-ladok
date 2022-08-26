import React from "react";
import "./Unauthenticated.scss";

/** Screen shown when the user is not logged in */
export default function Unauthenticated() {
  const courseId = new URLSearchParams(location.search).get("courseId");

  if (!courseId) {
    throw new Error("No course ID!");
  }

  return (
    <div className="container">
      <h1>KTH Transfer to Ladok</h1>
      <p>
        This application has been developed with the intent to enable a secure
        digital transfer of grades from Canvas Gradebook to Ladok and hopefully
        also reduce the amount of manual grade administration.
      </p>
      <div>
        <a
          className="btn-primary"
          href={`/transfer-to-ladok/auth?courseId=${courseId}`}
        >
          Launch the application
        </a>
        <p>In the next step, you need to authorize the app</p>
      </div>
    </div>
  );
}
