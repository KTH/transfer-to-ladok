import React, { useState } from "react";
import { GradesDestination } from "t2l-backend/src/types";
import { GradesTable } from "../components/GradesTable";
import { useCanvasGrades, useGradeableStudents } from "../hooks/apiClient";
import { getResultsToBeTransferred } from "../utils/getResultsToBeTransferred";
import { ArrowRight } from "../utils/icons";
import { IndeterminateProgressBar } from "../components/ProgressBar";
import AssignmentSelector from "../components/AssignmentSelector";
import "./Preview.scss";
import { SendGradesInput } from "../hooks/useSendGrades";

export default function Preview({
  destinationName,
  destination,
  onSubmit,
}: {
  destinationName: string;
  destination: GradesDestination;
  onSubmit(results: SendGradesInput): void;
}) {
  const [assignmentId, setAssignmentId] = useState<string>("");

  const ladokGradesQuery = useGradeableStudents(destination);
  const canvasGradesQuery = useCanvasGrades(assignmentId);

  const tableContent = getResultsToBeTransferred(
    canvasGradesQuery.data ?? [],
    ladokGradesQuery.data ?? []
  );

  return (
    <div className="Preview">
      <header>
        <div>Select a Canvas assignment to transfer to the Ladok module</div>
        <div className="assignment">
          <AssignmentSelector value={assignmentId} onChange={setAssignmentId} />
          <ArrowRight />
          <div className="destination">{destinationName}</div>
        </div>
        <div className="date-selection">
          <div className="label">Options for examination date</div>
          <ul className="options">
            <li>
              <input type="radio" id="D" />
              <label htmlFor="D">Same as submission date in assignment</label>
            </li>
            <li>
              <input type="radio" id="E" />
              <label htmlFor="E">Manual input</label>
            </li>
          </ul>
        </div>
      </header>
      <main className="main">
        <IndeterminateProgressBar visible={canvasGradesQuery.isFetching} />
        <GradesTable results={tableContent} />
        {assignmentId === "" && (
          <div className="empty-state">
            <div>
              Choose an assignment to see a preview of what is going to be
              transferred
            </div>
          </div>
        )}
      </main>
      <footer>
        <button
          className="btn-primary"
          onClick={() => onSubmit({ results: tableContent, destination })}
        >
          Transfer to Ladok
        </button>
      </footer>
    </div>
  );
}
