import React from "react";
import { RowBefore, RowAfter } from "../utils/getResultsToBeTransferred";
import "./GradesTable.scss";

function Header() {
  return (
    <tr className="row">
      <th className="id">#</th>
      <th className="name">Student</th>
      <th className="grade">Grade</th>
      <th className="date">Examination date</th>
      <th></th>
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
    <tr
      className="row"
      style={{ opacity: result.status === "transferable" ? 1 : 0.6 }}
    >
      <td className="id">{id}</td>
      <td className="name">{result.student.sortableName}</td>
      <td className="grade">{result.draft?.grade}</td>
      <td className="date">{result.draft?.examinationDate}</td>
      <td>{result.error?.message ?? result.warning?.message}</td>
    </tr>
  );
}

function RowAfter({ result, id }: { result: RowAfter; id: string }) {
  return (
    <tr
      className="row"
      style={{
        opacity: result.status !== "not_transferred" ? 1 : 0.6,
        backgroundColor: result.status === "error" ? "#FFF0F0" : "",
      }}
    >
      <td className="id">{id}</td>
      <td className="name">{result.student.sortableName}</td>
      <td className="grade">{result.draft?.grade}</td>
      <td className="date">{result.draft?.examinationDate}</td>
      <td>{result.error?.message ?? result.warning?.message}</td>
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

  const [expanded, setExpanded] = React.useState(sortedResults.length < 7);

  return (
    <div className={["GradesTable", expanded && "expanded"].join(" ")}>
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
      <div className="show-all">
        <button className="secondary" onClick={() => setExpanded(true)}>
          Show all
        </button>
      </div>
    </div>
  );
}
