import React, { useState } from "react";
import { GradesDestination } from "t2l-backend";
import { GradesTable } from "../components/GradesTable";
import {
  useAssignments,
  useCanvasGrades,
  useGradeableStudents,
} from "../hooks/apiClient";
import {
  getNonRegisteredStudents,
  getResultsToBeTransferred,
} from "../utils/getResultsToBeTransferred";
import Loading from "../components/Loading";
import { ArrowRight, Warning } from "../utils/icons";
import AssignmentSelector from "../components/AssignmentSelector";
import ExaminationDateSelector, {
  ExaminationDate as ExaminationDateValues,
} from "../components/ExaminationDateSelector";
import "./Preview.scss";
import { SendGradesInput } from "../hooks/useSendGrades";

export default function Preview({
  fixedExaminationDate,
  destinationName,
  destination,
  ladokUrl,
  onSubmit,
}: {
  fixedExaminationDate?: string;
  destinationName: string;
  destination: GradesDestination;
  ladokUrl: string;
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

  const nonRegistered = getNonRegisteredStudents(
    canvasGradesQuery.data ?? [],
    ladokGradesQuery.data ?? []
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

  if (ladokGradesQuery.data.length === 0) {
    return (
      <div>
        <h2>All results have been already transferred</h2>
        <p>
          <a href={ladokUrl} target="_blank">
            Go to Ladok to see the results.
          </a>{" "}
          From there you can continue the process: mark grades as ready (
          <em>klarmarkera</em>), certify (<em>attestera</em>) and make any other
          adjustments
        </p>
      </div>
    );
  }

  const selectedAssignment = assignmentsQuery.data.assignments.find(
    (a) => a.id === assignmentId
  );

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
        {selectedAssignment &&
          selectedAssignment.gradingType !== "letter_grade" && (
            <div className="warning">
              <Warning className="warning-icon" />
              <div className="warning-text">
                This assignment does not have letter grades so it is not
                possible to transfer results to Ladok from it. Choose a
                different assignment or set letter grade type to this
                assignment.
              </div>
            </div>
          )}

        {assignmentId === "total" &&
          !assignmentsQuery.data.finalGrades.hasLetterGrade && (
            <div className="warning">
              <Warning className="warning-icon" />
              <div className="warning-text">
                The course has no letter grades set up so it is not possible to
                transfer results to Ladok from total column. Choose a different
                assignment or set letter grade type in course settings.
              </div>
            </div>
          )}
        <ExaminationDateSelector
          fixedOption={fixedExaminationDate}
          value={examinationDateOption}
          onChange={setExaminationDateOption}
        />
        {examinationDateOption.option === "submission-date" &&
          assignmentId === "total" && (
            <div className="warning">
              <Warning className="warning-icon" />
              <div className="warning-text">
                The “Total” column does not have submission date. Select a
                manual examination date instead
              </div>
            </div>
          )}
        {examinationDateOption.option === "submission-date" &&
          selectedAssignment?.hasSubmissions === false && (
            <div className="warning">
              <Warning className="warning-icon" />
              <div className="warning-text">
                The assignment <em>{selectedAssignment?.name}</em> does not have
                any submissions and therefore there is no submission date.
                Select manual input instead.
              </div>
            </div>
          )}
      </header>
      <main className="main">
        <header>
          {/* <div>
            {ladokGradesQuery.data.length} students remaining (without grades in
            Ladok).{" "}
            <a href={ladokUrl} target="_blank">
              Check it in Ladok
            </a>
          </div>
          <div>
            {tableContent.filter((r) => r.status === "transferable").length}{" "}
            results are ready to be transferred
          </div> */}
        </header>
        {canvasGradesQuery.isFetching && (
          <div className="loading-state">
            <Loading>Loading results from Canvas...</Loading>
          </div>
        )}
        {!canvasGradesQuery.isFetching &&
          "aktivitetstillfalle" in destination &&
          nonRegistered.length > 0 && (
            <div className="warning">
              <Warning className="warning-icon" />
              <div className="warning-text">
                {nonRegistered.length} students have to be graded manually in Ladok.
                <details>
                  <summary>More info</summary>
                  <p>The following students are not registered for the examination in Ladok, and therefor have to be graded manually in Ladok:</p>

                  <ul>
                    {nonRegistered.map((grade) => (
                      <li key={grade.student.id}>
                        {grade.student.sortableName}, grade: {grade.grade}, 
                      </li>
                    ))}
                  </ul>
                </details>
              </div>
            </div>
          )}
        {!canvasGradesQuery.isFetching && assignmentId !== "" && (
          <GradesTable results={tableContent} />
        )}
        {!canvasGradesQuery.isFetching && assignmentId === "" && (
          <div className="empty-state">
            <div>
              Select an assignment to see a preview of what is going to be
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
