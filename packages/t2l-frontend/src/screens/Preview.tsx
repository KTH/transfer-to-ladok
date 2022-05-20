import React, { useState } from "react";
import { GradesDestination } from "t2l-backend";
import GradesTable from "../components/GradesTable";
import {
  useAssignments,
  useCanvasGrades,
  useGradeableStudents,
} from "../hooks/apiClient";
import getResultsToBeTransferred from "../utils/getResultsToBeTransferred";
import { ArrowRight } from "../utils/icons";
import "./Preview.scss";

interface Params {
  destination: GradesDestination;
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
        {assignmentsQuery.data.map((a) => (
          <option value={a.id}>{a.name}</option>
        ))}
        <option value="total">Total column</option>
      </select>
    );
  }

  return <select></select>;
}

export default function Preview({ destination }: Params) {
  const [assignmentId, setAssignmentId] = useState<string>("");

  const ladokGradesQuery = useGradeableStudents(destination);
  const canvasGradesQuery = useCanvasGrades(assignmentId);
  console.log(ladokGradesQuery.status, canvasGradesQuery.status);

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
      <main>
        <GradesTable />
      </main>
      <footer>
        <button>Transfer to Ladok</button>
      </footer>
    </div>
  );
}
