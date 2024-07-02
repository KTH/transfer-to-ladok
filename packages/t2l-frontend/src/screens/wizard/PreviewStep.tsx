import React from "react";
import { UserSelection } from "./SelectionStep";
import {
  useCanvasGrades,
  useGradeableStudents,
  useLadokParticipants,
} from "../../hooks/apiClient";
import Loading from "../../components/Loading";
import {
  GradeWithStatus,
  getTransferencePreview,
} from "../../utils/mergeGradesList";
import { BackButton } from "@kth/style";

interface PreviewStepProps {
  userSelection: UserSelection;
  onBack: () => void;
  onSubmit: (input: GradeWithStatus[]) => void;
}

function comparator(a: GradeWithStatus, b: GradeWithStatus) {
  if (a.student.anonymousCode && b.student.anonymousCode) {
    return a.student.anonymousCode.localeCompare(b.student.anonymousCode, "sv");
  } else if (a.student.anonymousCode && !b.student.anonymousCode) {
    return -1;
  } else if (!a.student.anonymousCode && b.student.anonymousCode) {
    return 1;
  } else {
    return a.student.sortableName.localeCompare(b.student.sortableName, "sv");
  }
}

export default function PreviewStep({
  userSelection,
  onBack,
  onSubmit,
}: PreviewStepProps) {
  const { assignment, destination, date } = userSelection;

  // Fetch submissions and gradeable students
  const ladokGradesQuery = useGradeableStudents(destination.value);
  const canvasGradesQuery = useCanvasGrades(assignment.id);
  const ladokParticipantsQuery = useLadokParticipants();

  if (ladokGradesQuery.isError) {
    throw ladokGradesQuery.error;
  }

  if (canvasGradesQuery.isError) {
    throw canvasGradesQuery.error;
  }

  if (ladokParticipantsQuery.isError) {
    throw ladokParticipantsQuery.error;
  }

  if (!ladokGradesQuery.data || !ladokParticipantsQuery.data) {
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
    ladokParticipantsQuery.data,
    date
  )
    .slice()
    .sort(comparator);

  const isAnonymous = gradesWithStatus.some((s) => s.student.anonymousCode);
  const nonParticipants = gradesWithStatus.filter(
    (t) =>
      t.status === "not_transferable" && t.cause?.code === "not_participant"
  );
  const numberOfTransferrableGrades = gradesWithStatus.filter(
    (t) => t.status === "ready"
  ).length;

  function handleSubmit(grades: GradeWithStatus[]) {
    if (
      window.confirm(
        "You are about to Transfer grades for:\n" +
          `- Assignment: ${userSelection.assignment.name}\n` +
          `- Ladok module: ${userSelection.destination.name}\n` +
          `- Examination date: ${userSelection.date}\n\n` +
          `${numberOfTransferrableGrades} results will be sent to Ladok`
      )
    ) {
      onSubmit(grades);
    }
  }

  return (
    <main className="preview-step">
      <div>
        <BackButton onClick={onBack}>Back to selection</BackButton>
        <dl>
          <div className="field">
            <dt>From (assignment in Canvas)</dt>
            <dd>{assignment.name}</dd>
          </div>
          <div className="field">
            <dt>To (module in Ladok)</dt>
            <dd>{destination.name}</dd>
          </div>
          <div className="field">
            <dt>Examination date</dt>
            <dd>{date}</dd>
          </div>
        </dl>
      </div>
      {nonParticipants.length > 0 && (
        <div>
          <p>
            There are {nonParticipants.length} students that cannot receive
            grades in Ladok:
          </p>
          <ol>
            {nonParticipants.map((p) => (
              <li>{p.student.sortableName}</li>
            ))}
          </ol>
        </div>
      )}
      <h2>Preview</h2>
      <div>
        {numberOfTransferrableGrades}/{gradesWithStatus.length} grades can be
        transferred
      </div>
      <table>
        <thead>
          <tr>
            <th>Student</th>
            {isAnonymous && <th>Anonymous code</th>}
            <th>Canvas grade</th>
            <th>Transferrable</th>
          </tr>
        </thead>
        <tbody>
          {gradesWithStatus.map((tg) => (
            <tr className={tg.status === "ready" ? "do-export-row" : ""}>
              <td>{tg.student.sortableName}</td>
              {isAnonymous && <td>{tg.student.anonymousCode}</td>}
              <td>{tg.canvasGrade}</td>
              <td>{tg.status === "ready" && "Transferrable"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer>
        <BackButton onClick={onBack}>Back to selection</BackButton>
        <button
          className="btn-primary"
          onClick={() => handleSubmit(gradesWithStatus)}
        >
          Transfer to Ladok
        </button>
      </footer>
    </main>
  );
}
