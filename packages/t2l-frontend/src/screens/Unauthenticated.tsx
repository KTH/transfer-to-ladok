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
      <h2>How do I start using the application?</h2>
      <p>
        If you have not used this application before, please read the
        instructions for this application in{" "}
        <a
          href="https://intra.kth.se/en/utbildning/systemstod/canvas/guider/omdomen/overfora-till-ladok-1.1035780"
          target="_blank"
          rel="noreferrer noopener"
        >
          KTH Intranet
        </a>{" "}
        carefully. Click the button at the bottom of this page to launch the
        application.
      </p>
      <h2>Important to notice</h2>
      <ol>
        <li>
          The application can transfer letter grades from a column in Canvas
          Gradebook to draft status for a Ladok module. In the next step, you
          will have to select which column in Canvas Gradebook that should be
          transferred to which Ladok module. Make sure that the column in Canvas
          Gradebook contains the allowed letter grades for the Ladok module.
        </li>
        <li>
          Grades that have been marked as ready and certified will not be
          transferred to Ladok, except for F or Fx. Be wary when you want to
          transfer grades for the second time (e.g. after a re-exam) for a Ladok
          module.
        </li>
      </ol>
      <p>
        <em>
          Is something not working as expected?{" "}
          <a href="mailto:it-support@kth.se">Contact IT support!</a>
        </em>
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
