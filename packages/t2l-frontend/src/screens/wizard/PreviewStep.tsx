import React from "react";
import { UserSelection } from "./SelectionStep";
import { useCanvasGrades, useGradeableStudents } from "../../hooks/apiClient";
import Loading from "../../components/Loading";
import {
  GradeWithStatus,
  getTransferencePreview,
} from "../../utils/mergeGradesList";

interface PreviewStepProps {
  userSelection: UserSelection;
  onBack: () => void;
  onSubmit: (input: GradeWithStatus[]) => void;
}

export default function PreviewStep({
  userSelection,
  onBack,
  onSubmit,
}: PreviewStepProps) {
  const { assignment, destination, date } = userSelection;

  // Fetch submissions and gradeable students
  const ladokGradesQuery = useGradeableStudents(destination);
  const canvasGradesQuery = useCanvasGrades(assignment.id);

  if (ladokGradesQuery.isError) {
    throw ladokGradesQuery.error;
  }

  if (canvasGradesQuery.isError) {
    throw canvasGradesQuery.error;
  }

  if (!ladokGradesQuery.data) {
    return <Loading>Getting students list from Ladok...</Loading>;
  }

  if (ladokGradesQuery.data.length === 0) {
    return (
      <div>
        <h2>All results have been already transferred</h2>
        <p>
          {/* TODO: Get ladokUrl and show it here */}
          {/* <a href={ladokUrl} target="_blank">
            Go to Ladok to see the results.
          </a>{" "} */}
          From there you can continue the process: mark grades as ready (
          <em>klarmarkera</em>), certify (<em>attestera</em>) and make any other
          adjustments
        </p>
      </div>
    );
  }

  if (!canvasGradesQuery.data) {
    return <Loading>Getting Canvas grades...</Loading>;
  }

  const gradesWithStatus = getTransferencePreview(
    canvasGradesQuery.data,
    ladokGradesQuery.data,
    date
  )
    .slice()
    .sort((a, b) =>
      a.student.sortableName.localeCompare(b.student.sortableName, "sv")
    );

  const numberOfTransferrableGrades = gradesWithStatus.filter(
    (t) => t.status === "ready"
  ).length;

  // TODO: show "from" (assignment name) and "to" (Ladok module)
  // TODO: mark transferable with green and a checkmark
  // TODO: "move back" up
  // TOOD: show modal when clicking on submit.
  // TODO: change Submit text to "Transfer to ladok"
  // TODO: Style table
  return (
    <div>
      <div>
        Your selection.
        <ul>
          <li>
            Assignment: <strong>{assignment.name}</strong>
          </li>
          <li>
            Date: <strong>{date}</strong>
          </li>
        </ul>
      </div>
      <h2>Preview</h2>
      <div>
        {numberOfTransferrableGrades}/{gradesWithStatus.length} grades can be
        transferred
      </div>
      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Canvas grade</th>
            <th>Transferrable</th>
          </tr>
        </thead>
        <tbody>
          {gradesWithStatus.map((tg) => (
            <tr>
              <td>{tg.student.sortableName}</td>
              <td>{tg.canvasGrade}</td>
              <td>{tg.status === "ready" && "Transferrable"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={onBack}>Back</button>
      <button onClick={() => onSubmit(gradesWithStatus)}>Submit</button>
    </div>
  );
}
