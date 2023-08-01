import React from "react";
import { Select, Option, OptionGroup } from "@kth/style";
import { Columns } from "t2l-backend";

export default function AssignmentSelect({
  columns,
  value,
  error,
  onChange,
}: {
  columns: Columns;
  value: string;
  error: string | undefined;
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
    <div>
      <div className="select-wrapper">
        <select
          className="custom-select"
          value={value}
          name="canvas_assignment"
          onChange={(event) => onChange(parseInt(event.target.value, 10))}
        >
          <option value={-1} disabled hidden>
            Select assignment
          </option>
          {
            // sort letter grade first, then the rest grouped by grading type
            sortedAssignments.map((assignment) => (
              <option key={assignment.id} value={assignment.id}>
                {assignment.name}:{assignment.gradingType.replace("_", " ")}
              </option>
            ))
          }
        </select>
      </div>
      {/*assignmentWarning*/}
    </div>
  );
}
