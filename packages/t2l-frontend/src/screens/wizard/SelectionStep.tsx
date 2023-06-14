/* eslint-disable @typescript-eslint/no-empty-function */
import React from "react";
import { useAssignments, useSections } from "../../hooks/apiClient";
import Loading from "../../components/Loading";
import { GradesDestination, Columns } from "t2l-backend";
import ExaminationDateSelect from "../../components/ExaminationDateSelect";
import LadokModuleSelect from "../../components/LadokModuleSelect";
import AssignmentSelect from "../../components/AssignmentSelect";
import { useValidatedState } from "../../hooks/utils";

export interface UserSelection {
  assignment: string;
  destination: GradesDestination;
  date: string;
}

interface SelectionStepProps {
  onSubmit: (value: UserSelection) => void;
}

function validateAssignment(
  allColumns: Columns | undefined,
  assignmentId: string
): string | undefined {
  console.log("validate assignment");
  if (!allColumns) {
    return "Assignments are not loaded";
  }

  if (assignmentId === "") {
    return "Required field";
  }

  if (assignmentId === "total") {
    return allColumns.finalGrades.hasLetterGrade
      ? "The total column in this course does not have letter grades. Choose a different assignment or go to Canvas to configure letter grades for the course"
      : undefined;
  }

  const assignment = allColumns.assignments.find((a) => a.id === assignmentId);

  if (!assignment) {
    return "Assignment not found";
  }

  if (assignment.gradingType !== "letter_grade") {
    return "This assignment does not have letter grades. Choose a different assignment or go to Canvas to configure letter grades for the assignment";
  }
}

function validateLadokModule(
  ladokModule: GradesDestination | null
): string | undefined {
  if (ladokModule === null) {
    return "Required field";
  }
}

function validateExaminationDate(date: string | null): string | undefined {
  if (date === null) {
    return "Required field";
  }
}

export default function SelectionStep({ onSubmit }: SelectionStepProps) {
  const ladokModulesQuery = useSections();
  const canvasAssignmentsQuery = useAssignments();

  const [selectedAssignment, assignmentError, setSelectedAssignment] =
    useValidatedState("", (value) =>
      validateAssignment(canvasAssignmentsQuery.data, value)
    );
  const [selectedLadokModule, ladokModuleError, setSelectedLadokModule] =
    useValidatedState<GradesDestination | null>(null, validateLadokModule);
  const [selectedDate, examinationDateError, setSelectedDate] =
    useValidatedState<string | null>(null, validateExaminationDate);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Force validation
    setSelectedAssignment(selectedAssignment);
    setSelectedLadokModule(selectedLadokModule);
    setSelectedDate(selectedDate);

    // Validate everything
    if (
      validateAssignment(canvasAssignmentsQuery.data, selectedAssignment) !==
        undefined ||
      validateLadokModule(selectedLadokModule) !== undefined ||
      validateExaminationDate(selectedDate) !== undefined
    ) {
      return;
    }

    if (selectedLadokModule === null) {
      throw new Error("Ladok module is null and validation didn't catch it");
    } else if (selectedDate === null) {
      throw new Error(
        "Examination date is null and validation didn't catch it"
      );
    }

    onSubmit({
      assignment: selectedAssignment,
      destination: selectedLadokModule,
      date: selectedDate,
    });
  }

  if (ladokModulesQuery.isError) {
    throw ladokModulesQuery.error;
  }

  if (!ladokModulesQuery.data || !canvasAssignmentsQuery.data) {
    return (
      <div>
        <Loading>Loading...</Loading>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Select assignment and date</h1>
      <p>
        In this step you map a Canvas assignment to a Ladok module or
        examination.
      </p>
      <AssignmentSelect
        columns={canvasAssignmentsQuery.data}
        value={selectedAssignment}
        onChange={setSelectedAssignment}
        error={assignmentError}
      />
      <LadokModuleSelect
        onChange={setSelectedLadokModule}
        value={selectedLadokModule}
        ladokModules={ladokModulesQuery.data}
        error={ladokModuleError}
      />
      <ExaminationDateSelect
        onChange={setSelectedDate}
        error={examinationDateError}
        value={selectedDate}
      />
      <button className="kth-button primary">Continue</button> (Nothing is
      transferred yet)
    </form>
  );
}
