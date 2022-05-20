import React from "react";
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

// TODO: move it somewhere else
function EmptyState() {
  return (
    <div className="EmptyState">
      <div>
        Choose an assignment to see a preview of what is going to be transferred
      </div>
    </div>
  );
}

export default function GradesTable() {
  return (
    <div>
      <table className="GradesTable">
        <thead>
          <Header />
        </thead>
      </table>
    </div>
  );
}
