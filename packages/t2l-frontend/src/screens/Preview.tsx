import React, { useState } from "react";
import { GradesDestination } from "t2l-backend/src/types";
import { GradesTable } from "../components/GradesTable";
import {
  useAssignments,
  useCanvasGrades,
  useGradeableStudents,
} from "../hooks/apiClient";
import { getResultsToBeTransferred } from "../utils/getResultsToBeTransferred";
import Loading from "../components/Loading";
import { ArrowRight } from "../utils/icons";
import { IndeterminateProgressBar } from "../components/ProgressBar";
import AssignmentSelector from "../components/AssignmentSelector";
import DateSelector, {
  Values as ExaminationDateValues,
} from "../components/DateSelector";
import "./Preview.scss";
import { SendGradesInput } from "../hooks/useSendGrades";

export default function Preview({
  fixedExaminationDate,
  destinationName,
  destination,
  onSubmit,
}: {
  fixedExaminationDate?: string;
  destinationName: string;
  destination: GradesDestination;
  onSubmit(results: SendGradesInput): void;
}) {
  const [assignmentId, setAssignmentId] = useState<string>("");

  const ladokGradesQuery = useGradeableStudents(destination);
  const canvasGradesQuery = useCanvasGrades(assignmentId);
  const assignmentsQuery = useAssignments();

  const [examinationDateOption, setExaminationDateOption] =
    React.useState<ExaminationDateValues>(
      fixedExaminationDate
        ? { option: "fixed-date" }
        : { option: "submission-date" }
    );

  const tableContent = getResultsToBeTransferred(
    canvasGradesQuery.data ?? [],
    ladokGradesQuery.data ?? [],
    (grade) => {
      const fallback = new Date().toISOString().split("T")[0];

      switch (examinationDateOption.option) {
        case "fixed-date":
          return fixedExaminationDate ?? fallback;
        case "manual-date":
          return examinationDateOption.date;
        case "submission-date":
          return grade.submittedAt?.split("T")[0] ?? "";
      }
    }
  );

  const readyToTransfer =
    !ladokGradesQuery.isFetching &&
    !canvasGradesQuery.isFetching &&
    tableContent.filter((r) => r.status === "transferable").length > 0;

  if (ladokGradesQuery.isError) {
    throw ladokGradesQuery.error;
  }

  if (assignmentsQuery.isError) {
    throw assignmentsQuery.error;
  }

  if (canvasGradesQuery.isError) {
    throw canvasGradesQuery.error;
  }

  if (!ladokGradesQuery.data || !assignmentsQuery.data) {
    return (
      <div>
        <Loading>Loading...</Loading>
      </div>
    );
  }

  return (
    <div className="Preview">
      <header>
        <div>Select a Canvas assignment to transfer to the Ladok module</div>
        <div className="assignment">
          <AssignmentSelector
            columns={assignmentsQuery.data}
            value={assignmentId}
            onChange={setAssignmentId}
          />
          <ArrowRight />
          <div className="destination">{destinationName}</div>
        </div>
        <DateSelector
          fixedOption={fixedExaminationDate}
          value={examinationDateOption}
          onChange={setExaminationDateOption}
        />
      </header>
      <main className="main">
        <IndeterminateProgressBar visible={canvasGradesQuery.isFetching} />
        {assignmentId !== "" && <GradesTable results={tableContent} />}
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
