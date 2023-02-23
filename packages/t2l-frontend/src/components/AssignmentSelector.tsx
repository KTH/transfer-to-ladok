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
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select an assignment</option>
      <optgroup label="Assignments">
        {columns.assignments.map((a) => (
          <option value={a.id}>{a.name}</option>
        ))}
      </optgroup>
      <optgroup label="Other columns">
        <option value="total" disabled={!columns.finalGrades.hasLetterGrade}>
          Total column
        </option>
      </optgroup>
    </select>
  );
}
