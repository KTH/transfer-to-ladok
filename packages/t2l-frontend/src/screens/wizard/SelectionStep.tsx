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

  const ladokModulesQuery = useSections();
  const canvasAssignmentsQuery = useAssignments();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // TODO: do not allow submission if any of the fields are empty
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
        onChange={setSelectedAssignment}
      />
      <LadokModuleSelect
        onChange={(value) => setSelectedLadokDestination(value)}
        value={selectedLadokDestination}
        ladokModules={ladokModulesQuery.data}
      />
      <ExaminationDateSelect onChange={setSelectedDate} value={selectedDate} />
      <button>Continue</button> (Nothing is transferred yet)
    </form>
  );
}
