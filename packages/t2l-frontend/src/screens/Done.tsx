import React from "react";
import { GradesTable } from "../components/GradesTable";
import { RowAfter } from "../utils/getResultsToBeTransferred";

export default function Done({ results }: { results: RowAfter[] }) {
  return (
    <div>
      <header>
        <h1>Transfer completed</h1>
      </header>
      <main>
        <GradesTable results={results} />
      </main>
    </div>
  );
}
