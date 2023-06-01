import React from "react";
import { Select, Option, OptionGroup } from "@kth/style";
import { Columns } from "t2l-backend";

export default function AssignmentSelect({
  columns,
  value,
  onChange,
}: {
  columns: Columns;
  value: string;
  onChange: (value: string) => void;
}) {
  const sortedAssignments = columns.assignments.slice().sort((a, b) => {
    if (a.gradingType === "letter_grade" && b.gradingType !== "letter_grade") {
      return -1;
    }
    if (b.gradingType === "letter_grade" && a.gradingType !== "letter_grade") {
      return 1;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <Select
      name="canvas-assignment"
      value={value}
      onChange={(value) => onChange(value)}
      label="Select assignment"
      description="Only letter grades will be transferred to Ladok: A-F grades or P/F"
    >
      <Option value="">Select an assignment</Option>
      <OptionGroup label="Assignments">
        {sortedAssignments.map((assignment) => (
          <Option key={assignment.id} value={assignment.id}>
            {assignment.name}
          </Option>
        ))}
      </OptionGroup>
      <OptionGroup label="Other columns">
        <Option value="final-grade">Total column</Option>
      </OptionGroup>
    </Select>
  );
}
