import React from "react";
import "./Done.scss";
import { GradesTable } from "../components/GradesTable";
import { RowAfter } from "../utils/getResultsToBeTransferred";

export default function Done({
  ladokUrl = "",
  results,
}: {
  ladokUrl: string;
  results: RowAfter[];
}) {
  return (
    <div className="Done">
      <header>
        <h1>Transfer completed</h1>
        <p>
          Now can you{" "}
          <a href={ladokUrl} target="_blank">
            go to Ladok to see the results
          </a>{" "}
          or go back to transfer more results
        </p>
      </header>
      <main className="main">
        <GradesTable results={results} />
      </main>
    </div>
  );
}
