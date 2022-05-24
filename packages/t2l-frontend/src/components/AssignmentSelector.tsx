import React from "react";
import { useAssignments } from "../hooks/apiClient";

export default function AssignmentSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const assignmentsQuery = useAssignments();
  if (assignmentsQuery.isLoading) {
    return (
      <select disabled>
        <option>Loading assignments...</option>
      </select>
    );
  }

  if (assignmentsQuery.isSuccess) {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select an assignment</option>
        <optgroup label="Assignments">
          {assignmentsQuery.data.assignments.map((a) => (
            <option value={a.id} disabled={a.gradingType !== "letter_grade"}>
              {a.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="Other columns">
          <option
            value="total"
            disabled={!assignmentsQuery.data.finalGrades.hasLetterGrade}
          >
            Total column
          </option>
        </optgroup>
      </select>
    );
  }

  return <select></select>;
}
