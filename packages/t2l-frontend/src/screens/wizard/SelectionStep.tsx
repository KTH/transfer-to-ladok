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

export default function SelectionStep({ onSubmit }: SelectionStepProps) {
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);

  const [examinationDateError, setExaminationDateError] = React.useState<
    string | undefined
  >(undefined);

  const ladokModulesQuery = useSections();
  const canvasAssignmentsQuery = useAssignments();

  const [selectedAssignment, assignmentError, setSelectedAssignment] =
    useValidatedState("", (value) =>
      validateAssignment(canvasAssignmentsQuery.data, value)
    );

  const [selectedLadokModule, ladokModuleError, setSelectedLadokModule] =
    useValidatedState<GradesDestination | null>(null, validateLadokModule);

  function handleExaminationDateChange(value: string | null) {
    setSelectedDate(value);
    if (value === null) {
      setExaminationDateError("Required field");
    } else {
      setExaminationDateError(undefined);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // TODO: show error messages when the submission is not valid
    if (selectedAssignment === "") {
      return;
    }

    if (selectedLadokModule === null) {
      return;
    }

    if (selectedDate === null) {
      return;
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
        onChange={handleExaminationDateChange}
        error={examinationDateError}
        value={selectedDate}
      />
      <button className="kth-button primary">Continue</button> (Nothing is
      transferred yet)
    </form>
  );
}
