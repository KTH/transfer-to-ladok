import React from "react";
import { PostLadokGradesOutput } from "t2l-backend";

interface DoneStepProps {
  response: PostLadokGradesOutput;
  onRestart: () => void;
}

export default function DoneStep({ response, onRestart }: DoneStepProps) {
  return (
    <div>
      {response.summary.success === 0 && (
        <h2>No results were transferred to Ladok</h2>
      )}
      {response.summary.success > 0 && (
        <h2>
          {response.summary.success} results transferred successfully to Ladok
        </h2>
      )}

      {response.summary.error > 0 && (
        <>
          <p>The following grades were not transferred</p>
          <table>
            <thead>
              <th>Student</th>
              <th>Reason</th>
            </thead>
            <tbody>
              {response.results
                .filter((r) => r.status === "error")
                .map((r) => (
                  <tr>
                    <td>{r.id}</td>
                    <td>{r.error?.message}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </>
      )}
      <button onClick={() => onRestart()}>Start over</button>
    </div>
  );
}
