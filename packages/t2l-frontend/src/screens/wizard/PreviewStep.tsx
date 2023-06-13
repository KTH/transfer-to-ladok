import React from "react";
import { UserSelection } from "./SelectionStep";
import { useCanvasGrades, useGradeableStudents } from "../../hooks/apiClient";
import Loading from "../../components/Loading";
import { TG, mergeGradesLists } from "../../utils/mergeGradesList";

interface PreviewStepProps {
  userSelection: UserSelection;
  onBack: () => void;
  onSubmit: (input: TG[]) => void;
}

export default function PreviewStep({
  userSelection,
  onBack,
  onSubmit,
}: PreviewStepProps) {
  const { assignment, destination, date } = userSelection;

  // Fetch submissions and gradeable students
  const ladokGradesQuery = useGradeableStudents(destination);
  const canvasGradesQuery = useCanvasGrades(assignment);

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

  const tgs = mergeGradesLists(
    canvasGradesQuery.data,
    ladokGradesQuery.data,
    date
  )
    .slice()
    .sort((a, b) =>
      a.student.sortableName.localeCompare(b.student.sortableName, "sv")
    );

  return (
    <div>
      <div>
        Your selection.
        <ul>
          <li>
            Assignment: <strong>{assignment}</strong>
          </li>
          <li>
            Date: <strong>{date}</strong>
          </li>
        </ul>
      </div>
      <h2>Preview</h2>
      <div>
        {tgs.filter((t) => t.transferable).length}/{tgs.length} grades can be
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
          {tgs.map((tg) => (
            <tr>
              <td>{tg.student.sortableName}</td>
              <td>{tg.transferable && tg.draft.grade}</td>
              <td>{tg.transferable && "Transferrable"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={onBack}>Back</button>
      <button onClick={() => onSubmit(tgs)}>Submit</button>
    </div>
  );
}
