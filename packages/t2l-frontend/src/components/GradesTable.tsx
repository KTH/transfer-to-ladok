import React from "react";
import "./GradesTable.scss";

function GradeRow() {
  return (
    <tr className="row">
      <td className="id">1</td>
      <td className="name">Svensson, Sven</td>
      <td className="grade">C</td>
      <td className="date">2021-01-01</td>
      <td>Will not be transferred</td>
    </tr>
  );
}

export default function GradesTable() {
  return (
    <table className="GradesTable">
      <tbody>
        <GradeRow />
      </tbody>
    </table>
  );
}
