/* eslint-disable @typescript-eslint/no-empty-function */
import React from "react";
import { Select, Option, OptionGroup } from "@kth/style";
import { useAssignments, useSections } from "../../hooks/apiClient";
import Loading from "../../components/Loading";

interface SelectionStepProps {
  onSubmit: () => void;
}

export default function SelectionStep({ onSubmit }: SelectionStepProps) {
  const [selectedAssignment, setSelectedAssignment] = React.useState("");
  const [selectedLadokModule, setSelectedLadokModule] = React.useState("");

  const ladokModulesQuery = useSections();
  const canvasAssignmentsQuery = useAssignments();

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
    <form onSubmit={onSubmit}>
      <h1>Select assignment and date</h1>
      <p>
        In this step you map a Canvas assignment to a Ladok module or
        examination.
      </p>
      <Select
        name="canvas-assignment"
        value=""
        onChange={(value) => setSelectedAssignment(value)}
        label="Select assignment"
        description="Only letter grades will be transferred to Ladok: A-F grades or P/F"
      >
        <Option value="">Select an assignment</Option>
        <OptionGroup label="Assignments">
          {canvasAssignmentsQuery.data.assignments.map((assignment) => (
            <Option value={assignment.id}>{assignment.name}</Option>
          ))}
        </OptionGroup>
        <OptionGroup label="Other columns">
          <Option value="final-grade">Total column</Option>
        </OptionGroup>
      </Select>
      <Select
        name="ladok-module"
        value="1"
        onChange={() => {}}
        label="Ladok module"
        description="To which module do you want the grades to be transferred"
      >
        <Option value="">Select a Ladok module</Option>
        {ladokModulesQuery.data.kurstillfalle.map((section) => (
          <OptionGroup label={`${section.courseCode} - (${section.roundCode})`}>
            {section.modules.map((module) => (
              <Option value={module.utbildningsinstans}>{module.name}</Option>
            ))}
            <Option value={section.utbildningsinstans}>Final grade</Option>
          </OptionGroup>
        ))}
      </Select>
      <h2>Examination date</h2>
      <p>
        All affected grades will receive the same Examination Date. To set a
        different date on an individual level, change it in Ladok after
        transferring.
      </p>
      <button>Continue</button> (Nothing is transferred yet)
    </form>
  );
}
