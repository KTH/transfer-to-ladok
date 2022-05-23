import React from "react";
import { GradesTable2 } from "../components/GradesTable";
import { TransferredTableRow } from "../utils/getResultsToBeTransferred";

export default function Done({ results }: { results: TransferredTableRow[] }) {
  return (
    <div>
      <header>
        <h1>Transfer completed</h1>
      </header>
      <main>
        <GradesTable2 results={results} />
      </main>
    </div>
  );
}
