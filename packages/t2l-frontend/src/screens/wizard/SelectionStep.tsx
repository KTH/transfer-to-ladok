/* eslint-disable @typescript-eslint/no-empty-function */
import React from "react";
import { Select, Option, OptionGroup } from "@kth/style";
import { useAssignments, useSections } from "../../hooks/apiClient";
import Loading from "../../components/Loading";
import { Sections } from "t2l-backend";

interface SelectionStepProps {
  onSubmit: () => void;
}

interface LadokModulesSelectProps {
  onChange: (value: string) => void;
  value: string;
  ladokModules: Sections;
}
function LadokModuleSelect({
  onChange,
  value,
  ladokModules,
}: LadokModulesSelectProps) {
  return (
    <Select
      name="ladok-module"
      value={value}
      onChange={onChange}
      label="Ladok module"
      description="To which module do you want the grades to be transferred"
    >
      {ladokModules.aktivitetstillfalle.map((a) => (
        <Option value={a.id}>{a.name}</Option>
      ))}

      {ladokModules.kurstillfalle.map((section) => (
        <OptionGroup label={`${section.courseCode} - (${section.roundCode})`}>
          {section.modules.map((module) => (
            <Option value={module.utbildningsinstans}>{module.name}</Option>
          ))}
          <Option value={section.utbildningsinstans}>Final grade</Option>
        </OptionGroup>
      ))}
    </Select>
  );
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
        value={selectedAssignment}
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
      <LadokModuleSelect
        onChange={(value) => setSelectedLadokModule(value)}
        value={selectedLadokModule}
        ladokModules={ladokModulesQuery.data}
      />
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
