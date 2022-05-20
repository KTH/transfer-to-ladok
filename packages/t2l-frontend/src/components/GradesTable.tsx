import React from "react";
import { TransferableResult } from "../utils/getResultsToBeTransferred";
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

function Status({ result }: { result: TransferableResult }) {
  return <div>{result.message}</div>;
}

function Row({ result, id }: { result: TransferableResult; id: string }) {
  return (
    <tr className="row" style={{ opacity: result.transferrable ? 1 : 0.6 }}>
      <td className="id">{id}</td>
      <td className="name">{result.student.sortableName}</td>
      <td className="grade">{result.draft?.grade}</td>
      <td className="date">{result.draft?.examinationDate}</td>
      <td>
        <Status result={result} />
      </td>
    </tr>
  );
}

export default function GradesTable({
  results,
}: {
  results: TransferableResult[];
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
          {sortedResults.map((r, i) => (
            <Row result={r} id={(i + 1).toString(10)} />
          ))}
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
