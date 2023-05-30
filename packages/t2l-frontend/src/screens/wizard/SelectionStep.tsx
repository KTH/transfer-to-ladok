/* eslint-disable @typescript-eslint/no-empty-function */
import React from "react";
import { Select, Option, OptionGroup } from "@kth/style";
import { useAssignments, useSections } from "../../hooks/apiClient";
import Loading from "../../components/Loading";
import { GradesDestination, Sections } from "t2l-backend";

interface SelectionStepProps {
  onSubmit: () => void;
}

interface LadokModulesSelectProps {
  onChange: (value: GradesDestination | null) => void;
  value: GradesDestination | null;
  ladokModules: Sections;
}
function LadokModuleSelect({
  onChange,
  value,
  ladokModules,
}: LadokModulesSelectProps) {
  const examinationLength = ladokModules.aktivitetstillfalle.length;
  const firstExamination = ladokModules.aktivitetstillfalle[0].id;

  React.useEffect(() => {
    if (examinationLength === 1) {
      onChange({
        aktivitetstillfalle: firstExamination,
      });
    }
  }, [examinationLength, firstExamination]);

  return (
    <Select
      name="ladok-module"
      value={JSON.stringify(value)}
      onChange={(value) => onChange(JSON.parse(value))}
      label="Ladok module"
      description="To which module do you want the grades to be transferred"
    >
      <Option value="null">Select module</Option>
      {ladokModules.aktivitetstillfalle.map((a) => (
        <Option
          key={JSON.stringify({
            aktivitetstillfalle: a.id,
          })}
          value={JSON.stringify({
            aktivitetstillfalle: a.id,
          })}
        >
          {a.name}
        </Option>
      ))}

      {ladokModules.kurstillfalle.map((section) => (
        <OptionGroup label={`${section.courseCode} - (${section.roundCode})`}>
          {section.modules.map((m) => (
            <Option
              key={JSON.stringify({
                kurstillfalle: section.id,
                utbildningsinstans: m.utbildningsinstans,
              })}
              value={JSON.stringify({
                kurstillfalle: section.id,
                utbildningsinstans: m.utbildningsinstans,
              })}
            >
              {m.name}
            </Option>
          ))}
          <Option
            value={JSON.stringify({
              kurstillfalle: section.id,
              utbildningsinstans: section.utbildningsinstans,
            })}
          >
            Final grade
          </Option>
        </OptionGroup>
      ))}
    </Select>
  );
}

export default function SelectionStep({ onSubmit }: SelectionStepProps) {
  const [selectedAssignment, setSelectedAssignment] = React.useState("");
  const [selectedLadokDestination, setSelectedLadokDestination] =
    React.useState<GradesDestination | null>(null);

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
            <Option key={assignment.id} value={assignment.id}>
              {assignment.name}
            </Option>
          ))}
        </OptionGroup>
        <OptionGroup label="Other columns">
          <Option value="final-grade">Total column</Option>
        </OptionGroup>
      </Select>
      <LadokModuleSelect
        onChange={(value) => setSelectedLadokDestination(value)}
        value={selectedLadokDestination}
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
