import React, { useState } from "react";
import { GradesDestination } from "t2l-backend/src/types";
import { GradesTable } from "../components/GradesTable";
import { useCanvasGrades, useGradeableStudents } from "../hooks/apiClient";
import { getResultsToBeTransferred } from "../utils/getResultsToBeTransferred";
import { ArrowRight } from "../utils/icons";
import { IndeterminateProgressBar } from "../components/ProgressBar";
import AssignmentSelector from "../components/AssignmentSelector";
import DateSelector from "../components/DateSelector";
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

  const readyToTransfer =
    !ladokGradesQuery.isFetching &&
    !canvasGradesQuery.isFetching &&
    tableContent.filter((r) => r.status === "transferable").length > 0;

  return (
    <div className="Preview">
      <header>
        <div>Select a Canvas assignment to transfer to the Ladok module</div>
        <div className="assignment">
          <AssignmentSelector value={assignmentId} onChange={setAssignmentId} />
          <ArrowRight />
          <div className="destination">{destinationName}</div>
        </div>
        <DateSelector value={{ option: "default-date" }} onChange={() => {}} />
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
      <footer className={readyToTransfer ? "" : "disabled"}>
        <p className="disclaimer">
          By clicking the button you will transfer the grades in the table
          above. Grades will be submitted as “Draft” (utkast) in Ladok
        </p>
        <button
          className="btn-primary"
          onClick={() => onSubmit({ results: tableContent, destination })}
          disabled={!readyToTransfer}
        >
          Transfer to Ladok
        </button>
      </footer>
    </div>
  );
}
