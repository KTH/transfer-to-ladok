import React from "react";
import { Columns } from "t2l-backend/src/apiHandlers/utils/types";

export default function AssignmentSelector({
  columns,
  value,
  onChange,
}: {
  columns: Columns;
  value: string;
  onChange: (value: string) => void;
}) {
  const sortedAssignments = columns.assignments.slice().sort((a, b) => {
    if (a.gradingType === "letter_grade") {
      return -1;
    }
    if (b.gradingType === "letter_grade") {
      return 1;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select an assignment</option>
      <optgroup label="Assignments">
        {sortedAssignments.map((a) => (
          <option value={a.id}>{a.name}</option>
        ))}
      </optgroup>
      <optgroup label="Other columns">
        <option value="total">Total column</option>
      </optgroup>
    </select>
  );
}
