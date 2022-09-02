import React from "react";
import {
  RowBefore,
  RowAfter,
  getResultsToBeTransferred,
} from "../utils/getResultsToBeTransferred";
import { Check, Error, Warning } from "../utils/icons";
import "./GradesTable.scss";

function Header() {
  return (
    <tr className="row">
      <th className="transferable">
        <div>&nbsp;</div>
      </th>
      <th className="name">
        <div>Student</div>
      </th>
      <th className="grade">
        <div>Grade</div>
      </th>
      <th className="date">
        <div>Examination date</div>
      </th>
      <th className="status">
        <div>Notes</div>
      </th>
    </tr>
  );
}

function isBefore(result: RowBefore | RowAfter): result is RowBefore {
  return (
    result.status === "not_transferable" || result.status === "transferable"
  );
}

function RowBefore({ result, id }: { result: RowBefore; id: string }) {
  return (
    <tr className={result.status === "not_transferable" ? "dimmed" : ""}>
      <td className="transferable">
        {result.status === "transferable" && <Check />}
      </td>
      <td className="name">{result.student.sortableName}</td>
      <td className="grade">{result.draft?.grade || "-"}</td>
      <td className="date">{result.draft?.examinationDate}</td>
      {result.error && <td className="status">{result.error.message}</td>}
      {result.warning && (
        <td className="status">
          <div>{result.warning.message}</div>
        </td>
      )}
    </tr>
  );
}

function RowAfter({ result, id }: { result: RowAfter; id: string }) {
  return (
    <tr
      className={
        result.status === "error"
          ? "error"
          : result.status === "not_transferred"
          ? "dimmed"
          : ""
      }
    >
      <td className="transferable">
        {result.status === "success" && <Check />}
      </td>
      <td className="name">{result.student.sortableName}</td>
      <td className="grade">{result.draft?.grade}</td>
      <td className="date">{result.draft?.examinationDate}</td>
      {result.status === "error" && result.error && (
        <td className="status">
          <Error />
          <div>Error: {result.error.message}</div>
        </td>
      )}
      {result.status === "not_transferred" && (
        <td className="status">
          <div>Not transferred</div>
        </td>
      )}
    </tr>
  );
}

export function GradesTable({
  results,
}: {
  results: (RowBefore | RowAfter)[];
}) {
  const compareFn = new Intl.Collator("sv").compare;
  const sortedResults = [...results].sort((a, b) =>
    compareFn(a.student.sortableName, b.student.sortableName)
  );

  return (
    <div className="GradesTable">
      <table className="table">
        <thead>
          <Header />
        </thead>
        <tbody>
          {sortedResults.map((r, i) =>
            isBefore(r) ? (
              <RowBefore result={r} id={(i + 1).toString(10)} />
            ) : (
              <RowAfter result={r} id={(i + 1).toString(10)} />
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
