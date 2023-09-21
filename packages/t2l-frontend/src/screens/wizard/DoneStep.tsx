import React from "react";
import { GradeWithStatus } from "../../utils/mergeGradesList";
import { Button } from "@kth/style";

interface DoneStepProps {
  response: GradeWithStatus[];
  assignment: any;
  destination: any;
  onRestart: () => void;
}

export default function DoneStep({
  response,
  onRestart,
  assignment,
  destination,
}: DoneStepProps) {
  const successfulResults = response.filter((r) => r.status === "success");
  const failedResults = response.filter((r) => r.status === "error");

  return (
    <div>
      {successfulResults.length === 0 && (
        <h2>No results were transferred to Ladok</h2>
      )}
      {successfulResults.length > 0 && (
        <h2>
          <p>
            {successfulResults.length} results transferred successfully to Ladok
          </p>
          <p></p>
        </h2>
      )}

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
      <Button appearance="secondary" onClick={() => onRestart()}>
        Start over
      </Button>
    </div>
  );
}
