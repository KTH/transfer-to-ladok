import React from "react";
import { GradeWithStatus } from "../../utils/mergeGradesList";

interface DoneStepProps {
  response: GradeWithStatus[];
  onRestart: () => void;
}

export default function DoneStep({ response, onRestart }: DoneStepProps) {
  const successfulResults = response.filter((r) => r.status === "success");
  const failedResults = response.filter((r) => r.status === "error");

  return (
    <div className="c2l2">
      <div
        className={
          failedResults.length === 0
            ? "alert alert-success"
            : "alert alert-info"
        }
        role="alert"
      >
        {successfulResults.length === 0 && (
          <h2>No results were transferred to Ladok</h2>
        )}
        {successfulResults.length > 0 && (
          <h2>
            {successfulResults.length} results transferred successfully to Ladok
          </h2>
        )}
      </div>
      <div>
        {failedResults.length > 0 && (
          <>
            <p>The following grades were not transferred</p>
            <table>
              <thead>
                <th>Student name</th>
                <th>Personal number</th>
                <th>Reason</th>
              </thead>
              <tbody>
                {failedResults.map((r) => (
                  <tr>
                    <td>{r.student.sortableName}</td>
                    <td>{r.student.personalNumber}</td>
                    <td>{r.cause?.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        <button onClick={() => onRestart()}>Start over</button>
      </div>
    </div>
  );
}
