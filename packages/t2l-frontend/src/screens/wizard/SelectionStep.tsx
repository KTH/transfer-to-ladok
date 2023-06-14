/* eslint-disable @typescript-eslint/no-empty-function */
import React from "react";
import { useAssignments, useSections } from "../../hooks/apiClient";
import Loading from "../../components/Loading";
import { GradesDestination } from "t2l-backend";
import ExaminationDateSelect from "../../components/ExaminationDateSelect";
import LadokModuleSelect from "../../components/LadokModuleSelect";
import AssignmentSelect from "../../components/AssignmentSelect";

export interface UserSelection {
  assignment: string;
  destination: GradesDestination;
  date: string;
}

interface SelectionStepProps {
  onSubmit: (value: UserSelection) => void;
}

export default function SelectionStep({ onSubmit }: SelectionStepProps) {
  const [selectedAssignment, setSelectedAssignment] = React.useState("");
  const [selectedLadokDestination, setSelectedLadokDestination] =
    React.useState<GradesDestination | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);

  const [assignmentError, setAssignmentError] = React.useState<
    string | undefined
  >(undefined);
  const [ladokModuleError, setLadokModuleError] = React.useState<
    string | undefined
  >(undefined);
  const [examinationDateError, setExaminationDateError] = React.useState<
    string | undefined
  >(undefined);

  const ladokModulesQuery = useSections();
  const canvasAssignmentsQuery = useAssignments();

  function handleAssignmentChange(value: string) {
    setSelectedAssignment(value);

    if (value === "") {
      setAssignmentError("");
      return;
    } else if (value === "total") {
      if (canvasAssignmentsQuery.data?.finalGrades.hasLetterGrade) {
        setAssignmentError(
          "The total column in this course does not have letter grades. Choose a different assignment or go to Canvas to configure letter grades for the course"
        );
      } else {
        setAssignmentError(undefined);
      }
    } else if (value !== "total") {
      const assignment = canvasAssignmentsQuery.data?.assignments.find(
        (assignment) => assignment.id === value
      );

      if (assignment?.gradingType !== "letter_grade") {
        setAssignmentError(
          "This assignment does not have letter grades. Choose a different assignment or go to Canvas to configure letter grades for the assignment"
        );
      } else {
        setAssignmentError(undefined);
      }
    } else {
      setAssignmentError("Invalid assignment");
    }
  }

  function handleLadokModuleChange() {}

  function handleExaminationDateChange() {}

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // TODO: show error messages when the submission is not valid
    if (selectedAssignment === "") {
      return;
    }

    if (selectedLadokDestination === null) {
      return;
    }

    if (selectedDate === null) {
      return;
    }

    onSubmit({
      assignment: selectedAssignment,
      destination: selectedLadokDestination,
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
        onChange={handleAssignmentChange}
        error={assignmentError}
      />
      <LadokModuleSelect
        onChange={(value) => setSelectedLadokDestination(value)}
        value={selectedLadokDestination}
        ladokModules={ladokModulesQuery.data}
      />
      <ExaminationDateSelect onChange={setSelectedDate} value={selectedDate} />
      <button className="kth-button primary">Continue</button> (Nothing is
      transferred yet)
    </form>
  );
}
