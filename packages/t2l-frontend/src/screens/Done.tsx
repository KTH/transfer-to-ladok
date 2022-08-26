import React from "react";
import "./Done.scss";
import { GradesTable } from "../components/GradesTable";
import { RowAfter } from "../utils/getResultsToBeTransferred";
import { ArrowLeft } from "../utils/icons";

export default function Done({
  ladokUrl = "",
  results,
}: {
  ladokUrl: string;
  results: RowAfter[];
}) {
  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;
  const notAttemptedCount = results.filter(
    (r) => r.status === "not_transferred"
  ).length;
  const notTransferredCount = errorCount + notAttemptedCount;

  return (
    <div className="Done">
      <header>
        <h1>Transfer completed</h1>
      </header>
      <main className="main">
        <header className="summary">
          Summary:{" "}
          {successCount > 0 &&
            `${successCount} results were successfully transferered. `}
          {notTransferredCount > 0 &&
            `${notTransferredCount} results were not transferred `}
          {errorCount > 0 && `(${errorCount} of them with errors)`}
        </header>
        <GradesTable results={results} />
      </main>
      <footer>
        <p>
          <a href={ladokUrl} target="_blank">
            Go to Ladok to see the results.
          </a>{" "}
          From there you can continue the process: mark grades as ready (
          <em>klarmarkera</em>), certify (<em>attestera</em>) and make any other
          adjustments
        </p>

        <button className="btn-secondary with-icon">
          <ArrowLeft />
          <div className="label">Start over</div>
        </button>
      </footer>
    </div>
  );
}
