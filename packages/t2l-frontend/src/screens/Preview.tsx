import React, { useState } from "react";
import { GradesDestination } from "t2l-backend";
import { GradesTable } from "../components/GradesTable";
import {
  useAssignments,
  useCanvasGrades,
  useGradeableStudents,
} from "../hooks/apiClient";
import { getResultsToBeTransferred } from "../utils/getResultsToBeTransferred";
import { ArrowRight } from "../utils/icons";
import { IndeterminateProgressBar } from "../components/ProgressBar";
import "./Preview.scss";
import { SendGradesInput } from "../hooks/useSendGrades";

interface Params {
  destination: GradesDestination;
  onSubmit(results: SendGradesInput): void;
}

function AssignmentSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const assignmentsQuery = useAssignments();
  if (assignmentsQuery.isLoading) {
    return (
      <select disabled>
        <option>Loading assignments...</option>
      </select>
    );
  }

  if (assignmentsQuery.isSuccess) {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select an assignment</option>
        <optgroup label="Assignments">
          {assignmentsQuery.data.assignments.map((a) => (
            <option value={a.id} disabled={a.gradingType !== "letter_grade"}>
              {a.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="Other columns">
          <option
            value="total"
            disabled={!assignmentsQuery.data.finalGrades.hasLetterGrade}
          >
            Total column
          </option>
        </optgroup>
      </select>
    );
  }

  return <select></select>;
}

export default function Preview({ destination, onSubmit }: Params) {
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
          <div className="destination">ME1039 TENA: 2021-06-08</div>
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
          onClick={() => onSubmit({ results: tableContent, destination })}
        >
          Transfer to Ladok
        </button>
      </footer>
    </div>
  );
}
